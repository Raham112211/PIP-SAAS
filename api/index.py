import sys
import os
from pathlib import Path

# Add api directory to sys.path so 'app' is resolvable inside Vercel Lambda container
api_dir = Path(__file__).resolve().parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

os.environ["VERCEL"] = "1"

# Import FastAPI directly from local bundled app
from app.main import app

app = app
handler = app
