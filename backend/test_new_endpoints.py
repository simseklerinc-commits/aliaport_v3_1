#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test script for new API endpoints (WorkOrderPerson, Security, Saha Personel, Analytics)
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def print_response(title, response):
    """Helper to print formatted response"""
    print(f"\n{'='*80}")
    print(f"📋 {title}")
    print(f"{'='*80}")
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    try:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except:
        print(response.text)
    print()

def test_work_order_person():
    """Test WorkOrderPerson endpoints"""
    print("\n" + "="*80)
    print("🔧 TESTING WORK ORDER PERSON ENDPOINTS")
    print("="*80)
    
    # 1. GET /api/work-order-person (list)
    response = requests.get(f"{BASE_URL}/work-order-person?skip=0&limit=10")
    print_response("GET /api/work-order-person (List)", response)
    
    # 2. GET /api/work-order-person/pending-approval
    response = requests.get(f"{BASE_URL}/work-order-person/pending-approval")
    print_response("GET /api/work-order-person/pending-approval", response)
    
    # Note: Other endpoints require existing data (work orders, items, etc.)
    # We'll skip create/update/delete for now to avoid polluting test DB

def test_security():
    """Test Security endpoints"""
    print("\n" + "="*80)
    print("🛡️ TESTING SECURITY ENDPOINTS")
    print("="*80)
    
    # 1. GET /api/security/active-vehicles
    response = requests.get(f"{BASE_URL}/security/active-vehicles")
    print_response("GET /api/security/active-vehicles", response)
    
    # 2. GET /api/security/pending-persons
    response = requests.get(f"{BASE_URL}/security/pending-persons")
    print_response("GET /api/security/pending-persons", response)

def test_saha_personel():
    """Test Saha Personel endpoints"""
    print("\n" + "="*80)
    print("👷 TESTING SAHA PERSONEL ENDPOINTS")
    print("="*80)
    
    # 1. GET /api/saha-personel/active-work-orders
    response = requests.get(f"{BASE_URL}/saha-personel/active-work-orders")
    print_response("GET /api/saha-personel/active-work-orders", response)
    
    # 2. GET /api/saha-personel/my-work-orders (needs user_id param)
    response = requests.get(f"{BASE_URL}/saha-personel/my-work-orders?user_id=1")
    print_response("GET /api/saha-personel/my-work-orders", response)

def test_analytics():
    """Test Analytics endpoint"""
    print("\n" + "="*80)
    print("📊 TESTING ANALYTICS ENDPOINT")
    print("="*80)
    
    # GET /api/hizmet/analytics/pricing-trends
    response = requests.get(f"{BASE_URL}/hizmet/analytics/pricing-trends")
    print_response("GET /api/hizmet/analytics/pricing-trends", response)

def main():
    """Run all tests"""
    print("\n" + "🚀"*40)
    print("ALIAPORT v3.1 - NEW ENDPOINTS TEST SUITE")
    print("🚀"*40)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Test each module
        test_work_order_person()
        test_security()
        test_saha_personel()
        test_analytics()
        
        print("\n" + "✅"*40)
        print("ALL TESTS COMPLETED")
        print("✅"*40)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to backend server")
        print("Please ensure uvicorn is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
