import os
from flask import Flask
import jwt

app = Flask(__name__)
app.secret_key = os.getenv('JWT_SECRET')

# Further code...