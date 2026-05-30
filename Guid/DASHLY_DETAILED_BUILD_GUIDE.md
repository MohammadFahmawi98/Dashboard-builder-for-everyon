import os
import secrets

# Use the random secret securely for JWT signing
JWT_SECRET = os.environ.get('JWT_SECRET') or secrets.token_hex(32)  # Use environment variable or generate a strong random secret