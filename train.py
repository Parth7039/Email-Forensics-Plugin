import pandas as pd
import joblib, json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# 1. Load base dataset
df_base = pd.read_csv("emails.csv")  # columns: Category, Message
df_base = df_base[["Message", "Category"]]

# 2. Load feedback if available
try:
    df_feedback = pd.read_csv("feedback.csv")  # same columns
    df_feedback = df_feedback[["Message", "Category"]]
    df_all = pd.concat([df_base, df_feedback], ignore_index=True)
    print(f"✅ Merged dataset: {len(df_base)} base + {len(df_feedback)} feedback = {len(df_all)} total samples")
except FileNotFoundError:
    df_all = df_base
    print(f"⚠️ No feedback.csv found, training only on base dataset ({len(df_base)} samples)")

# 3. Prepare texts and labels
texts = df_all["Message"].astype(str).tolist()
labels = df_all["Category"].apply(lambda x: 1 if x.lower() == "spam" else 0).tolist()

# 4. Train pipeline
pipeline = make_pipeline(TfidfVectorizer(), MultinomialNB())
pipeline.fit(texts, labels)

# 5. Save joblib (optional)
joblib.dump(pipeline, "spam-model.joblib")

# 6. Export JSON for Chrome extension
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
