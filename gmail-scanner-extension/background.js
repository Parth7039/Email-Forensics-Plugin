console.log("🛡️ Gmail Spam Scanner - Background Service Worker Started");

// ============= SERVER CONFIGURATION =============
const SERVER_URL = "http://localhost:8000";
// For production: "https://your-domain.com"
// ===============================================

// Context menu for exporting feedback
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "exportFeedback",
    title: "Export Feedback",
    contexts: ["action"] // appears in the 3-dot menu of extension icon
  });
  
  console.log("🎉 Gmail Spam Scanner installed!");
  checkServerHealth(); // Initial server check
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "exportFeedback") {
    exportFeedbackAsCSV();
  }
});

// Export feedback data as CSV
function exportFeedbackAsCSV() {
  chrome.storage.local.get("feedbackData", (data) => {
    const feedbackData = data.feedbackData || [];

    if (feedbackData.length === 0) {
      console.log("⚠️ No feedback data available to export.");
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'No Feedback Data',
        message: 'No feedback data available to export yet.'
      });
      return;
    }

    // CSV header with all fields
    let csv = "Message,Prediction,Feedback,Spam_Probability,Confidence,Model,Timestamp\n";
    
    feedbackData.forEach(entry => {
      // Determine the actual label based on feedback
      const actualLabel = entry.feedback === "incorrect"
        ? (entry.prediction === "spam" ? "ham" : "spam")
        : entry.prediction;
      
      // Clean the message text for CSV
      const cleanText = (entry.text || "").replace(/"/g, '""').replace(/\n/g, ' ');
      
      // Build CSV row
      csv += `"${cleanText}",`;
      csv += `${entry.prediction || "unknown"},`;
      csv += `${entry.feedback || "unknown"},`;
      csv += `${entry.spam_probability || 0},`;
      csv += `${entry.confidence || "UNKNOWN"},`;
      csv += `${entry.model_used || "Unknown"},`;
      csv += `${entry.timestamp || ""}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: "spam_scanner_feedback.csv",
      saveAs: true // will open Save As dialog
    }, downloadId => {
      if (chrome.runtime.lastError) {
        console.error("❌ Download failed:", chrome.runtime.lastError.message);
      } else {
        console.log("✅ Feedback exported, downloadId:", downloadId);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Feedback Exported',
          message: `Successfully exported ${feedbackData.length} feedback entries!`
        });
      }
    });
  });
}

// Check server health
async function checkServerHealth() {
  try {
    const response = await fetch(`${SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Server health check: OK", data);
      
      // Update badge to show server is online
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#00C851" });
      
      return true;
    } else {
      console.warn("⚠️ Server health check: Failed with status", response.status);
      updateBadgeOffline();
      return false;
    }
  } catch (error) {
    console.error("❌ Server health check: Connection failed", error.message);
    updateBadgeOffline();
    return false;
  }
}

// Update badge to show server is offline
function updateBadgeOffline() {
  chrome.action.setBadgeText({ text: "✗" });
  chrome.action.setBadgeBackgroundColor({ color: "#ff4444" });
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 Browser started, initializing Gmail Spam Scanner");
  checkServerHealth();
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkServer") {
    checkServerHealth().then(isOnline => {
      sendResponse({ online: isOnline });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === "getServerStatus") {
    fetch(`${SERVER_URL}/model-info`)
      .then(response => response.json())
      .then(data => {
        sendResponse({ 
          online: true, 
          modelInfo: data 
        });
      })
      .catch(error => {
        sendResponse({ 
          online: false, 
          error: error.message 
        });
      });
    return true;
  }
  
  if (request.action === "exportFeedback") {
    exportFeedbackAsCSV();
    sendResponse({ success: true });
    return true;
  }
});

// Periodic server health check (every 60 seconds)
setInterval(() => {
  checkServerHealth();
}, 60000);

// Initial health check
setTimeout(() => {
  checkServerHealth();
}, 2000);

console.log("✅ Background service worker initialized successfully");
console.log("🔗 Server URL:", SERVER_URL);