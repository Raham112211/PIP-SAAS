import sys
import os
from pathlib import Path

# Add project root and User_service to Python path
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent if current_dir.name == "api" else current_dir
user_service_dir = root_dir / "Backend" / "User_service"

for p in [str(root_dir), str(user_service_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ["VERCEL"] = "1"

# Import the FastAPI application from User Service
from Backend.User_service.app.main import app

# Export for Vercel Serverless
app = app
