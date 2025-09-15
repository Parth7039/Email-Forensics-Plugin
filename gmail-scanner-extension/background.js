chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "exportFeedback",
    title: "Export Feedback",
    contexts: ["action"] // appears in the 3-dot menu of extension icon
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "exportFeedback") {
    exportFeedbackAsCSV();
  }
});

function exportFeedbackAsCSV() {
  chrome.storage.local.get("feedbackData", (data) => {
    const feedbackData = data.feedbackData || [];

    if (feedbackData.length === 0) {
      console.log("⚠️ No feedback data available to export.");
      return;
    }

    let csv = "Message,Category\n";
    feedbackData.forEach(entry => {
      const label = entry.feedback === "incorrect"
        ? (entry.prediction === "spam" ? "ham" : "spam")
        : entry.prediction;
      csv += `"${entry.text.replace(/"/g, '""')}",${label}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: "feedback.csv",
      saveAs: true // will open Save As dialog
    }, downloadId => {
      if (chrome.runtime.lastError) {
        console.error("❌ Download failed:", chrome.runtime.lastError.message);
      } else {
        console.log("✅ Feedback exported, downloadId:", downloadId);
      }
    });
  });
}
