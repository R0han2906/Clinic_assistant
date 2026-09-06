"""
Automated Test Runner for Zendenta Dental Clinic
Tests:
1. Supabase PostgreSQL Connectivity
2. Pytest Automated Test Suite (All Endpoints, Models, Services, Exports)
3. Direct API Endpoint Probes
"""

import sys
import os
from pathlib import Path

# Force UTF-8 encoding for Windows stdout/stderr
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Setup paths
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

def test_supabase_connection():
    print("=" * 60)
    print("TEST 1: Testing Supabase PostgreSQL Direct Connection...")
    print("=" * 60)
    try:
        import psycopg2
        host = os.getenv("SUPABASE_DB_HOST", "db.puhbtqisawianlqyivyj.supabase.co")
        port = int(os.getenv("SUPABASE_DB_PORT", "5432"))
        user = os.getenv("SUPABASE_DB_USER", "postgres")
        pwd = os.getenv("SUPABASE_DB_PASSWORD", "VIGILai_789$$")
        dbname = os.getenv("SUPABASE_DB_NAME", "postgres")

        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=pwd,
            dbname=dbname,
            connect_timeout=8
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        ver = cursor.fetchone()[0]
        print(f"✅ Supabase PostgreSQL Connected!")
        print(f"   Database Version: {ver[:50]}...")

        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = [r[0] for r in cursor.fetchall()]
        print(f"   Tables in public schema: {len(tables)} tables found ({', '.join(tables[:5])}...)")

        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"⚠️ Supabase direct connection notice: {e}")
        return False

def run_pytest_suite():
    print("\n" + "=" * 60)
    print("TEST 2: Running Automated Pytest Suite...")
    print("=" * 60)
    import pytest
    tests_dir = str(backend_dir / "tests")
    
    retcode = pytest.main([
        tests_dir,
        "-v",
        "--tb=short"
    ])
    
    if retcode == 0:
        print("\n✅ All Pytest test cases PASSED successfully!")
    else:
        print(f"\n⚠️ Pytest finished with return code: {retcode}")
    return retcode == 0

def test_fastapi_endpoints():
    print("\n" + "=" * 60)
    print("TEST 3: Testing FastAPI In-Memory Endpoints & CSV Exports...")
    print("=" * 60)
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    endpoints = [
        ("GET", "/api/v1/system/health", 200),
        ("GET", "/api/v1/patients", 200),
        ("GET", "/api/v1/dentists", 200),
        ("GET", "/api/v1/treatments", 200),
        ("GET", "/api/v1/staff", 200),
        ("GET", "/api/v1/sales", 200),
        ("GET", "/api/v1/sales/summary", 200),
        ("GET", "/api/v1/purchases", 200),
        ("GET", "/api/v1/inventory", 200),
        ("GET", "/api/v1/peripherals", 200),
        ("GET", "/api/v1/export/patients.csv", 200),
        ("GET", "/api/v1/export/sales.csv", 200),
        ("GET", "/api/v1/export/inventory.csv", 200),
    ]

    all_passed = True
    for method, path, expected_status in endpoints:
        res = client.request(method, path)
        status_symbol = "✅" if res.status_code == expected_status else "❌"
        print(f"   {status_symbol} {method} {path} -> HTTP {res.status_code} (Expected {expected_status})")
        if res.status_code != expected_status:
            all_passed = False

    return all_passed

if __name__ == "__main__":
    print("\n============================================================")
    print("   ZENDENTA CLINIC FULL-STACK VERIFICATION TEST RUNNER     ")
    print("============================================================\n")

    t1 = test_supabase_connection()
    t3 = test_fastapi_endpoints()
    t2 = run_pytest_suite()

    print("\n" + "=" * 60)
    print("SUMMARY OF RESULTS:")
    print(f"   1. Supabase Database Connection:  {'PASSED ✅' if t1 else 'FAILED ❌'}")
    print(f"   2. FastAPI Endpoints & CSV:       {'PASSED ✅' if t3 else 'FAILED ❌'}")
    print(f"   3. Pytest Regression Test Suite:  {'PASSED ✅' if t2 else 'FAILED ❌'}")
    print("=" * 60)

    if t1 and t2 and t3:
        print("\n🎉 ALL TESTS PASSED! System is fully verified and ready for production.")
        sys.exit(0)
    else:
        print("\nReview test output above.")
        sys.exit(1)
