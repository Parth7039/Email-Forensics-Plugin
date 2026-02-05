console.log("✅ Gmail Spam Scanner (Server-Based) Loaded!");

// ============= SERVER CONFIGURATION =============
const API_URL = "http://localhost:8000/analyze-email";
// For production, change to: "https://your-domain.com/analyze-email"
// ===============================================

const EMAIL_BODY_SELECTOR = "div.gs";
let currentScannedEmailId = null;
let feedbackPopup = null;

// --- Result Chip in Email Header ---
function displayResult(emailBodyElement, state, apiResult = null) {
  const existingBannerId = `spam-scan-banner-${emailBodyElement.dataset.scannerId}`;
  let chip = document.getElementById(existingBannerId);
  const header = document.querySelector(".hP");

  if (!chip && header) {
    chip = document.createElement("div");
    chip.id = existingBannerId;
    chip.style.cssText = `
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 6px 10px;
      margin-left: 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      font-family: Roboto, Arial, sans-serif;
      line-height: 1.4;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      transition: all 0.2s ease-in-out;
      max-width: 360px;
      word-break: break-word;
    `;
    header.appendChild(chip);
  }

  if (!chip) return;

  switch (state) {
    case "loading":
      chip.textContent = "🔍 Scanning...";
      chip.style.backgroundColor = "#e3f2fd";
      chip.style.color = "#1565c0";
      hideFeedbackPopup();
      break;

    case "spam":
<<<<<<< HEAD
      const spamPercent = Math.round(apiResult.spam_probability * 100);
      chip.textContent = `⚠️ Likely Spam (${spamPercent}%)`;
      chip.style.backgroundColor = "#ffcdd2";
      chip.style.color = "#c62828";
      showFeedbackPopup(state, apiResult.spam_probability, emailBodyElement.innerText, apiResult);
      break;
    case "safe":
      const safePercent = Math.round((1 - apiResult.spam_probability) * 100);
      chip.textContent = `✅ Looks Safe (${safePercent}%)`;
      chip.style.backgroundColor = "#c8e6c9";
      chip.style.color = "#2e7d32";
      showFeedbackPopup(state, apiResult.spam_probability, emailBodyElement.innerText, apiResult);
      break;
    case "error":
      chip.textContent = "⚠️ Server Error";
      chip.style.backgroundColor = "#fff3cd";
      chip.style.color = "#856404";
=======
    case "safe":
      const isSpam = state === "spam";
      const confidencePercent = Math.round(apiResult.confidence * 100);
      const words = apiResult.influentialWords?.length
        ? apiResult.influentialWords.join(", ")
        : "N/A";
      const reason = apiResult.reason || "No specific reason detected.";

      chip.innerHTML = `
        <div style="margin-bottom: 4px;">
          ${isSpam ? "⚠️ Likely Spam" : "✅ Looks Safe"} (${confidencePercent}%)
        </div>
        <div style="
          font-size: 11px;
          font-weight: 400;
          color: ${isSpam ? "#b71c1c" : "#1b5e20"};
        ">
          <b>Reason:</b> ${reason}<br>
          <b>Key Words:</b> ${words}
        </div>
      `;

      chip.style.backgroundColor = isSpam ? "#ffcdd2" : "#c8e6c9";
      chip.style.color = isSpam ? "#c62828" : "#2e7d32";
      showFeedbackPopup(
        state,
        apiResult.confidence,
        emailBodyElement.innerText,
        reason,
        apiResult.influentialWords
      );
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf
      break;
  }
}

// --- Get Email Subject ---
function getEmailSubject() {
  const subjectElement = document.querySelector('h2.hP');
  if (subjectElement) {
    return subjectElement.innerText.trim();
  }
  
  const altSelectors = [
    'h2[data-legacy-thread-id]',
    '.hP',
    'h2.Subject'
  ];
  
  for (const selector of altSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.innerText.trim();
    }
  }
  
  return "";
}

