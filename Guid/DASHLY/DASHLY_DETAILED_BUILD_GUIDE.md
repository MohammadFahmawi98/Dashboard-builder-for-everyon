import os
import jwt

# Ensure to set a strong secret in your environment variables
JWT_SECRET = os.environ.get('JWT_SECRET')  # Fetch the JWT secret from environment variables

# Use JWT_SECRET for signing and verifying tokens
def create_token(data):
    return jwt.encode(data, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None