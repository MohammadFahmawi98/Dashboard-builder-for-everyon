import os
import secrets

# Use the random secret securely for JWT signing
JWT_SECRET = os.getenv('JWT_SECRET')  # Use an environment variable for the JWT secret