import requests, json

URL = 'https://pjnymsykyhnpgjhybfxc.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnltc3lreWhucGdqaHliZnhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQwOTU3MiwiZXhwIjoyMDkxOTg1NTcyfQ.O8XFXmmin2HJx2ZKZA_1QPKQxavgHX4th48z2gXDRfc'
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}'}

tables = ['applications','git_repos','resources','role_assignments','alerts','people','tasks']
views = ['application_summaries','git_repos_with_app','people_with_app','tasks_with_app']

print('=== TABLES ===')
for t in tables:
    r = requests.get(f'{URL}/rest/v1/{t}?select=*', headers=H)
    rows = r.json()
    print(f'{t}: {r.status_code} -> {len(rows)} rows')
    if rows and len(rows) <= 5:
        for row in rows:
            print(f'  {row}')

print()
print('=== VIEWS ===')
for v in views:
    r = requests.get(f'{URL}/rest/v1/{v}?select=*', headers=H)
    rows = r.json()
    print(f'{v}: {r.status_code} -> {len(rows)} rows')

print()
print('=== RPC: get_dashboard_stats ===')
r = requests.post(f'{URL}/rest/v1/rpc/get_dashboard_stats', headers={**H, 'Content-Type':'application/json'}, json={})
print(f'Status: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    for k, v in data.items():
        if k != 'recent_applications':
            print(f'  {k}: {v}')
        else:
            print(f'  recent_applications: {len(v)} apps')

print()
print('=== RPC: get_resource_groups ===')
r = requests.post(f'{URL}/rest/v1/rpc/get_resource_groups', headers={**H, 'Content-Type':'application/json'}, json={})
print(f'Status: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'  {len(data)} resource groups')
    for rg in data:
        name = rg.get('name', '?')
        res_count = len(rg.get('resources', []))
        role_count = len(rg.get('role_assignments', []))
        alert_count = len(rg.get('alerts', []))
        print(f'  - {name}: {res_count} resources, {role_count} roles, {alert_count} alerts')
