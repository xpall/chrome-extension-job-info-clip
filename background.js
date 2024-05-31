// Background script to handle copying content to clipboard
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "copyToClipboard") {
    // Construct text to copy
    let textToCopy = `${message.data.job_title},${message.data.hours_per_week},${message.data.salary_up_to},${message.data.job_poster},${message.data.job_link}`;

    // Copy text to clipboard
    navigator.clipboard.writeText(textToCopy).then(function() {
      console.log("Text copied to clipboard:", textToCopy);
    }, function(err) {
      console.error("Error copying text to clipboard:", err);
    });
  }
});
