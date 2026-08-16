import sys
import os
from pathlib import Path

# Add project root and User_service to Python path
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
user_service_dir = root_dir / "Backend" / "User_service"

if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
if str(user_service_dir) not in sys.path:
    sys.path.insert(0, str(user_service_dir))

# Import the FastAPI application from User Service
from Backend.User_service.app.main import app

# Export app for Vercel Serverless
app = app
