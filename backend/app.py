from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import List, Dict, Tuple, Any
from datetime import datetime, date
import requests
from datetime import datetime as dt
import csv
import io
from functools import lru_cache
import sqlite3


app = Flask(__name__)

CORS(app, origins=[ "http://localhost:5173"])
# Database configuration
DATABASE = 'orders.db'

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with the orders table"""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            side TEXT NOT NULL CHECK (side IN ('Buy', 'Sell')),
            tenor TEXT NOT NULL CHECK (tenor IN ('1M', '1.5M', '2M', '3M', '4M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y')),
            issuance_type TEXT NOT NULL CHECK (issuance_type IN ('WI', 'OTR', 'OFTR')),
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            yield REAL NOT NULL CHECK (yield > 0),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()


TREASURY_URL_BASE = "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv"

def _parse_treasury_csv_full_year(csv_text: str) -> List[Dict[str, Any]]:
    """
    Parse Treasury.gov CSV for a full year and return a list of daily data.
    Each item: {"date": <date>, "yields": {"1 Mo": 100, "2 Mo": 100, "1 Yr": 458, ...}}
    """
    reader = csv.DictReader(io.StringIO(csv_text))

    daily_data: List[Dict[str, Any]] = []

    for row in reader:
        date_str = (row.get('Date') or '').strip()
        if not date_str:
            continue

        # Parse CSV date once as a real date object
        try:
            day_date = dt.strptime(date_str, "%m/%d/%Y").date()
        except ValueError:
            # Skip malformed dates rather than breaking the whole parse
            continue

        # Create yields object with all provided terms
        yields: Dict[str, int] = {}
        for treasury_col in row.keys():
            if treasury_col != 'Date':
                val = (row[treasury_col] or '').strip()
                if val:
                    try:
                        yield_pct = float(val)  # CSV provides percentage (e.g., 4.58)
                        yield_bps = int(round(yield_pct * 100))  # % → basis points
                        yields[treasury_col] = yield_bps
                    except ValueError:
                        # Non-numeric or missing value: skip
                        pass

        if yields:
            daily_data.append({
                "date": day_date,
                "yields": yields
            })

    # Sort newest first by actual date
    daily_data.sort(key=lambda x: x["date"], reverse=True)
    return daily_data


  
def _csv_url_for_year(year: str) -> str:
    """
    Build the CSV URL for a given year using the Treasury site structure.
    """
    # Keep your original param pattern intact.
    return (
        f"{TREASURY_URL_BASE}/{year}/all"
        f"?type=daily_treasury_yield_curve&field_tdr_date_value={year}"
        f"&page&_format=csv"
    )


@lru_cache(maxsize=16)
def _fetch_treasury_data_cached(year: str) -> Tuple[Dict[str, Any], ...]:
    """
    Fetch Treasury data for a specific year with LRU caching.
    Returns an immutable tuple of daily records:
      ({'date': date, 'yields': [{'term': '2Y', 'yieldBp': 458}, ...]}, ...)
    """
    url = _csv_url_for_year(year)
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        raise Exception(f"Treasury API failed with status {resp.status_code}")

    parsed: List[Dict[str, Any]] = _parse_treasury_csv_full_year(resp.text)
    return tuple(parsed)
  

@app.route('/api/yields/treasury', methods=['GET'])
def fetch_treasury_yields():
    """
    Fetch Treasury yield data from Treasury.gov with LRU caching.

    Query params:
      - year: single year (defaults to current year)
      - years: comma-separated years (e.g., "2023,2024")
      - start_date: filter start date (YYYY-MM-DD)
      - end_date: filter end date (YYYY-MM-DD)

    Returns JSON like:
      {
        "source": "treasury.gov",
        "years": ["2024", "2025"],
        "data": [
          {"date": "09/26/2025", "yields": {"1 Mo": 100, "2 Mo": 100, "1 Yr": 458, ...}},
          {"date": "09/25/2025", "yields": {"1 Mo": 99, "2 Mo": 101, "1 Yr": 457, ...}},
          ...
        ],
        "count": 252,
        "date_range": {"start_date": "2025-01-01", "end_date": "2025-09-26"}
      }
    """
    try:
        # Years handling — keep user-specified order (don’t sort), but clean entries
        years_param = request.args.get('years')
        default_year = request.args.get('year', str(datetime.now().year))

        if years_param:
            years = [y.strip() for y in years_param.split(',') if y.strip()]
            if not years:
                years = [default_year]
        else:
            years = [default_year]

        # Optional date filters (parse independently; allow either one)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        start_date: date | None = (
            dt.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else None
        )
        end_date: date | None = (
            dt.strptime(end_date_str, "%Y-%m-%d").date() if end_date_str else None
        )

        if start_date and end_date and start_date > end_date:
            return jsonify({"error": "start_date cannot be after end_date"}), 400

        # Fetch and merge all requested years
        all_data: List[Dict[str, Any]] = []
        for year in years:
            try:
                year_data = _fetch_treasury_data_cached(year)
                all_data.extend(list(year_data))
            except Exception as e:
                return jsonify({"error": f"Failed to fetch data for year {year}: {str(e)}"}), 400

        if not all_data:
            return jsonify({"error": "No valid Treasury data found"}), 400

        # Global sort by actual date
        all_data.sort(key=lambda x: x["date"])

        # Apply date filtering (if any)
        if start_date or end_date:
            filtered: List[Dict[str, Any]] = []
            for day in all_data:
                d: date = day["date"]
                if start_date and d < start_date:
                    continue
                if end_date and d > end_date:
                    continue
                filtered.append(day)
            all_data = filtered

        # Serialize dates back to strings for JSON
        response_data = [
            {"date": rec["date"].strftime("%m/%d/%Y"), "yields": rec["yields"]}
            for rec in all_data
        ]

        return jsonify({
            "source": "treasury.gov",
            "years": years,
            "data": response_data,
            "count": len(response_data),
            "date_range": {
                "start_date": start_date_str,
                "end_date": end_date_str
            }
        }), 200

    except ValueError as ve:
        # Bad date format, etc.
        return jsonify({"error": f"Invalid parameter: {str(ve)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Order CRUD endpoints
@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders"""
    try:
        conn = get_db_connection()
        orders = conn.execute('''
            SELECT id, side, tenor, issuance_type, quantity, yield, notes, created_at
            FROM orders 
            ORDER BY created_at DESC
        ''').fetchall()
        conn.close()
        
        return jsonify({
            "orders": [dict(order) for order in orders],
            "count": len(orders)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new order"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['side', 'tenor', 'issuance_type', 'quantity', 'yield']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Validate data types and values
        if data['side'] not in ['Buy', 'Sell']:
            return jsonify({"error": "side must be 'Buy' or 'Sell'"}), 400
            
        valid_tenors = ['1M', '1.5M', '2M', '3M', '4M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y']
        if data['tenor'] not in valid_tenors:
            return jsonify({"error": f"Invalid tenor. Must be one of: {valid_tenors}"}), 400
            
        if data['issuance_type'] not in ['WI', 'OTR', 'OFTR']:
            return jsonify({"error": "issuance_type must be 'WI', 'OTR', or 'OFTR'"}), 400
            
        if not isinstance(data['quantity'], (int, float)) or data['quantity'] <= 0:
            return jsonify({"error": "quantity must be a positive number"}), 400
            
        if not isinstance(data['yield'], (int, float)) or data['yield'] <= 0:
            return jsonify({"error": "yield must be a positive number"}), 400
        
        conn = get_db_connection()
        cursor = conn.execute('''
            INSERT INTO orders (side, tenor, issuance_type, quantity, yield, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['side'],
            data['tenor'],
            data['issuance_type'],
            data['quantity'],
            data['yield'],
            data.get('notes', '')
        ))
        
        order_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "Order created successfully",
            "order_id": order_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Allow CORS
@app.route('/api/<path:_any>', methods=['OPTIONS'])
def cors_preflight(_any): 
    return ('', 204)
  