document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('copyButton').addEventListener('click', async function() {
    try {
      // Send a message to the content script to get the data
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getJobDetails
      }, (results) => {
        if (results[0].result) {
          let data = results[0].result;
          let csvContent = `${data.job_title}\t${data.hours_per_week}\t${data.salary_up_to}\t${data.job_poster}\t${data.job_link}`;
          
          // Copy to clipboard
          navigator.clipboard.writeText(csvContent).then(function() {
            console.log("Content copied to clipboard:", csvContent);
          }).catch(function(err) {
            console.error("Error copying content to clipboard:", err);
          });
        }
      });
    } catch (err) {
      console.error("Error executing script:", err);
    }
  });
});

// This function will be executed as a content script inside the current page
function getJobDetails() {
  let jobTitle = document.querySelector('body > section.bg-primary.section-perks.pt-4 > div > div > div > h1')?.innerText || "";
  let hoursPerWeek = document.querySelector('body > section.bg-ltblue.pt-4.pt-lg-0 > div > div.card.job-post.shadow.mb-4.mb-md-0 > div > div > div:nth-child(3) > dl > dd > p')?.innerText || "";
  let salaryUpTo = document.querySelector('body > section.bg-ltblue.pt-4.pt-lg-0 > div > div.card.job-post.shadow.mb-4.mb-md-0 > div > div > div:nth-child(2) > dl > dd > p')?.innerText || "";
  let jobPoster = document.querySelector("body > section.bg-ltblue.pt-4.pt-lg-0 > div > div:nth-child(3) > div > div > div.card-body > p:nth-child(1)")?.innerText || "";
  jobPoster = String(jobPoster).replace('Contact Person: ', '');
  let jobLink = window.location.href;

  return { job_title: jobTitle, hours_per_week: hoursPerWeek, salary_up_to: salaryUpTo, job_poster: jobPoster, job_link: jobLink };
}
