from db import get_db_connection, init_db
from data import fetch_treasury_data_cached
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import timedelta
from datetime import datetime as dt

app = Flask(__name__)

# Initialize database and CORS config on startup
init_db()
CORS(app, origins=[ "http://localhost:5173"])


@app.route('/api/yields/treasury', methods=['GET'])
def fetch_treasury_yields():
    """
    Fetch Treasury yield data for a single date.

    Query params:
      - date: requested date (YYYY-MM-DD)

    Returns JSON like:
      {
        "date": "2025-09-26",
        "yields": {"1 Mo": 100, "2 Mo": 100, "1 Yr": 458, ...}
      }
    """
    try:
        date_param = request.args.get('date')
        if not date_param:
            return jsonify({"error": "Missing required query param 'date' (YYYY-MM-DD)"}), 400

        # Parse input date
        try:
            target_date = dt.strptime(date_param, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid 'date' format. Use YYYY-MM-DD"}), 400

        # If weekend, roll back to Friday (simple business-day logic)
        wd = target_date.weekday()
        if wd == 6:
            target_date = target_date - timedelta(days=2)
        elif wd == 5:
            target_date = target_date - timedelta(days=1)

        year = str(target_date.year)

        # Fetch requested year data (cached)
        try:
            year_data = list(fetch_treasury_data_cached(year))
        except Exception as e:
            return jsonify({"error": f"Failed to fetch data for year {year}: {str(e)}"}), 400

        if not year_data:
            return jsonify({"error": f"No valid Treasury data found for year {year}"}), 404

        # Ensure ascending by date
        year_data.sort(key=lambda x: x["date"], reverse=True)

        # Find the latest record on or before target_date
        found = None
        for rec in year_data:
            if rec["date"] <= target_date:
                found = rec
                break

        if not found:
            return jsonify({
                "error": "No data available on or before the requested date within this year",
                "requested_date": date_param
            }), 404

        return jsonify({
            "date": found["date"].strftime("%Y-%m-%d"),
            "yields": found["yields"]
        }), 200

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
  