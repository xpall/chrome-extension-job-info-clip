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

// Helper function to evaluate XPath and return element
function getElementByXPath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

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

  // ##### FROM OLJ CODE BLOCK - UPDATED WITH XPATH AND FALLBACKS ##### //
  function isFromOLJ() {
    // Helper function to evaluate XPath (needs to be redefined in this scope)
    function getElementByXPath(xpath) {
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    // Helper function to try multiple selectors and return first successful result
    function getElementWithFallbacks(selectors) {
      for (let selector of selectors) {
        let element = null;
        if (selector.type === 'xpath') {
          element = getElementByXPath(selector.value);
        } else if (selector.type === 'css') {
          element = document.querySelector(selector.value);
        }
        if (element && element.innerText && element.innerText.trim() !== '') {
          return element;
        }
      }
      return null;
    }

    // Job Title selectors (primary XPath + CSS fallbacks)
    let jobTitleSelectors = [
      { type: 'xpath', value: '/html/body/div/section[1]/div/div/div/h1' },
      { type: 'css', value: 'h1' },
      { type: 'css', value: 'section.bg-primary h1' },
      { type: 'css', value: '.section-perks h1' }
    ];
    let jobTitleElement = getElementWithFallbacks(jobTitleSelectors);
    let jobTitle = jobTitleElement?.innerText?.trim() || "";

    // Hours selectors
    let hoursSelectors = [
      { type: 'xpath', value: '/html/body/div/section[2]/div/div[1]/div/div/div[3]/dl/dd/p' },
      { type: 'css', value: 'body > section.bg-ltblue.pt-4.pt-lg-0 > div > div.card.job-post.shadow.mb-4.mb-md-0 > div > div > div:nth-child(3) > dl > dd > p' },
      { type: 'css', value: '.job-post dd p' }
    ];
    let hoursElement = getElementWithFallbacks(hoursSelectors);
    let hoursPerWeek = hoursElement?.innerText?.trim() || "";

    // Salary selectors
    let salarySelectors = [
      { type: 'xpath', value: '/html/body/div/section[2]/div/div[1]/div/div/div[2]/dl/dd/p' },
      { type: 'css', value: 'body > section.bg-ltblue.pt-4.pt-lg-0 > div > div.card.job-post.shadow.mb-4.mb-md-0 > div > div > div:nth-child(2) > dl > dd > p' },
      { type: 'css', value: '.job-post dd p' }
    ];
    let salaryElement = getElementWithFallbacks(salarySelectors);
    let salaryUpTo = salaryElement?.innerText?.trim() || "";

    // Contact Person extraction with multiple strategies
    let jobPoster = "";
    
    // Strategy 1: Try XPath for direct strong element
    let contactElement = getElementByXPath('/html/body/div/section[2]/div/div[3]/div/div/div[2]/p[1]/strong');
    if (contactElement && contactElement.innerText) {
      jobPoster = contactElement.innerText.trim();
    }
    
    // Strategy 2: Look for paragraph with "Contact Person:" text and extract strong element
    if (!jobPoster) {
      let contactParagraphs = document.querySelectorAll('p.mb-2');
      for (let p of contactParagraphs) {
        if (p.innerText && p.innerText.includes('Contact Person:')) {
          let strongElement = p.querySelector('strong');
          if (strongElement) {
            jobPoster = strongElement.innerText.trim();
            break;
          }
        }
      }
    }
    
    // Strategy 3: Broader search for any element containing "Contact Person:"
    if (!jobPoster) {
      let allElements = document.querySelectorAll('*');
      for (let element of allElements) {
        if (element.innerText && element.innerText.includes('Contact Person:')) {
          // Try to extract just the name after "Contact Person:"
          let text = element.innerText;
          let match = text.match(/Contact Person:\s*(.+?)(?:\n|$)/);
          if (match && match[1]) {
            jobPoster = match[1].trim();
            break;
          }
          // Alternative: look for strong element within this element
          let strongElement = element.querySelector('strong');
          if (strongElement) {
            jobPoster = strongElement.innerText.trim();
            break;
          }
        }
      }
    }
    
    // Strategy 4: Fallback to old method if all else fails
    if (!jobPoster) {
      let oldContactElement = document.querySelector("body > section.bg-ltblue.pt-4.pt-lg-0");
      if (oldContactElement && oldContactElement.innerText) {
        let text = oldContactElement.innerText;
        if (text.includes('Contact Person:')) {
          let parts = text.split('Contact Person: ');
          if (parts[1]) {
            let firstLine = parts[1].split('\n')[0];
            jobPoster = firstLine.trim();
          }
        }
      }
    }

    let jobLink = window.location.href;

    // Log extracted data for debugging
    console.log("OLJ Extracted Data:");
    console.log("Job Title:", jobTitle);
    console.log("Hours:", hoursPerWeek);
    console.log("Salary:", salaryUpTo);
    console.log("Contact:", jobPoster);
    console.log("Link:", jobLink);
    
    return { job_title: jobTitle, hours_per_week: hoursPerWeek, salary_up_to: salaryUpTo, job_poster: jobPoster, job_link: jobLink };
  }

  // ##### FROM INDEED CODE BLOCK - UPDATED WITH NEW SELECTORS ##### //
function isFromIndeed() {
  // Helper function to evaluate XPath and return element
  function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }

  // Helper function to try multiple selectors and return first successful result
  function getElementWithFallbacks(selectors) {
    for (let selector of selectors) {
      let element = null;
      if (selector.type === 'xpath') {
        element = getElementByXPath(selector.value);
      } else if (selector.type === 'css') {
        element = document.querySelector(selector.value);
      }
      if (element && element.innerText && element.innerText.trim() !== '') {
        return element;
      }
    }
    return null;
  }

  // Job Title selectors (new primary selector + fallbacks)
  let jobTitleSelectors = [
    { type: 'xpath', value: '/html/body/div[2]/div/div/div/span/div[4]/div[5]/div/section/div/div/div[2]/div[2]/div[1]/div/div[1]/div[1]/h2/span' },
    { type: 'css', value: '#vjs-container > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1hce1u2.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-k5qkgm.eu4oa1w0 > div.jobsearch-HeaderContainer.css-86m7cf.eu4oa1w0 > div > div:nth-child(1) > div.jobsearch-JobInfoHeader-title-container.css-1u3gzh9.eu4oa1w0 > h2 > span' },
    { type: 'css', value: 'h2.jobsearch-JobInfoHeader-title' },
    { type: 'css', value: 'h2[data-testid="jobsearch-JobInfoHeader-title"]' },
    // Fallback to old selectors
    { type: 'css', value: "#vjs-container > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1hce1u2.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-k5qkgm.eu4oa1w0 > div.jobsearch-HeaderContainer.css-86m7cf.eu4oa1w0 > div > div:nth-child(1) > div.jobsearch-JobInfoHeader-title-container.css-1u3gzh9.eu4oa1w0 > h2 > span" }
  ];
  
  let jobTitleElement = getElementWithFallbacks(jobTitleSelectors);
  let jobTitle = jobTitleElement?.innerText?.trim() || "";
  
  function trimJobTitle(rawJobTitle) {
    const trimmedJobTitle = rawJobTitle.split("\n")[0];
    return trimmedJobTitle;
  }

  // Company/Contact Person selectors (new primary selector + fallbacks)
  let contactSelectors = [
    { type: 'xpath', value: '/html/body/div/div[2]/div[3]/div/div/div[1]/div[2]/div[1]/div[2]/div/div/div/div[1]/div' },
    { type: 'css', value: '#viewJobSSRRoot > div.fastviewjob.jobsearch-ViewJobLayout--standalone.css-81tydb.eu4oa1w0.hydrated > div.css-1yuy2sm.eu4oa1w0 > div > div > div.jobsearch-JobComponent.css-9wkwdm.eu4oa1w0.jobsearch-JobComponent-bottomDivider > div.jobsearch-InfoHeaderContainer.jobsearch-DesktopStickyContainer.css-ituda8.eu4oa1w0 > div:nth-child(1) > div.css-1xky5b5.eu4oa1w0 > div > div > div > div.css-1bhp8th.eu4oa1w0 > div' },
    { type: 'css', value: 'div[data-company-name="true"]' },
    { type: 'css', value: 'div[data-testid="inlineHeader-companyName"]' },
    // Fallback to old selectors
    { type: 'css', value: "#vjs-container > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1s5gqtr.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-17riagq.eu4oa1w0 > div.jobsearch-HeaderContainer.css-n78gek.eu4oa1w0 > div" }
  ];
  
  let contactElement = getElementWithFallbacks(contactSelectors);
  let jobPoster = "";
  
  if (contactElement && contactElement.innerText) {
    // Extract company name from the element
    let contactText = contactElement.innerText.trim();
    // Remove any extra text and get just the company name
    jobPoster = contactText.split('\n')[0].trim();
  }
  
  // If no contact found, try alternative extraction method
  if (!jobPoster) {
    function extractCompany(jobDetails) {
      const trimmedContact = jobDetails.split("\n")[2];
      return trimmedContact;        
    }
    
    let fallbackContactElement = getElementWithFallbacks([
      { type: 'css', value: "#vjs-container > div > div.fastviewjob.jobsearch-ViewJobLayout--embedded.css-1s5gqtr.eu4oa1w0.hydrated > div.jobsearch-JobComponent.css-17riagq.eu4oa1w0 > div.jobsearch-HeaderContainer.css-n78gek.eu4oa1w0 > div" }
    ]);
    
    if (fallbackContactElement && fallbackContactElement.innerText) {
      jobPoster = extractCompany(fallbackContactElement.innerText);
    }
  }

  // Job Details Section selectors (for hours and salary extraction)
  let jobDetailsSelectors = [
    { type: 'css', value: '#jobDetailsSection > div > div.js-match-insights-provider-36vfsm.eu4oa1w0' },
    { type: 'css', value: '#jobDetailsSection' },
    { type: 'css', value: 'div[role="group"][aria-label="Job type"]' },
    { type: 'css', value: '.js-match-insights-provider-36vfsm' }
  ];
  
  let jobDetailsElement = getElementWithFallbacks(jobDetailsSelectors);
  let jobDetailsText = jobDetailsElement?.innerText || "";
  
  // If no job details found, try to find hours info from the section element mentioned in the sample
  if (!jobDetailsText) {
    let hoursSection = document.querySelector('div[role="group"][tabindex="-1"][aria-label="Job type"]');
    if (hoursSection) {
      jobDetailsText = hoursSection.innerText || "";
    }
  }

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

    return result || "TBD";
  }

  function extractPayDetails(jobDetails) {
    const payIndex = jobDetails.indexOf("Pay");
    if (payIndex === -1) {
        return "TBD";
    }
    const payDetails = jobDetails.substring(payIndex + 3).trim();
    const endOfPayDetails = payDetails.indexOf("\n");
    return endOfPayDetails === -1 ? payDetails : payDetails.substring(0, endOfPayDetails).trim();
  }
  
  let hoursPerWeek = extractHoursPerWeek(jobDetailsText);
  let salaryUpTo = extractPayDetails(jobDetailsText);
  
  jobTitle = trimJobTitle(jobTitle);
  let jobLink = window.location.href;
  
  // Log extracted data for debugging
  console.log("Indeed Extracted Data:");
  console.log("Job Title:", jobTitle);
  console.log("Hours:", hoursPerWeek);
  console.log("Salary:", salaryUpTo);
  console.log("Contact:", jobPoster);
  console.log("Link:", jobLink);
  
  return { 
    job_title: jobTitle, 
    hours_per_week: hoursPerWeek, 
    salary_up_to: salaryUpTo, 
    job_poster: jobPoster, 
    job_link: jobLink 
  };
}

  // ##### FROM UPWORK CODE BLOCK - UPDATED WITH NEW SELECTORS ##### //
  function isFromUpwork() {
    // Helper function to evaluate XPath (needs to be redefined in this scope)
    function getElementByXPath(xpath) {
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    // Helper function to try multiple selectors and return first successful result
    function getElementWithFallbacks(selectors) {
      for (let selector of selectors) {
        let element = null;
        if (selector.type === 'xpath') {
          element = getElementByXPath(selector.value);
        } else if (selector.type === 'css') {
          element = document.querySelector(selector.value);
        }
        if (element && element.innerText && element.innerText.trim() !== '') {
          return element;
        }
      }
      return null;
    }

    // Job Title selectors (new primary selector + fallbacks)
    let jobTitleSelectors = [
      { type: 'xpath', value: '/html/body/div[4]/div/div/div/main/div[3]/div[4]/div/div/div[1]/div[1]/section[1]/h4/span' },
      { type: 'css', value: '#main > div.container > div:nth-child(4) > div > div > div.job-details-card.d-flex.gap-0.air3-card.air3-card-outline.p-0 > div:nth-child(1) > section:nth-child(1) > h4 > span' },
      { type: 'css', value: 'span.flex-1[data-v-6dae415b]' },
      { type: 'css', value: '.job-details-card h4 span' },
      { type: 'css', value: 'h4 span.flex-1' }
    ];
    let jobTitleElement = getElementWithFallbacks(jobTitleSelectors);
    let jobTitle = jobTitleElement?.innerText?.trim() || "";

    // Get complete job details container for parsing other information
    let completeJobDetailsSelectors = [
      { type: 'css', value: '#main > div.container > div:nth-child(4) > div > div > div.job-details-card.d-flex.gap-0.air3-card.air3-card-outline.p-0 > div' },
      { type: 'css', value: '.job-details-card > div' },
      { type: 'css', value: '#main .job-details-card > div:first-child' }
    ];
    let completeJobDetailsElement = getElementWithFallbacks(completeJobDetailsSelectors);
    let completeJobDetails = completeJobDetailsElement?.innerText || "";

    // Extract Project Type (Hours per week equivalent)
    function extractProjectType(jobDetails) {
      const lines = jobDetails.split('\n');
      
      for (const line of lines) {
        if (line.includes('Project Type:')) {
          return line.replace('Project Type: ', '').trim();
        }
      }
      
      // Fallback: look for common project type patterns
      const hourlyPattern = /\$\d+\.?\d*\/hr/;
      const fixedPattern = /Fixed-price|One-time project/i;
      
      if (hourlyPattern.test(jobDetails)) {
        return 'Hourly';
      } else if (fixedPattern.test(jobDetails)) {
        return 'Fixed-price';
      }
      
      return 'TBD';
    }

    // Extract Compensation
    function extractCompensation(jobDetails) {
      // Look for price patterns
      const hourlyRate = jobDetails.match(/\$\d+\.?\d*\/hr/);
      const fixedPrice = jobDetails.match(/\$\d+(?:,\d{3})*/);
      const budgetRange = jobDetails.match(/\$\d+(?:,\d{3})*\s*-\s*\$\d+(?:,\d{3})*/);
      
      if (budgetRange) {
        return budgetRange[0];
      } else if (hourlyRate) {
        return hourlyRate[0];
      } else if (fixedPrice) {
        return '$' + fixedPrice[0].replace('$', '');
      }
      
      // Fallback: extract any number that might be compensation
      const numbers = jobDetails.match(/\$[\d,]+(?:\.\d+)?/g);
      if (numbers && numbers.length > 0) {
        return numbers[0];
      }
      
      return 'TBD';
    }

    let hoursPerWeek = extractProjectType(completeJobDetails);
    let salaryUpTo = extractCompensation(completeJobDetails);

    // Extract Job Poster (client information)
    let jobPosterSelectors = [
      { type: 'css', value: '#main > div.container > div:nth-child(4) > div > div > div.job-details-card.d-flex.gap-0.air3-card.air3-card-outline.p-0 > div.sidebar.air3-card-sections > section' },
      { type: 'css', value: '.sidebar.air3-card-sections > section' },
      { type: 'css', value: '.job-details-card .sidebar section' }
    ];
    let jobPosterElement = getElementWithFallbacks(jobPosterSelectors);
    let jobPosterRaw = jobPosterElement?.innerText || "";
    
    // Extract client name from sidebar content
    let jobPoster = "";
    if (jobPosterRaw) {
      const lines = jobPosterRaw.split('\n').filter(line => line.trim() !== '');
      // Look for a line that seems like a client name (usually after "Client" or similar)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('Client') && i + 1 < lines.length) {
          jobPoster = lines[i + 1].trim();
          break;
        }
        // Alternative: look for lines that don't contain common labels
        if (line && 
            !line.includes('$') && 
            !line.includes('Payment verified') && 
            !line.includes('reviews') && 
            !line.includes('Rating') &&
            !line.includes('Location') &&
            line.length > 2 && 
            line.length < 50) {
          jobPoster = line;
          break;
        }
      }
    }
    
    // If still no poster found, try alternative extraction
    if (!jobPoster && jobPosterRaw) {
      const possibleNames = jobPosterRaw.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g);
      if (possibleNames && possibleNames.length > 0) {
        jobPoster = possibleNames[0];
      } else {
        // Fallback: use a cleaned version of the raw text
        const cleanText = jobPosterRaw.replace(/\n+/g, ' ').trim();
        const firstMeaningfulPart = cleanText.split(/\s{2,}/)[0];
        if (firstMeaningfulPart && firstMeaningfulPart.length < 50) {
          jobPoster = firstMeaningfulPart;
        }
      }
    }

    let jobLink = window.location.href;

    // Log extracted data for debugging
    console.log("Upwork Extracted Data:");
    console.log("Job Title:", jobTitle);
    console.log("Hours/Type:", hoursPerWeek);
    console.log("Salary:", salaryUpTo);
    console.log("Poster:", jobPoster);
    console.log("Link:", jobLink);
    
    return { 
      job_title: jobTitle, 
      hours_per_week: hoursPerWeek, 
      salary_up_to: salaryUpTo, 
      job_poster: jobPoster, 
      job_link: jobLink 
    };
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
  window.open("https://docs.google.com/spreadsheets/d/1BCd1tkmh_4Ia8SOq-MlVj1NimTvoomClr7FMOPm0Gzo/edit?gid=0#gid=0", "_blank")
}