// --- Scanning with Server API ---
async function scanEmail(emailBodyElement) {
  emailBodyElement.dataset.scannerId = Date.now() + Math.random();
  currentScannedEmailId = emailBodyElement.dataset.scannerId;
  displayResult(emailBodyElement, "loading");

  const emailBody = emailBodyElement.innerText.trim();
  const emailSubject = getEmailSubject();

<<<<<<< HEAD
  // Skip very short emails
  if (emailBody.length < 50 && emailSubject.length < 10) {
    displayResult(emailBodyElement, "safe", { 
      spam_probability: 0.1,
      result: "SAFE",
      confidence: "HIGH"
=======
  if (emailText.length < 50) {
    displayResult(emailBodyElement, "safe", {
      confidence: 1.0,
      reason: "Short message – unlikely to be spam.",
      influentialWords: [],
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf
    });
    return;
  }

  try {
    console.log("📧 Sending email to server for analysis...");
    console.log("Subject:", emailSubject.substring(0, 50));
    console.log("Body length:", emailBody.length);

    // Call FastAPI server
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: emailSubject,
        body: emailBody
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Server response:", result);

    // Check for API error
    if (result.error) {
      throw new Error(result.message || "Server returned an error");
    }

    // Display result based on server response
    const isSpam = result.result === "SPAM";
    displayResult(emailBodyElement, isSpam ? "spam" : "safe", result);

  } catch (error) {
    console.error("❌ Failed to scan email:", error);
    displayResult(emailBodyElement, "error");
    
    // Show connection error notification
    showConnectionError(error.message);
  }
}

// --- Show Connection Error ---
function showConnectionError(message) {
  const errorNotification = document.createElement("div");
  errorNotification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 15px 20px;
    background-color: #ff9800;
    color: white;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    max-width: 300px;
  `;
  errorNotification.innerHTML = `
    <strong>⚠️ Server Connection Error</strong><br>
    <span style="font-size: 12px;">${message}</span><br>
    <span style="font-size: 11px; margin-top: 5px; display: block;">
      Make sure FastAPI server is running at ${API_URL}
    </span>
  `;
  
  document.body.appendChild(errorNotification);
  
  setTimeout(() => {
    errorNotification.style.opacity = '0';
    setTimeout(() => errorNotification.remove(), 300);
  }, 5000);
}

// --- Mutation Observer ---
function handleMutation(mutations) {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const emailBodies = node.querySelectorAll(
            `${EMAIL_BODY_SELECTOR}:not([data-scan-complete])`
          );
          emailBodies.forEach((emailBody) => {
            emailBody.setAttribute("data-scan-complete", "true");
            scanEmail(emailBody);
          });
        }
      }
    }
  }
}

console.log("👀 Starting Gmail observer...");
const observer = new MutationObserver(handleMutation);
observer.observe(document.body, { childList: true, subtree: true });

// --- Feedback Popup ---
function createFeedbackPopup() {
  feedbackPopup = document.createElement("div");
  feedbackPopup.id = "spam-scanner-feedback-popup";
  Object.assign(feedbackPopup.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    padding: "16px 20px",
    fontSize: "14px",
    fontFamily: "Roboto, Arial, sans-serif",
    zIndex: "99999",
    display: "none",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
<<<<<<< HEAD
    minWidth: "280px",
=======
    minWidth: "260px",
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf
    transition: "opacity 0.3s ease, transform 0.3s ease",
    opacity: "0",
    transform: "translateY(-10px)",
  });

  feedbackPopup.innerHTML = `
    <div id="feedback-message" style="font-weight: 500; text-align: center; color: #333;"></div>
    <div id="feedback-details" style="font-size: 12px; color: #666; text-align: center;"></div>
    <div id="feedback-buttons-container" style="display: flex; gap: 10px;">
      <button class="feedback-action-btn" data-feedback="correct" style="${feedbackButtonStyle(
        "success"
      )}">👍 Correct</button>
      <button class="feedback-action-btn" data-feedback="incorrect" style="${feedbackButtonStyle(
        "danger"
      )}">👎 Incorrect</button>
    </div>
    <button id="close-feedback-popup" style="${closeButtonStyle()}">&times;</button>
  `;
  document.body.appendChild(feedbackPopup);

  feedbackPopup
    .querySelector("#close-feedback-popup")
    .addEventListener("click", hideFeedbackPopup);
  feedbackPopup.querySelectorAll(".feedback-action-btn").forEach((button) => {
    button.addEventListener("click", handleFeedbackClick);
  });
}

// --- Style Helpers ---
function feedbackButtonStyle(type) {
  const base = `
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s ease, transform 0.1s ease;
    color: white;
  `;
  if (type === "success") return base + `background-color: #4caf50;`;
  if (type === "danger") return base + `background-color: #f44336;`;
  return base + `background-color: #4285F4;`;
}

function closeButtonStyle() {
  return `
    position: absolute;
    top: 6px;
    right: 8px;
    border: none;
    background: transparent;
    font-size: 18px;
    cursor: pointer;
    color: #888;
    transition: color 0.2s ease;
  `;
}

