import sqlite3

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
