"""Dump all data from Supabase via REST API as SQL INSERT statements."""
import requests
import json

SUPABASE_URL = "https://akzlsziiofrufmtpljom.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFremxzemlpb2ZydWZtdHBsam9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Mjk3MzcsImV4cCI6MjA5MTIwNTczN30.ddCF4JkuM8YucJssvnfjAezHDUiSeh4iQsWJvFHMvrU"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

TABLES = [
    "applications",
    "git_repos",
    "resources",
    "role_assignments",
    "alerts",
    "people",
    "tasks",
]

# Also try views
VIEWS = [
    "application_summaries",
    "git_repos_with_app",
    "people_with_app",
    "tasks_with_app",
]

# Also try RPC functions
RPCS = [
    "get_dashboard_stats",
    "get_resource_groups",
]


def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"


def fetch_table(table_name):
    """Fetch all rows from a table via Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        return resp.json()
    else:
        print(f"  WARNING: {table_name} returned {resp.status_code}: {resp.text}")
        return None


def fetch_rpc(func_name):
    """Call an RPC function."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/{func_name}"
    resp = requests.post(url, headers=HEADERS, json={})
    if resp.status_code == 200:
        return resp.json()
    else:
        print(f"  WARNING: RPC {func_name} returned {resp.status_code}: {resp.text}")
        return None


def main():
    lines = []
    all_data = {}

    print("=" * 50)
    print("Fetching data from Supabase REST API...")
    print("=" * 50)

    # Fetch tables
    for table in TABLES:
        rows = fetch_table(table)
        if rows is not None:
            all_data[table] = rows
            print(f"  {table}: {len(rows)} rows")
            if rows:
                columns = list(rows[0].keys())
                lines.append(f"\n-- {table}: {len(rows)} rows")
                for row in rows:
                    vals = ", ".join(escape_sql(row.get(c)) for c in columns)
                    cols = ", ".join(columns)
                    lines.append(
                        f"INSERT INTO {table} ({cols}) OVERRIDING SYSTEM VALUE VALUES ({vals});"
                    )
                lines.append(
                    f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                    f"(SELECT COALESCE(MAX(id), 0) FROM {table}));"
                )
            else:
                lines.append(f"\n-- {table}: 0 rows (empty)")
        else:
            all_data[table] = None
            lines.append(f"\n-- {table}: FAILED TO FETCH")

    # Also dump raw JSON backup
    print("\nFetching views...")
    for view in VIEWS:
        data = fetch_table(view)
        if data is not None:
            all_data[f"view_{view}"] = data
            print(f"  {view}: {len(data)} rows")

    print("\nFetching RPC functions...")
    for rpc in RPCS:
        data = fetch_rpc(rpc)
        if data is not None:
            all_data[f"rpc_{rpc}"] = data
            print(f"  {rpc}: OK")

    # Write SQL file
    sql_output = "\n".join(lines)
    with open("../data-dump.sql", "w", encoding="utf-8") as f:
        f.write("-- Hive Data Dump (extracted via Supabase REST API)\n")
        f.write("-- Run this AFTER supabase-setup.sql in your new project\n\n")
        f.write(sql_output + "\n")
    print(f"\nSQL dump written to: data-dump.sql")

    # Write JSON backup too
    with open("../data-dump.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2, default=str)
    print(f"JSON backup written to: data-dump.json")


if __name__ == "__main__":
    main()
