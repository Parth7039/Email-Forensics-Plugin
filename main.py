import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware # New Import

# Initialize the FastAPI app
app = FastAPI()

# --- Add CORS Middleware --- (New Block)
# This allows your frontend (running on mail.google.com) to communicate with your backend.
origins = [
    "https://mail.google.com",
    # You can add other origins here if needed, e.g., for local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, "*" is fine. For production, restrict this to the origins list above.
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)
# --- End of New Block ---


# Define the request body structure using Pydantic
class EmailScanRequest(BaseModel):
    text: str

# Load the trained model from the file
model = joblib.load('spam-model.joblib')

@app.get("/")
def read_root():
    return {"message": "Spam detection API is running"}

@app.post("/scan-email")
def scan_email(request: EmailScanRequest):
    """
    Predicts if an email text is spam or not.
    """
    text_to_scan = [request.text]
    
    prediction = model.predict(text_to_scan)[0]
    probabilities = model.predict_proba(text_to_scan)[0]
    confidence_score = float(max(probabilities))
    
    is_spam = bool(prediction)
    
    return {
        "is_spam": is_spam,
        "confidence": round(confidence_score, 4)
    }