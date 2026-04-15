<div align="center">
  <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 24px; border-radius: 20px; display: inline-block;">
    <h1 style="color: white; margin: 0; font-size: 3em;">🧾 Smart Bill Manager</h1>
  </div>
  <p><b>An Elite, AI-Powered Financial Tracking App for Modern Businesses & Freelancers</b></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Auth" />
  </p>
</div>

---

## 🚀 The Vision
Managing sales and purchase invoices shouldn't be a tedious, manual chore. **Smart Bill Manager** is a premium, beautifully crafted application that utilizes AI to read your receipts, automatically calculate your GST, and visualize your financial health—all within a secure, privacy-first ecosystem.

---

## ✨ Power Features

- 📸 **AI Document Scanning (OCR)**: Instantly extract Merchant Names, Amounts, Dates, and Categories from raw PDF or Image invoices using advanced OCR.
- 🔄 **Sales vs. Purchase Modes**: A complete dual-ledger system. Instantly switch between tracking what you've spent (Purchases) and what you've earned (Sales).
- 🇮🇳 **Intelligent GST Dashboard**: Automatically calculates Input Tax Credit (Purchases) and Output Tax Liability (Sales). Know exactly what you owe the government safely before the deadline.
- 📊 **Gorgeous Analytics**: Dynamic, real-time charts breaking down your multi-category spending, 6-month trends, and overall processed volume.
- 🔐 **Military-Grade Security**: Secure, passwordless login powered entirely by Google Authentication. We never see or store your passwords.
- 🌓 **Premium UI/UX**: Built with an ultra-modern Glassmorphism design system, supporting both sleek Dark Mode and pristine Light Mode.
- 🌍 **Global Currency Support**: Tailor the app to your location effortlessly (Supports $, ₹, €, £, ¥, and more).

---

## 🛠️ Tech Stack & Architecture

**Frontend**
- React 18 (Vite) for blazing-fast rendering
- Context API for State Management
- Firebase Authentication for Google Sign-In
- Custom vanilla CSS specifically optimized for mobile-first views

**Backend**
- Python FastAPI for an insanely fast, concurrent API layer
- Motor (Async MongoDB Driver) for pure non-blocking database queries
- PyTesseract / Python-Multipart for Optical Character Recognition

---

## ⚙️ Quick Start Installation

### 1. Prerequisites
- Python 3.9+
- Node.js (v16+)
- MongoDB running locally (or a free MongoDB Atlas cluster URL)

### 2. Backend Setup
Fire up the backend engine:
```bash
cd backend

# Create Virtual Environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Run Server
python main.py
```

### 3. Frontend Setup
Boot the interactive UI:
```bash
cd frontend

# Install Packages
npm install

# Start Vite Development Server
npm run dev
```

### 4. Environment Variables
Create a `.env` file in your `backend/` directory:
```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=smart_bill_manager
PORT=8000
```
Create a `.env` file in your `frontend/` directory:
```env
VITE_API_URL=http://localhost:8000
```

---

## 🛡️ Privacy First
We believe financial data belongs to the user. All user records are deeply scoped to their authenticated Firebase UID. MongoDB collections are segmented, ensuring that unauthorized data access is fundamentally impossible.

---

<p align="center">Designed with ❤️ for modern businesses.</p>
