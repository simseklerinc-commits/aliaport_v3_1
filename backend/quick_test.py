import requests
import time

BASE_URL = "http://localhost:8000/api/v1/portal"

# 1. Login
print("1. Login...")
login_data = {
    "username": "test@aliaport.com",
    "password": "Test1234!"
}
login_resp = requests.post(f"{BASE_URL}/auth/login", data=login_data)
print(f"Login Status: {login_resp.status_code}")

if login_resp.status_code == 200:
    token = login_resp.json()["access_token"]
    print(f"Token alındı: {token[:50]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Employees
    print("\n2. Get Employees...")
    time.sleep(1)  # Backend'e zaman tanı
    emp_resp = requests.get(f"{BASE_URL}/employees", headers=headers)
    print(f"Employees Status: {emp_resp.status_code}")
    if emp_resp.status_code == 200:
        emps = emp_resp.json()
        print(f"Employees Count: {len(emps)}")
        if emps:
            print(f"First employee: {emps[0]['full_name']}")
    else:
        print(f"Error: {emp_resp.text}")
    
    # 3. Get Vehicles
    print("\n3. Get Vehicles...")
    time.sleep(1)
    veh_resp = requests.get(f"{BASE_URL}/vehicles", headers=headers)
    print(f"Vehicles Status: {veh_resp.status_code}")
    if veh_resp.status_code == 200:
        vehs = veh_resp.json()
        print(f"Vehicles Count: {len(vehs)}")
        if vehs:
            print(f"First vehicle: {vehs[0]['plaka']}")
    else:
        print(f"Error: {veh_resp.text}")
else:
    print(f"Login failed: {login_resp.text}")
