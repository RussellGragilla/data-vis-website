from flask import Flask, render_template, request, jsonify
import sqlite3
import pandas as pd

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/data')
def data():
    country = request.args.get('country')
    start = request.args.get('start', type=int)
    end = request.args.get('end', type=int)
    
    query = """
        SELECT year, co2
        FROM emissions
        WHERE country = ?
        AND year BETWEEN ? AND ?
        ORDER BY year
    """
    
    conn = sqlite3.connect('cleaned/emissions.sqlite')
    df = pd.read_sql_query(query, conn,  params=(country, start, end))
    conn.close()
    
    return jsonify(df.to_dict(orient='records'))

@app.route('/countries')
def countries():
    conn = sqlite3.connect('cleaned/emissions.sqlite')
    query = "SELECT DISTINCT country FROM emissions ORDER BY country ASC"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return jsonify(df['country'].tolist())

@app.route('/summary')
def summary():
    country = request.args.get('country')
    start = request.args.get('start', type=int)
    end = request.args.get('end', type=int)
    
    conn = sqlite3.connect('cleaned/emissions.sqlite')
    df = pd.read_sql_query("""
        SELECT year, co2 FROM emissions
        WHERE country = ? AND year BETWEEN ? AND ?
        ORDER BY year
    """, conn, params=(country, start, end))
    conn.close()
    
    if df.empty:
        return jsonify({'message': 'No data available for selection.'})
    
    change = df.co2.iloc[-1] - df.co2.iloc[0]
    percent = (change / df.co2.iloc[0]) * 100 if df.co2.iloc[0] else 0
    
    return jsonify({
        'message': f"{country} had a change of {change:.2f} metric tons per capita from {start} to {end}, which is a {percent:.1f}% change."
    })
    
@app.route('/top_emitters')
def top_emitters():
    year = request.args.get('year', type=int)
    query = """
        SELECT country, co2 
        FROM emissions
        WHERE year = ?
        ORDER BY co2 DESC
        LIMIT 10
    """
    conn = sqlite3.connect('cleaned/emissions.sqlite')
    df = pd.read_sql_query(query, conn, params=(year,))
    conn.close()
    return jsonify(df.to_dict(orient='records'))

@app.route('/years')
def years():
    query = """
        SELECT DISTINCT year
        FROM emissions
        ORDER BY year
    """
    conn = sqlite3.connect('cleaned/emissions.sqlite')
    df = pd.read_sql_query(query, conn)
    conn.close()
    return jsonify(df['year'].tolist())

if __name__ == '__main__':
    app.run(debug=True)
