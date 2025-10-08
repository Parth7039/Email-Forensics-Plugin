console.log("✅ Gmail Spam Scanner (Local Model) Loaded!");

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
      break;
  }
}

// --- Scanning ---
async function scanEmail(emailBodyElement) {
  emailBodyElement.dataset.scannerId = Date.now() + Math.random();
  currentScannedEmailId = emailBodyElement.dataset.scannerId;
  displayResult(emailBodyElement, "loading");

  const emailText = emailBodyElement.innerText;

  if (emailText.length < 50) {
    displayResult(emailBodyElement, "safe", {
      confidence: 1.0,
      reason: "Short message – unlikely to be spam.",
      influentialWords: [],
    });
    return;
  }

  try {
    await loadModel(); // from spam_model.js
    const result = predict(emailText); // local inference
    displayResult(emailBodyElement, result.is_spam ? "spam" : "safe", result);
  } catch (error) {
    console.error("❌ Failed to scan email:", error);
  }
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
    minWidth: "260px",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    opacity: "0",
    transform: "translateY(-10px)",
  });

  feedbackPopup.innerHTML = `
    <div id="feedback-message" style="font-weight: 500; text-align: center; color: #333;"></div>
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
function showFeedbackPopup(state, confidence, emailText, reason = "", words = []) {
  if (!feedbackPopup) createFeedbackPopup();

  const messageDiv = feedbackPopup.querySelector("#feedback-message");
  const buttonsContainer = feedbackPopup.querySelector("#feedback-buttons-container");

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
    }, 1000000);
  }
}

// --- Handle Feedback ---
function handleFeedbackClick(event) {
  const feedback = event.target.dataset.feedback;
  const emailText = feedbackPopup.dataset.emailText || "";
  const prediction = feedbackPopup.dataset.prediction || "unknown";
  const reason = feedbackPopup.dataset.reason || "";
  const keywords = feedbackPopup.dataset.words || "";

  console.log(`📩 Feedback: "${feedback}" (Prediction: "${prediction}")`);

  chrome.storage.local.get({ feedbackData: [] }, (data) => {
    const feedbackData = data.feedbackData;
    feedbackData.push({
      text: emailText,
      prediction,
      feedback,
      reason,
      keywords,
    });

    chrome.storage.local.set({ feedbackData }, () => {
      console.log("✅ Feedback saved:", {
        text: emailText,
        prediction,
        feedback,
        reason,
        keywords,
      });
    });
  });

  const feedbackMessage = feedbackPopup.querySelector("#feedback-message");
  const buttonsContainer = feedbackPopup.querySelector("#feedback-buttons-container");
  feedbackMessage.textContent = "Thanks for your feedback!";
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
