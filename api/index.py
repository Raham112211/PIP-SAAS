import sys
import os
from pathlib import Path

# 1. Setup Python path for Vercel Serverless environment
root_dir = Path(__file__).resolve().parent.parent
user_service_dir = root_dir / "Backend" / "User_service"

if str(user_service_dir) not in sys.path:
    sys.path.insert(0, str(user_service_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

os.environ["VERCEL"] = "1"

# 2. Import FastAPI application directly using app module
from app.main import app

# 3. Export for Vercel Serverless runtime
app = app
handler = app
