import pandas as pd
import joblib, json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
import numpy as np

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
    json.dump(export_data, f, indent=2)

print("✅ Exported spam-model.json successfully")

# 7. Calculate suspicious words (spam-indicative words)
word_scores = []
vocab = vectorizer.vocabulary_
feature_log_prob = clf.feature_log_prob_  # [ham, spam]

for word, idx in vocab.items():
    score = feature_log_prob[1][idx] - feature_log_prob[0][idx]  # spam - ham
    word_scores.append((word, score))

# Sort by spam score descending
word_scores.sort(key=lambda x: x[1], reverse=True)

print("\nTop 50 suspicious words:")
for word, score in word_scores[:50]:
    print(word, f"{score:.3f}")

# 8. Optional: save suspicious words JSON
suspicious_words_json = [{"word": w, "score": s} for w, s in word_scores]
with open("suspicious-words.json", "w") as f:
    json.dump(suspicious_words_json, f, indent=2)
print("✅ Saved suspicious-words.json for reference")
