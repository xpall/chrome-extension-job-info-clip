// Content script to retrieve content from divs on onlinejobs.ph
// Modify this code to target the specific divs you want to copy

// Example: Copy the text content of divs with class "job-title" and "job-description"
let jobTitle = document.querySelector('body > section.bg-primary.section-perks.pt-4 > div > div > div > h1').innerText;
let hoursPerWeek = document.querySelector('body > section.bg-ltblue.pt-4.pt-lg-0 > div > div.card.job-post.shadow.mb-4.mb-md-0 > div > div > div:nth-child(3) > dl > dd > p').innerText;
let salaryUpTo = document.querySelector('body > section.bg-ltblue.pt-4.pt-lg-0 > div > div.card.job-post.shadow.mb-4.mb-md-0 > div > div > div:nth-child(2) > dl > dd > p').innerText;
let jobPoster = document.querySelector('body > section.bg-ltblue.pt-4.pt-lg-0 > div > div:nth-child(4) > div > div > div.card-body > p:nth-child(1) > strong').innerText
let link = window. location. href;

// Send message to background script with the content
chrome.runtime.sendMessage({
  action: "copyToClipboard",
  data: {
    job_title: jobTitle,
    hours_per_week: hoursPerWeek,
    salary_up_to: salaryUpTo,
    job_poster: jobPoster,
    job_link: link
  }
});
