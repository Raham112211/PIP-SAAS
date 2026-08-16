# PIP SaaS (Power Intelligence Platform)

An enterprise multi-tenant Utility Intelligence & DISCO Scraping SaaS platform built with **React (Vite)** on the frontend and **Python FastAPI (SQLAlchemy 2.0)** on the backend.

## 🚀 Features
- **Utility Ledger & Bills**: Automated tracking, parsing, and analytics across KESC, LESCO, IESCO, and PESCO.
- **DISCO Scraping Engine**: Real-time scraper logs, status alerts, and multi-branch automated bill extraction.
- **Enterprise Staff Directory**: Role allocation, branch mapping, and temporary credential onboarding.
- **Dynamic Roles & Permissions Matrix**: Granular module-level access control.
- **Executive Analytics & Reporting**: 11 category reports with Excel (.xlsx) exports.
- **Modern SaaS UI**: Electric Cyan theme (`#08B6E8`), high-contrast data tables, and Plus Jakarta Sans typography.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons, Pure CSS Modules.
- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2.
- **Database**: High-concurrency Unified SQLite (WAL Mode) & PostgreSQL ready.
- **Real-time**: WebSockets & Broadcast Channel synchronization.

---

## 💻 Local Development

### 1. Backend Setup
```bash
cd Backend
pip install -r requirements.txt

# Start User Service (:8001)
cd User_service
python -m uvicorn app.main:app --port 8001 --reload

# Start Organization Service (:8002)
cd ../Organization_service/Settings
python -m uvicorn app.main:app --port 8002 --reload
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
