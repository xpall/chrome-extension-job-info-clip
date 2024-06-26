document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('copyButton').addEventListener('click', async function() {
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
        // Insert details to HTML
        const insertJobTitle = document.getElementById("jobTitle");
        const insertHours = document.getElementById('hours');
        const insertCompensation = document.getElementById('compensation');
        const insertContactPerson = document.getElementById('contactPerson');
        const insertLink = document.getElementById('link');
        // const insertPlatform = document.getElementById('activePlatform');

        // Change active platform logo
        const onlinejobs = document.getElementById("logoOLJ");
        const indeed = document.getElementById("logoIndeed");
        const upwork = document.getElementById("logoUpwork");

        insertJobTitle.innerText = data.job_title;
        insertHours.innerText = data.hours_per_week;
        insertCompensation.innerText = data.salary_up_to;
        insertContactPerson.innerText = data.job_poster;
        insertLink.innerText = data.job_link;

        // Extract platform name
        const domainParts = (new URL(data.job_link)).hostname.split('.');
        const platform = domainParts.includes('onlinejobs') ? 'onlinejobs' : domainParts.includes('upwork') ? 'upwork' : 'indeed';
        // insertPlatform.innerText = platform;

        // Set zIndex for the active logo
        const platformLogos = {
            upwork: upwork,
            onlinejobs: onlinejobs,
            indeed: indeed
        };

        // Reset zIndex
        Object.values(platformLogos).forEach(logo => logo.style.zIndex = "0");

        // Set zIndex for the active platform logo
        platformLogos[platform].style.zIndex = "20";
      }
    });
  });
});

