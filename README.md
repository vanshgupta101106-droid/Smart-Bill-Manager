# 🧾 Smart Bill Manager

A premium, AI-powered financial tracking application designed to simplify expense management. Upload your bills, and let AI handle the heavy lifting of extracting merchant names, amounts, and dates.

![Feature Image](https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000)

## 🚀 Features
- **Smart Upload**: Support for PDF and Image bill uploads.
- **AI OCR (Coming Soon)**: Automatic extraction of bill details using Google Gemini AI.
- **Interactive Dashboard**: Premium UI with real-time expenditure statistics.
- **Local Database**: Fast and secure storage using MongoDB.
- **Glassmorphic Design**: A modern, sleek user interface with dark mode.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons, Axios.
- **Backend**: FastAPI (Python), Motor (Async MongoDB).
- **Database**: MongoDB.
- **Styling**: Modern Vanilla CSS with CSS Variables.

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.9+
- Node.js (v16+)
- MongoDB installed locally

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Environment Variables
Create a `.env` file in the `backend/` directory:
```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=smart_bill_manager
PORT=8000
```

## 📅 Roadmap
- [x] Phase 1: Database & Dashboard Setup
- [ ] Phase 2: Google Gemini AI OCR Integration
- [ ] Phase 3: User Authentication & Security
- [ ] Phase 4: Charts & Personal Finance Analytics
- [ ] Phase 5: Mobile App Conversion
