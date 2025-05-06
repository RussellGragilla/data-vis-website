import pandas as pd
import sqlite3

df = pd.read_csv('data/owid-co2-small.csv')

conn = sqlite3.connect('cleaned/emissions.sqlite')

df.to_sql('emissions', conn, if_exists='replace', index=False)

print("Data loaded into SQLite database successfully.")

print(pd.read_sql_query("SELECT * FROM emissions LIMIT 5;", conn))

conn.close()
