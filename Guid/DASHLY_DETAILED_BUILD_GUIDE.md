import os
import secrets

# Use the random secret securely for JWT signing
JWT_SECRET = secrets.token_hex(32)  # Generate a strong random secret