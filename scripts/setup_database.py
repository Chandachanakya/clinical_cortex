import psycopg2
import os
from dotenv import load_dotenv

def setup_database():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, '..', 'backend', '.env')
    load_dotenv(env_path)
    database_url = os.getenv("DATABASE_URL")
    print(f"Connecting to: {database_url}")
    
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        schema_path = os.path.join(script_dir, '..', 'database', '001_initial_schema.sql')
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
            
        print("Executing schema...")
        cursor.execute(schema_sql)
        print("✓ Success!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_database()
