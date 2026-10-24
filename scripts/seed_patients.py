import psycopg2
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

def seed_data():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, '..', 'backend', '.env')
    load_dotenv(env_path)
    database_url = os.getenv("DATABASE_URL")
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        patients = [
            ("MRN-2024-001", "Rajesh Kumar", 58, "Male"),
            ("MRN-2024-002", "Priya Patel", 45, "Female"),
            ("MRN-2024-003", "Anil Sharma", 67, "Male"),
            ("MRN-2024-004", "Sunita Rao", 52, "Female"),
            ("MRN-2024-005", "Amit Verma", 38, "Male")
        ]
        
        print("Inserting patients...")
        for mrn, name, age, gender in patients:
            query = "INSERT INTO patients (mrn, name, age, gender, admission_date) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (mrn) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age, gender = EXCLUDED.gender RETURNING id"
            cursor.execute(query, (mrn, name, age, gender, datetime.now() - timedelta(days=2)))
            patient_id = cursor.fetchone()[0]
            
            cursor.execute("SELECT id FROM encounters WHERE patient_id = %s AND status = 'active'", (patient_id,))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO encounters (patient_id, admission_datetime, chief_complaint, status) VALUES (%s, %s, %s, %s)",
                    (patient_id, datetime.now() - timedelta(days=2), "Observation", "active")
                )
        
        conn.commit()
        print("Done: Patient data seeded successfully!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_data()
