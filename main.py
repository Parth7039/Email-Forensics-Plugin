import joblib
import re
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Model ---
class EmailScanRequest(BaseModel):
    text: str

# --- Load Model ---
model = joblib.load('spam-model.joblib')

# --- Load Suspicious Words Dataset ---
def load_suspicious_words(file_path="suspicious_words.txt"):
    try:
        with open(file_path, "r") as file:
            words = [line.strip().lower() for line in file if line.strip()]
        return words
    except FileNotFoundError:
        return ["lottery", "winner", "free", "click here", "claim now", "urgent", "money", "offer"]

SUSPICIOUS_WORDS = load_suspicious_words()

@app.get("/")
def read_root():
    return {"message": "Spam detection API is running"}

@app.post("/scan-email")
def scan_email(request: EmailScanRequest):
    """
    Predicts if an email text is spam or not,
    checks for suspicious words, and highlights them.
    """
    text_to_scan = request.text
    lower_text = text_to_scan.lower()

    # --- Spam Prediction ---
    prediction = model.predict([lower_text])[0]
    probabilities = model.predict_proba([lower_text])[0]
    confidence_score = float(max(probabilities))
    is_spam = bool(prediction)

    # --- Suspicious Word Detection ---
    found_words = [word for word in SUSPICIOUS_WORDS if word in lower_text]

    # --- Highlight Suspicious Words ---
    highlighted_text = text_to_scan
    for word in found_words:
        # Use regex for case-insensitive replacement
        highlighted_text = re.sub(
            fr'\b({re.escape(word)})\b',
            r'<mark style="background-color: yellow; color: red; font-weight: bold;">\1</mark>',
            highlighted_text,
            flags=re.IGNORECASE
        )

    return {
        "is_spam": is_spam,
        "confidence": round(confidence_score, 4),
        "suspicious_words_found": found_words,
        "suspicious_word_count": len(found_words),
        "highlighted_text": highlighted_text
    }
