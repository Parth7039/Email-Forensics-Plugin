console.log("✅ Gmail Spam Scanner (Local Model) Loaded!");

const EMAIL_BODY_SELECTOR = 'div.gs';
let currentScannedEmailId = null;

// --- Result Chip in Email Header ---
function displayResult(emailBodyElement, state, apiResult = null) {
  const existingBannerId = `spam-scan-banner-${emailBodyElement.dataset.scannerId}`;
  let chip = document.getElementById(existingBannerId);
  const header = document.querySelector('.hP');

  if (!chip && header) {
    chip = document.createElement('div');
    chip.id = existingBannerId;
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.padding = '4px 10px';
    chip.style.marginLeft = '12px';
    chip.style.borderRadius = '16px';
    chip.style.fontSize = '12px';
    chip.style.fontWeight = '500';
    chip.style.fontFamily = 'Roboto, Arial, sans-serif';
    chip.style.lineHeight = '1.5';
    chip.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.1)';
    chip.style.transition = 'all 0.2s ease-in-out';
    header.appendChild(chip);
  }

  if (!chip) return;

  switch (state) {
    case 'loading':
      chip.textContent = `🔍 Scanning...`;
      chip.style.backgroundColor = '#e3f2fd';
      chip.style.color = '#1565c0';
      hideFeedbackPopup();
      break;
    case 'spam':
      chip.textContent = `⚠️ Likely Spam (${Math.round(apiResult.confidence * 100)}%)`;
      chip.style.backgroundColor = '#ffcdd2';
      chip.style.color = '#c62828';
      showFeedbackPopup(state, apiResult.confidence);
      break;
    case 'safe':
      chip.textContent = `✅ Looks Safe (${Math.round(apiResult.confidence * 100)}%)`;
      chip.style.backgroundColor = '#c8e6c9';
      chip.style.color = '#2e7d32';
      showFeedbackPopup(state, apiResult.confidence);
      break;
  }
}

// --- Scanning ---
async function scanEmail(emailBodyElement) {
  emailBodyElement.dataset.scannerId = Date.now() + Math.random();
  displayResult(emailBodyElement, 'loading');

  const emailText = emailBodyElement.innerText;

  if (emailText.length < 50) {
    displayResult(emailBodyElement, 'safe', { confidence: 1.0 });
    return;
  }

  try {
    await loadModel(); // from spam_model.js
    const result = predict(emailText); // local inference
    displayResult(emailBodyElement, result.is_spam ? 'spam' : 'safe', result);
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
          const emailBodies = node.querySelectorAll(`${EMAIL_BODY_SELECTOR}:not([data-scan-complete])`);
          emailBodies.forEach(emailBody => {
            emailBody.setAttribute('data-scan-complete', 'true');
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
let feedbackPopup = null;

function createFeedbackPopup() {
  feedbackPopup = document.createElement('div');
  feedbackPopup.id = 'spam-scanner-feedback-popup';
  Object.assign(feedbackPopup.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    padding: '16px 20px',
    fontSize: '14px',
    fontFamily: 'Roboto, Arial, sans-serif',
    zIndex: '99999',
    display: 'none',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    minWidth: '220px',
    transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
    opacity: '0',
    transform: 'translateY(-10px)',
  });

  feedbackPopup.innerHTML = `
    <div id="feedback-message" style="font-weight: 500; text-align: center; color: #333;"></div>
    <div id="feedback-buttons-container" style="display: flex; gap: 10px;">
      <button class="feedback-action-btn" data-feedback="correct" style="${feedbackButtonStyle('success')}">👍 Correct</button>
      <button class="feedback-action-btn" data-feedback="incorrect" style="${feedbackButtonStyle('danger')}">👎 Incorrect</button>
    </div>
    <button id="close-feedback-popup" style="${closeButtonStyle()}">&times;</button>
  `;
  document.body.appendChild(feedbackPopup);

  feedbackPopup.querySelector('#close-feedback-popup').addEventListener('click', hideFeedbackPopup);
  feedbackPopup.querySelectorAll('.feedback-action-btn').forEach(button => {
    button.addEventListener('click', handleFeedbackClick);
  });
}

// Style helpers
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
  if (type === 'success') return base + `background-color: #4caf50;`;
  if (type === 'danger') return base + `background-color: #f44336;`;
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

// Show/Hide popup
function showFeedbackPopup(state, confidence) {
  if (!feedbackPopup) createFeedbackPopup();

  const messageDiv = feedbackPopup.querySelector('#feedback-message');
  const buttonsContainer = feedbackPopup.querySelector('#feedback-buttons-container');

  messageDiv.textContent = `Was this prediction (${state} - ${Math.round(confidence * 100)}%) accurate?`;
  buttonsContainer.style.display = 'flex';

  Object.assign(feedbackPopup.style, {
    display: 'flex',
    opacity: '1',
    transform: 'translateY(0)'
  });
}

function hideFeedbackPopup() {
  if (feedbackPopup) {
    feedbackPopup.style.opacity = '0';
    feedbackPopup.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      feedbackPopup.style.display = 'none';
    }, 1000000);
  }
}

// Handle feedback button clicks
function handleFeedbackClick(event) {
  const feedback = event.target.dataset.feedback;
  const feedbackMessage = feedbackPopup.querySelector('#feedback-message');
  const buttonsContainer = feedbackPopup.querySelector('#feedback-buttons-container');

  console.log(`User feedback: "${feedback}" for email ID ${currentScannedEmailId}`);
  feedbackMessage.textContent = 'Thanks for your feedback!';
  buttonsContainer.style.display = 'none';
}

// Hover effects
document.addEventListener('mouseover', e => {
  if (e.target.classList.contains('feedback-action-btn')) {
    e.target.style.transform = 'scale(1.05)';
    e.target.style.opacity = '0.9';
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.classList.contains('feedback-action-btn')) {
    e.target.style.transform = 'scale(1)';
    e.target.style.opacity = '1';
  }
});

// Ensure popup exists
createFeedbackPopup();

// Hide popup when navigating Gmail
window.addEventListener('popstate', hideFeedbackPopup);
document.body.addEventListener('click', e => {
  if (feedbackPopup && feedbackPopup.style.display !== 'none' &&
      !feedbackPopup.contains(e.target) &&
      !e.target.closest(EMAIL_BODY_SELECTOR)) {
    hideFeedbackPopup();
  }
});