// --- Show/Hide Popup ---
<<<<<<< HEAD
function showFeedbackPopup(state, probability, emailText, apiResult) {
=======
function showFeedbackPopup(state, confidence, emailText, reason = "", words = []) {
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf
  if (!feedbackPopup) createFeedbackPopup();

  const messageDiv = feedbackPopup.querySelector("#feedback-message");
  const detailsDiv = feedbackPopup.querySelector("#feedback-details");
  const buttonsContainer = feedbackPopup.querySelector("#feedback-buttons-container");

<<<<<<< HEAD
  const percentage = Math.round(probability * 100);
  messageDiv.textContent = `Was this prediction accurate?`;
  
  // Show additional details from API
  let detailsText = `${state.toUpperCase()} - ${percentage}% confidence`;
  if (apiResult.suspicious_keywords && apiResult.suspicious_keywords.length > 0) {
    detailsText += `\nKeywords: ${apiResult.suspicious_keywords.slice(0, 3).join(', ')}`;
  }
  detailsDiv.textContent = detailsText;

  feedbackPopup.dataset.emailText = emailText;
  feedbackPopup.dataset.prediction = state;
  feedbackPopup.dataset.apiResult = JSON.stringify(apiResult);
=======
  const confidencePercent = Math.round(confidence * 100);
  const wordList = Array.isArray(words) ? words.join(", ") : words;

  messageDiv.innerHTML = `
    <div style="font-weight: 500; text-align: center; color: #333;">
      Was this prediction (<b>${state}</b> - ${confidencePercent}%) accurate?
    </div>
    <div style="margin-top: 8px; font-size: 13px; color: #444; text-align: left;">
      <b>Reason:</b> ${reason || "N/A"}<br>
      <b>Key Words:</b> ${wordList || "N/A"}
    </div>
  `;

  feedbackPopup.dataset.emailText = emailText;
  feedbackPopup.dataset.prediction = state;
  feedbackPopup.dataset.reason = reason;
  feedbackPopup.dataset.words = wordList;
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf

  buttonsContainer.style.display = "flex";

  Object.assign(feedbackPopup.style, {
    display: "flex",
    opacity: "1",
    transform: "translateY(0)",
  });
}

function hideFeedbackPopup() {
  if (feedbackPopup) {
    feedbackPopup.style.opacity = "0";
    feedbackPopup.style.transform = "translateY(-20px)";
    setTimeout(() => {
      feedbackPopup.style.display = "none";
<<<<<<< HEAD
    }, 300);
=======
    }, 1000000);
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf
  }
}

// --- Handle Feedback ---
function handleFeedbackClick(event) {
  const feedback = event.target.dataset.feedback;
  const emailText = feedbackPopup.dataset.emailText || "";
  const prediction = feedbackPopup.dataset.prediction || "unknown";
<<<<<<< HEAD
  const apiResultStr = feedbackPopup.dataset.apiResult || "{}";
  
  let apiResult = {};
  try {
    apiResult = JSON.parse(apiResultStr);
  } catch (e) {
    console.error("Failed to parse API result:", e);
  }
=======
  const reason = feedbackPopup.dataset.reason || "";
  const keywords = feedbackPopup.dataset.words || "";
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf

  console.log(`📩 Feedback: "${feedback}" (Prediction: "${prediction}")`);

  chrome.storage.local.get({ feedbackData: [] }, (data) => {
    const feedbackData = data.feedbackData;
    feedbackData.push({
      text: emailText,
<<<<<<< HEAD
      prediction: prediction,
      feedback: feedback,
      spam_probability: apiResult.spam_probability || 0,
      confidence: apiResult.confidence || "UNKNOWN",
      suspicious_keywords: apiResult.suspicious_keywords || [],
      model_used: apiResult.model_used || "Unknown",
      timestamp: new Date().toISOString()
=======
      prediction,
      feedback,
      reason,
      keywords,
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf
    });

    chrome.storage.local.set({ feedbackData }, () => {
      console.log("✅ Feedback saved:", {
        text: emailText.substring(0, 100),
        prediction,
        feedback,
<<<<<<< HEAD
        spam_probability: apiResult.spam_probability
=======
        reason,
        keywords,
>>>>>>> 698cba0e75c62a2f860883700e9eb31a46963ecf
      });
    });
  });

  const feedbackMessage = feedbackPopup.querySelector("#feedback-message");
  const feedbackDetails = feedbackPopup.querySelector("#feedback-details");
  const buttonsContainer = feedbackPopup.querySelector("#feedback-buttons-container");
  
  feedbackMessage.textContent = "Thanks for your feedback!";
  feedbackDetails.textContent = "Your feedback helps improve the model";
  buttonsContainer.style.display = "none";

  setTimeout(hideFeedbackPopup, 1500);
}

// --- Hover Effects ---
document.addEventListener("mouseover", (e) => {
  if (e.target.classList.contains("feedback-action-btn")) {
    e.target.style.transform = "scale(1.05)";
    e.target.style.opacity = "0.9";
  }
});
document.addEventListener("mouseout", (e) => {
  if (e.target.classList.contains("feedback-action-btn")) {
    e.target.style.transform = "scale(1)";
    e.target.style.opacity = "1";
  }
});

// --- Ensure popup exists ---
createFeedbackPopup();

// --- Hide popup on Gmail navigation ---
window.addEventListener("popstate", hideFeedbackPopup);
document.body.addEventListener("click", (e) => {
  if (
    feedbackPopup &&
    feedbackPopup.style.display !== "none" &&
    !feedbackPopup.contains(e.target) &&
    !e.target.closest(EMAIL_BODY_SELECTOR)
  ) {
    hideFeedbackPopup();
  }
});

// --- Scan current email if already open ---
setTimeout(() => {
  const currentEmailBody = document.querySelector(EMAIL_BODY_SELECTOR);
  if (currentEmailBody && !currentEmailBody.dataset.scanComplete) {
    currentEmailBody.setAttribute("data-scan-complete", "true");
    console.log("📬 Email already open, scanning...");
    scanEmail(currentEmailBody);
  }
}, 2000);

console.log("✅ Gmail Spam Scanner initialized with server connection!");
console.log("🔗 API URL:", API_URL);