// This function will be executed as a content script inside the current page
function getJobDetails() {
  let platform = window.location.href;
  if ((/^https:\/\/www\.onlinejobs\.ph\/jobseekers\/job\/.*/).test(platform)) {
    return isFromOLJ();
  }
  else if ((/^https:\/\/ph.indeed.com\/*/).test(platform)) {
  return isFromIndeed();
  }
  else if ((/^https:\/\/www.upwork.com\/*/).test(platform)) {
  return isFromUpwork();
  }

  // ##### FROM OLJ CODE BLOCK ##### //
  function isFromOLJ() {
    let jobTitle = document.querySelector('body > section.bg-primary.section-perks.pt-4 > div > div > div > h1')?.innerText || "";
    let hoursPerWeek = document.querySelector('body > section.bg-ltblue.pt-4.pt-lg-0 > div > div.card.job-post.shadow.mb-4.mb-md-0 > div > div > div:nth-child(3) > dl > dd > p')?.innerText || "";
    let salaryUpTo = document.querySelector('body > section.bg-ltblue.pt-4.pt-lg-0 > div > div.card.job-post.shadow.mb-4.mb-md-0 > div > div > div:nth-child(2) > dl > dd > p')?.innerText || "";
    let jobPoster = document.querySelector("body > section.bg-ltblue.pt-4.pt-lg-0")?.innerText || ""; 
      function removeAfterLineBreak(inputString) {
          let parts = inputString.split('Contact Person: ');
          return parts[1];
          }
      function retainContactPersonName(inputString) {
        let firstLine = inputString.split('\n')[0];
        return firstLine;
        }
      jobPoster = removeAfterLineBreak(jobPoster);
      jobPoster = retainContactPersonName(jobPoster);
    let jobLink = window.location.href;
    
    return { job_title: jobTitle, hours_per_week: hoursPerWeek, salary_up_to: salaryUpTo, job_poster: jobPoster, job_link: jobLink };
    }

  // ##### FROM INDEED CODE BLOCK ##### //
  function isFromIndeed() {
    let jobTitle = document.querySelector("#vjs-container > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1s5gqtr.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-17riagq.eu4oa1w0 > div.jobsearch-HeaderContainer.css-n78gek.eu4oa1w0 > div > div:nth-child(1) > div.jobsearch-JobInfoHeader-title-container.css-bbq8li.eu4oa1w0 > h2")?.innerText || "";
      function trimJobTitle(rawJobTitle) {
        const trimmedJobTitle = rawJobTitle.split("\n")[0];
        return trimmedJobTitle;
        }
    let hoursPerWeek = document.querySelector("#jobDetailsSection > div > div.js-match-insights-provider-36vfsm.eu4oa1w0")?.innerText || "";
        function extractHoursPerWeek(jobDetails) {
            // Regex to match "Job type" and the line below it
        const jobTypeRegex = /Job type\n([^\n]*)/;
        // Regex to match "Shift and schedule" and the line below it
        const shiftAndScheduleRegex = /Shift and schedule\n([^\n]*)/;

        // Match the job type
        const jobTypeMatch = jobDetails.match(jobTypeRegex);
        // Match the shift and schedule
        const shiftAndScheduleMatch = jobDetails.match(shiftAndScheduleRegex);

        // Initialize the result
        let result = '';

        if (jobTypeMatch) {
            result += jobTypeMatch[1].trim();
        }

        if (shiftAndScheduleMatch) {
            if (result) {
                result += " | ";
            }
            result += shiftAndScheduleMatch[1].trim();
        }

        return result;
          }
    let salaryUpTo = document.querySelector("#jobDetailsSection > div > div.js-match-insights-provider-36vfsm.eu4oa1w0")?.innerText || "";
      function extractPayDetails(jobDetails) {
        const payIndex = jobDetails.indexOf("Pay");
        if (payIndex === -1) {
            return "TBD";
        }
        const payDetails = jobDetails.substring(payIndex + 3).trim();
        const endOfPayDetails = payDetails.indexOf("\n");
        return endOfPayDetails === -1 ? payDetails : payDetails.substring(0, endOfPayDetails).trim();
        }
      
    jobTitle = trimJobTitle(jobTitle);
    hoursPerWeek = extractHoursPerWeek(hoursPerWeek);
    let jobPoster = document.querySelector("#vjs-container > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1s5gqtr.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-17riagq.eu4oa1w0 > div.jobsearch-HeaderContainer.css-n78gek.eu4oa1w0 > div")?.innerText || "";
        function extractCompany(jobDetails) {
        const trimmedContact = jobDetails.split("\n")[2];
        return trimmedContact;        
        }

    jobPoster = extractCompany(jobPoster)
    let jobLink = window.location.href;
    salaryUpTo = extractPayDetails(salaryUpTo);
    console.log(jobTitle);
    console.log(hoursPerWeek);
    console.log(salaryUpTo);
    console.log(jobPoster);
    console.log(jobLink)
    
    return { job_title: jobTitle, hours_per_week: hoursPerWeek, salary_up_to: salaryUpTo, job_poster: jobPoster, job_link: jobLink };
    }

  // ##### FROM UPWROK CODE BLOCK ##### //
  function isFromUpwork() {
    let jobTitle = document.querySelector("#main > div.container > div:nth-child(4) > div > div > div.job-details-card.d-flex.gap-0.air3-card.air3-card-outline.p-0 > div > section:nth-child(1)")?.innerText || "";
    jobTitle = jobTitle.split("\n")[0]
    let completeJobDetails = document.querySelector("#main > div.container > div:nth-child(4) > div > div > div.job-details-card.d-flex.gap-0.air3-card.air3-card-outline.p-0 > div")?.innerText || "";

    // GET Project type
      function extractProjectType(jobDetails) {
      // Split the job details string into an array of lines
      const lines = jobDetails.split('\n');
      
      // Loop through each line
      for (const line of lines) {
          // Check if the line contains "Project Type:"
          if (line.includes('Project Type:')) {
              // Return the line if found
              return line.trim();
          }
      }
      
      // Return null if "Project Type:" is not found
      return null;
       }
    
    // GET Compensation
       function extractCompensation(jobDetails) {
        return jobDetails.split('-price')[0]
      }
    let hoursPerWeek = extractProjectType(completeJobDetails).replace('Project Type: ', '');

    let salaryUpTo = extractCompensation(completeJobDetails)
    salaryUpTo = salaryUpTo.substring(salaryUpTo.length - 20)
    salaryUpTo = salaryUpTo.match(/[^\D.]+(?:\.\d*)?/g).join('');


    let jobPoster = document.querySelector("#main > div.container > div:nth-child(4) > div > div > div.job-details-card.d-flex.gap-0.air3-card.air3-card-outline.p-0 > div.sidebar.air3-card-sections > section")?.innerText || "";
    jobPoster = jobPoster.substring(jobPoster.length - 35).split('\n')[1]
    let jobLink = window.location.href;
    console.log(salaryUpTo);
    console.log(jobPoster);
    console.log(jobLink)
    
    return { job_title: jobTitle, hours_per_week: hoursPerWeek, salary_up_to: salaryUpTo, job_poster: jobPoster, job_link: jobLink };
    }
  }

  // ##### BUTTONS CODE BLOCK ##### //
const contactAuthor = document.getElementById("contactAuthor");
const reviewExtension = document.getElementById("reviewExtension");
const getSpreadsheetTemplate = document.getElementById("spreadsheetTemplate");

contactAuthor.addEventListener("click", openNewTabContactAuthor);
reviewExtension.addEventListener("click", openNewTabReviewExtension);
getSpreadsheetTemplate.addEventListener("click", openNewTabGetSpreadsheetTemplate);

function openNewTabContactAuthor() {
  window.open("https://www.johnlloyd.dev/#contact", "_blank")
};

function openNewTabReviewExtension() {
  window.open("https://chromewebstore.google.com/detail/onlinejobsph-job-details/mppkpknfccgbmhhddljakcgeckbphhjf?authuser=0&hl=en", "_blank")
}

function openNewTabGetSpreadsheetTemplate() {
  window.open("https://docs.google.com/spreadsheets/d/1BCd1tkmh_4Ia8SOq-MlVj1NimTvoomClr7FMOPm0Gzo/edit?gid=0#gid=0"), "_blank"
}