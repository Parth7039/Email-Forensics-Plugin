import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# 1. Sample Data (Replace with your actual dataset)
# '1' represents spam, '0' represents not spam (ham)
emails = [
    ("Win a free car now!", 1),
    ("URGENT: Your account needs verification", 1),
    ("Hello, let's catch up tomorrow", 0),
    ("Meeting minutes attached", 0),
    ("Click here for a limited time offer", 1),
    ("Your project update is due", 0)
]

# Separate texts and labels
texts, labels = zip(*emails)

# 2. Create and Train the Model Pipeline
# The pipeline first converts text into numerical vectors, then applies the classifier.
model = make_pipeline(TfidfVectorizer(), MultinomialNB())
model.fit(texts, labels)

# 3. Save the Trained Model
# We save the entire pipeline so we can use it for prediction later.
joblib.dump(model, 'spam-model.joblib')

print("✅ Model trained and saved as spam-model.joblib")