import jwt

# Test token'ı decode et
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInR5cGUiOiJwb3J0YWwiLCJleHAiOjE3MzI2NDc1NDd9.YjG5QshMLCuDnK5QAJ1zvgWNpS2MRV6Gml0fgpcPdWo"

# Decode without verification (for testing)
decoded = jwt.decode(token, options={"verify_signature": False})
print(f"Token payload: {decoded}")
print(f"User ID (sub): {decoded.get('sub')}")
print(f"Type: {decoded.get('type')}")
