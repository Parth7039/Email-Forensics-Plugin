let spamModel = null;

// Load model parameters (spam-model.json)
async function loadModel() {
  if (spamModel) return;
  const response = await fetch(chrome.runtime.getURL("spam-model.json"));
  spamModel = await response.json();
}

// Convert email text → numeric vector
function vectorize(text) {
  const tokens = text.toLowerCase().split(/\W+/);
  const vocab = spamModel.vocabulary;
  const vec = new Array(Object.keys(vocab).length).fill(0);
  tokens.forEach(t => {
    if (vocab.hasOwnProperty(t)) {
      vec[vocab[t]] += 1;
    }
  });
  return vec;
}

// Naive Bayes prediction
function predict(text) {
  const x = vectorize(text);
  const probs = spamModel.feature_log_prob.map((classLogProb, i) => {
    return spamModel.class_log_prior[i] +
           classLogProb.reduce((sum, val, j) => sum + x[j] * val, 0);
  });

  const maxProb = Math.max(...probs);
  const expScores = probs.map(p => Math.exp(p - maxProb));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const norm = expScores.map(v => v / sumExp);

  const isSpam = norm[1] > norm[0];

  // --- Compute influential words ---
  const influentialWords = [];
  const vocabKeys = Object.keys(spamModel.vocabulary);
  x.forEach((count, idx) => {
    if (count > 0) {
      const word = vocabKeys.find(key => spamModel.vocabulary[key] === idx);
      const contribution = (spamModel.feature_log_prob[1][idx] - spamModel.feature_log_prob[0][idx]) * count;
      influentialWords.push({ word, contribution });
    }
  });

  // Sort by contribution descending and take top 10
  influentialWords.sort((a, b) => b.contribution - a.contribution);
  const topWords = influentialWords.slice(0, 10).map(w => w.word);

  return {
    is_spam: isSpam,
    confidence: isSpam ? norm[1] : norm[0],
    influentialWords: topWords,
    reason: isSpam ? "High presence of suspicious words" : "No significant suspicious words"
  };
}

