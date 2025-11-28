import requests

# Test portal login and get token
login_data = {
    "username": "test@aliaport.com",
    "password": "Test1234!"
}

try:
    # Login (form-data format)
    response = requests.post(
        "http://localhost:8000/api/v1/portal/auth/login", 
        data={"username": "test@aliaport.com", "password": "Test1234!"}
    )
    print(f"Login Status: {response.status_code}")
    
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"Token: {token[:50]}...")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test employees endpoint
        emp_response = requests.get("http://localhost:8000/api/v1/portal/employees", headers=headers)
        print(f"\nEmployees Status: {emp_response.status_code}")
        if emp_response.status_code == 200:
            employees = emp_response.json()
            print(f"Employees Count: {len(employees)}")
            if employees:
                print(f"First Employee: {employees[0].get('full_name')}")
        else:
            print(f"Error: {emp_response.text}")
        
        # Test vehicles endpoint
        veh_response = requests.get("http://localhost:8000/api/v1/portal/vehicles", headers=headers)
        print(f"\nVehicles Status: {veh_response.status_code}")
        if veh_response.status_code == 200:
            vehicles = veh_response.json()
            print(f"Vehicles Count: {len(vehicles)}")
            if vehicles:
                print(f"First Vehicle: {vehicles[0].get('plaka')}")
        else:
            print(f"Error: {veh_response.text}")
    else:
        print(f"Login failed: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
