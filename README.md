# 📧 Gmail Spam Scanner

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)  
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green.svg)](https://fastapi.tiangolo.com/)  
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-orange.svg)](https://developer.chrome.com/docs/extensions/)  
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

A **real-time email forensics tool** built as a Chrome extension for Gmail.  

- Scans the content of opened emails.  
- Uses a backend API powered by **Python + Scikit-learn**.  
- Predicts whether an email is **Spam** or **Safe**.  
- Displays results as a clean, non-intrusive chip inside Gmail.  
- Collects user feedback for continuous improvement.  

---

## ✨ Features

- 📧 **Real-Time Scanning**: Analyzes emails instantly when opened.  
- 🎨 **Clean UI**: Shows "Scanning," "Safe," or "Spam" as a compact chip.  
- 🤖 **Machine Learning**: Naive Bayes classifier trained on text data.  
- 👍 **User Feedback**: Like/Dislike popup for accuracy ratings.  
- ⚡ **Lightweight**: Built with vanilla JavaScript (no heavy frameworks).  

---

## 🛠️ Tech Stack

**Frontend (Chrome Extension):**  
- Vanilla JavaScript (ES6+), HTML, CSS  

**Backend (API):**  
- Python, FastAPI, Uvicorn  

**Machine Learning:**  
- Scikit-learn, Joblib  

---

## 🚀 Getting Started

To run this project locally, you’ll need to set up both the backend **API server** and the frontend **Chrome extension**.

---

### ✅ Prerequisites

- Python **3.8+**  
- Google Chrome  
- Git  
- A code editor (e.g., VS Code)  

---

## 🔹 1. Backend Setup (API Server)

The backend runs a **FastAPI server** that performs spam detection using a trained ML model.

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/gmail-spam-scanner.git
cd gmail-spam-scanner/spam-api
```

---

### Step 2: Create Virtual Environment
```bash
Create virtual environment
python -m venv venv

 Activate it (Linux/macOS)
source venv/bin/activate

# Or on Windows
venv\Scripts\activate
```

---

### Step 3: Install Dependencies
```bash
pip install fastapi "uvicorn[standard]" scikit-learn joblib
```

---

### Step 4: Train the Initial Model
```bash
python train.py
```

✅ This generates a file called spam-model.joblib.
---

### Step 5: Start the Server
```bash
uvicorn main:app --reload
```


The server will be available at:
👉 http://127.0.0.1:8000

🔹 2. Frontend Setup (Chrome Extension)

The frontend is a Chrome Extension that connects to the backend API and shows spam detection results inside Gmail.

Step 1: Open Chrome Extensions

In Chrome, navigate to:

chrome://extensions

Step 2: Enable Developer Mode

Toggle Developer Mode (top-right corner).

Step 3: Load the Extension

Click Load unpacked

Select the folder:

gmail-scanner-extension


The extension should now appear in your extensions list.
