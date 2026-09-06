"""
Database Initialization Script for Supabase PostgreSQL
Runs backend/supabase/schema.sql and backend/supabase/seed.sql
"""
import os
import sys
from pathlib import Path
import psycopg2

def run_sql():
    script_dir = Path(__file__).resolve().parent
    supabase_dir = script_dir.parent / "supabase"
    schema_path = supabase_dir / "schema.sql"
    seed_path = supabase_dir / "seed.sql"

    db_host = os.getenv("SUPABASE_DB_HOST", "db.puhbtqisawianlqyivyj.supabase.co")
    db_port = int(os.getenv("SUPABASE_DB_PORT", "5432"))
    db_user = os.getenv("SUPABASE_DB_USER", "postgres")
    db_pass = os.getenv("SUPABASE_DB_PASSWORD", "VIGILai_789$$")
    db_name = os.getenv("SUPABASE_DB_NAME", "postgres")

    print(f"Connecting to Supabase PostgreSQL at {db_host}:{db_port}/{db_name}...")
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_pass,
        dbname=db_name
    )
    conn.autocommit = True
    cursor = conn.cursor()

    print("Running schema.sql...")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cursor.execute(schema_sql)
    print("Schema applied successfully!")

    print("Running seed.sql...")
    with open(seed_path, "r", encoding="utf-8") as f:
        seed_sql = f.read()
    cursor.execute(seed_sql)
    print("Seed data applied successfully!")

    # Verify tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cursor.fetchall()]
    print(f"\nCreated {len(tables)} tables in public schema:")
    for t in tables:
        print(f"  - {t}")

    cursor.close()
    conn.close()
    print("\nSupabase PostgreSQL initialization complete!")

if __name__ == "__main__":
    run_sql()
