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

        insertJobTitle.innerText = data.job_title;
        insertHours.innerText = data.hours_per_week;
        insertCompensation.innerText = data.salary_up_to;
        insertContactPerson.innerText = data.job_poster;
        insertLink.innerText = data.job_link;
        
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
    let jobPoster = document.querySelector("body > section.bg-ltblue.pt-4.pt-lg-0 > div > div:nth-child(4) > div > div > div.card-body")?.innerText || ""; 
    function removeAfterLineBreak(inputString) {
          let parts = inputString.split('\n');
          return parts[0];
          }
          function removeContactPerson(inputString) {
        let firstLine = inputString.replace('Contact Person: ', '');
        return firstLine;
        }
      jobPoster = removeAfterLineBreak(jobPoster);
      jobPoster = removeContactPerson(jobPoster);
      
    let jobLink = window.location.href;
    
    // console.log(jobTitle);
    // console.log(hoursPerWeek);
    // console.log(salaryUpTo);
    // console.log(jobPoster);
    // console.log(jobLink)
    
    return { job_title: jobTitle, hours_per_week: hoursPerWeek, salary_up_to: salaryUpTo, job_poster: jobPoster, job_link: jobLink };
    }

  // ##### FROM INDEED CODE BLOCK ##### //
  function isFromIndeed() {
    let jobTitle = document.querySelector("#vjs-container > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1s5gqtr.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-17riagq.eu4oa1w0 > div.jobsearch-HeaderContainer.css-n78gek.eu4oa1w0")
?.innerText || "";
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
    let jobPoster = document.querySelector("#vjs-container > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1s5gqtr.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-17riagq.eu4oa1w0 > div.jobsearch-HeaderContainer.css-n78gek.eu4oa1w0")
?.innerText || "";
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
    let jobTitle = document.querySelector("#main > div.container > div:nth-child(4) > div > div > div.job-details-card.d-flex.gap-0.air3-card.air3-card-outline.p-0 > div > section:nth-child(1) > h4 > span")?.innerText || "";
    let completeJobDetails = document.querySelector("#main > div.container > div:nth-child(4) > div > div")?.innerText || "";
    let salaryUpTo = document.querySelector("body > div.job-details-slider.air3-fullscreen-element > div > div.air3-fullscreen-container.is-scrolled-top.is-scrolled-bottom > div")?.innerText || "";
    salaryUpTo = salaryUpTo.replace("\n"," ")   
        function extractSalaryUpTo(jobDetails) {
          // Constructing the regex with the hardcoded "-price" constant
          const priceRegex = /\b(\$[\d.]+)\b[^$]*-price/i;

          const priceMatch = jobDetails.match(priceRegex);

          let result = '';

          if (priceMatch) {
              result += priceMatch[1].trim();
          }
          return result;
          }

    let jobPoster = document.querySelector("#jobsearch-ViewjobPaneWrapper > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1s5gqtr.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-17riagq.eu4oa1w0 > div.jobsearch-HeaderContainer.css-n78gek.eu4oa1w0 > div > div:nth-child(1) > div.css-2wyr5j.eu4oa1w0 > div > div > div > div.css-1h46us2.eu4oa1w0 > div.css-hon9z8.eu4oa1w0 > span > a")?.innerText || ""; 
    let jobLink = window.location.href;
    salaryUpTo = extractSalaryUpTo(salaryUpTo);
    console.log(jobTitle);
    console.log(hoursPerWeek);
    console.log(salaryUpTo);
    console.log(jobPoster);
    console.log(jobLink)
    
    return { job_title: jobTitle, hours_per_week: hoursPerWeek, salary_up_to: salaryUpTo, job_poster: jobPoster, job_link: jobLink };
    }
  }