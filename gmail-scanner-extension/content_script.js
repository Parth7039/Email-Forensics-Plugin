console.log("✅ Gmail Spam Scanner v2.2 (Floating Feedback) Loaded!");

// Define selectors at the top for easy updating
const EMAIL_BODY_SELECTOR = 'div.gs';

// Global variable to keep track of the currently scanned email's ID
// This helps us associate feedback with the right scan result
let currentScannedEmailId = null;


// --- NEW & IMPROVED UI FUNCTION ---
function displayResult(emailBodyElement, state, apiResult = null) {
  const existingBannerId = `spam-scan-banner-${emailBodyElement.dataset.scannerId}`;
  let chip = document.getElementById(existingBannerId);

  // Find the header area to inject the chip into. This is more stable.
  const header = document.querySelector('.hP');

  // If the chip doesn't exist, create it
  if (!chip && header) {
    chip = document.createElement('div');
    chip.id = existingBannerId;

    // --- New "Chip" Styles ---
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

    // Inject the chip into the email header
    header.appendChild(chip);
  }

  // If the chip still doesn't exist (header not found), do nothing.
  if (!chip) return;

  // Update chip content and style based on the state
  switch (state) {
    case 'loading':
      chip.textContent = `🔍 Scanning...`;
      chip.style.backgroundColor = '#e3f2fd'; // Light blue
      chip.style.color = '#1565c0'; // Dark blue
      hideFeedbackPopup();
      break;
    case 'spam':
      chip.textContent = `⚠️ Likely Spam (${Math.round(apiResult.confidence * 100)}%)`;
      chip.style.backgroundColor = '#ffcdd2'; // Light red
      chip.style.color = '#c62828'; // Dark red
      showFeedbackPopup(state, apiResult.confidence);
      break;
    case 'safe':
      chip.textContent = `✅ Looks Safe (${Math.round(apiResult.confidence * 100)}%)`;
      chip.style.backgroundColor = '#c8e6c9'; // Light green
      chip.style.color = '#2e7d32'; // Dark green
      showFeedbackPopup(state, apiResult.confidence);
      break;
  }
}


async function scanEmail(emailBodyElement) {
  emailBodyElement.dataset.scannerId = Date.now() + Math.random();
  displayResult(emailBodyElement, 'loading');

  const emailText = emailBodyElement.innerText;
  
  if (emailText.length < 50) {
      displayResult(emailBodyElement, 'safe', { confidence: 1.0 });
      return;
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/scan-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: emailText }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

    const result = await response.json();
    displayResult(emailBodyElement, result.is_spam ? 'spam' : 'safe', result);

  } catch (error) {
    console.error("❌ Failed to scan email:", error);
  }
}

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


// --- NEW: Floating Feedback Popup UI ---
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
        display: 'none', // Hidden by default
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
            <button class="feedback-action-btn" data-feedback="correct" title="This prediction was correct" style="${feedbackButtonStyle('success')}">👍 Correct</button>
            <button class="feedback-action-btn" data-feedback="incorrect" title="This prediction was incorrect" style="${feedbackButtonStyle('danger')}">👎 Incorrect</button>
        </div>
        <button id="close-feedback-popup" style="${closeButtonStyle()}">&times;</button>
    `;
    document.body.appendChild(feedbackPopup);

    // Attach event listeners to the popup buttons
    feedbackPopup.querySelector('#close-feedback-popup').addEventListener('click', hideFeedbackPopup);
    feedbackPopup.querySelectorAll('.feedback-action-btn').forEach(button => {
        button.addEventListener('click', handleFeedbackClick);
    });
}

// Modern button styles
function feedbackButtonStyle(type) {
    const baseStyle = `
        border: none;
        padding: 8px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.2s ease, transform 0.1s ease;
    `;
    if (type === 'success') {
        return baseStyle + `
            background-color: #4caf50;
            color: white;
        `;
    }
    if (type === 'danger') {
        return baseStyle + `
            background-color: #f44336;
            color: white;
        `;
    }
    return baseStyle;
}

// Hover + active states via JS
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

// Close button top-right like a floating icon
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

// Animate popup show/hide
function showFeedbackPopup(message) {
    const popup = document.getElementById('spam-scanner-feedback-popup');
    if (!popup) return;
    popup.style.display = 'flex';
    popup.querySelector('#feedback-message').textContent = message;
    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0)';
    }, 10);
}

function hideFeedbackPopup() {
    const popup = document.getElementById('spam-scanner-feedback-popup');
    if (!popup) return;
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300);
}


function showFeedbackPopup(state, confidence) {
    if (!feedbackPopup) {
        createFeedbackPopup(); // Create if it doesn't exist
    }

    const messageDiv = feedbackPopup.querySelector('#feedback-message');
    const buttonsContainer = feedbackPopup.querySelector('#feedback-buttons-container');

    messageDiv.textContent = `Was this prediction (${state.charAt(0).toUpperCase() + state.slice(1)} - ${Math.round(confidence * 100)}%) accurate?`;
    buttonsContainer.style.display = 'flex'; // Show buttons

    Object.assign(feedbackPopup.style, {
        display: 'flex',
        opacity: '1',
        transform: 'translateY(0)'
    });
}

function hideFeedbackPopup() {
    if (feedbackPopup) {
        Object.assign(feedbackPopup.style, {
            opacity: '0',
            transform: 'translateY(-20px)'
        });
        setTimeout(() => {
            feedbackPopup.style.display = 'none';
        }, 1000000); // Hide after transition
    }
}

function handleFeedbackClick(event) {
    const feedback = event.target.dataset.feedback;
    const feedbackMessage = feedbackPopup.querySelector('#feedback-message');
    const buttonsContainer = feedbackPopup.querySelector('#feedback-buttons-container');

    console.log(`User feedback received for email ID ${currentScannedEmailId}: Prediction was "${feedback}".`);
    
    feedbackMessage.textContent = 'Thanks for your feedback!';
    buttonsContainer.style.display = 'none'; // Hide buttons after click
    
    // You would typically send this feedback to your backend here
    // Example: fetch('/feedback', { method: 'POST', body: JSON.stringify({ emailId: currentScannedEmailId, feedback: feedback }) });
}

// Helper for button styles
function feedbackButtonStyle() {
    return `
        background-color: #4285F4; color: white; border: none;
        border-radius: 4px; padding: 8px 12px; font-size: 13px;
        cursor: pointer; margin: 0 5px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        transition: background-color 0.2s;
    `;
}

function closeButtonStyle() {
    return `
        position: absolute; top: 5px; right: 8px;
        background: none; border: none; font-size: 14px;
        cursor: pointer; color: #5f6368;
    `;
}

// Ensure popup is created when the script first loads
createFeedbackPopup();

console.log("👀 Starting Gmail observer...");
const observer = new MutationObserver(handleMutation);
observer.observe(document.body, { childList: true, subtree: true });

// --- NEW: Hide popup on navigation (e.g., going back to inbox) ---
window.addEventListener('popstate', hideFeedbackPopup);
document.body.addEventListener('click', (event) => {
    // If the click is outside the popup and not on the email body, hide it
    if (feedbackPopup && feedbackPopup.style.display !== 'none' && 
        !feedbackPopup.contains(event.target) && !event.target.closest(EMAIL_BODY_SELECTOR)) {
        hideFeedbackPopup();
    }
});