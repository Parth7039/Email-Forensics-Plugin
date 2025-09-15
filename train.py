import joblib, json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# Training data
emails = [
    ("Win a free car now!", 1),
    ("URGENT: Your account needs verification", 1),
    ("Hello, let's catch up tomorrow", 0),
    ("Meeting minutes attached", 0),
    ("Click here for a limited time offer", 1),
    ("Your project update is due", 0)
]

texts, labels = zip(*emails)

# Train pipeline
pipeline = make_pipeline(TfidfVectorizer(), MultinomialNB())
pipeline.fit(texts, labels)

# Save joblib if you still want it
joblib.dump(pipeline, "spam-model.joblib")

# Export as JSON for Chrome extension
vectorizer = pipeline.named_steps['tfidfvectorizer']
clf = pipeline.named_steps['multinomialnb']

export_data = {
    "vocabulary": vectorizer.vocabulary_,
    "idf": vectorizer.idf_.tolist(),
    "class_log_prior": clf.class_log_prior_.tolist(),
    "feature_log_prob": clf.feature_log_prob_.tolist()
}

with open("spam-model.json", "w") as f:
    json.dump(export_data, f)

print("✅ Exported spam-model.json successfully")
