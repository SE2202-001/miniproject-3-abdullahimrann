class Job {
  constructor(jobData) {
    this.jobNo = jobData["Job No"];
    this.title = jobData["Title"];
    this.jobPageLink = jobData["Job Page Link"];
    this.postedTime = jobData["Posted"];
    this.type = jobData["Type"];
    this.level = jobData["Level"];
    this.estimatedTime = jobData["Estimated Time"];
    this.skill = jobData["Skill"];
    this.detail = jobData["Detail"];
  }

  // Formats the posted time into a user-friendly string
  getFormattedPostedTime() {
    const parts = this.postedTime.split(" ");
    const value = parseInt(parts[0], 10);
    const unit = parts[1].toLowerCase();

    if (unit.includes("minute")) return `${value} minute(s) ago`;
    if (unit.includes("hour")) return `${value} hour(s) ago`;
    if (unit.includes("day")) return `${value} day(s) ago`;
    if (unit.includes("week")) return `${value} week(s) ago`;
    if (unit.includes("month")) return `${value} month(s) ago`;

    return "Unknown time";
  }

  getDetails() {
    return `
      <h3>${this.title}</h3>
      <p><strong>Type:</strong> ${this.type}</p>
      <p><strong>Level:</strong> ${this.level}</p>
      <p><strong>Skill:</strong> ${this.skill}</p>
      <p><strong>Estimated Time:</strong> ${this.estimatedTime}</p>
      <p><strong>Details:</strong> ${this.detail}</p>
      <p><strong>Posted:</strong> ${this.getFormattedPostedTime()}</p>
      <p><a href="${this.jobPageLink}" target="_blank">View Job Page</a></p>
    `;
  }
}

let jobs = [];

// File input handling
document.getElementById("fileInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const fileNameDisplay = document.getElementById("fileName");

  if (file) {
    fileNameDisplay.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!Array.isArray(data)) {
          throw new Error("JSON file does not contain an array of jobs");
        }

        jobs = data
          .map((jobData, index) => {
            if (!jobData["Title"] || !jobData["Posted"]) {
              console.warn(`Job at index ${index} is missing required fields. Skipping.`);
              return null;
            }
            return new Job(jobData);
          })
          .filter((job) => job !== null);

        if (jobs.length === 0) {
          throw new Error("No valid job entries found in the JSON file.");
        }

        populateFilters();
        renderJobs(jobs);
      } catch (err) {
        alert(`Error processing file: ${err.message}`);
        console.error(err);
        jobs = [];
        renderJobs(jobs);
      }
    };
    reader.readAsText(file);
  } else {
    fileNameDisplay.textContent = "No file chosen";
  }
});

// Populate filters
function populateFilters() {
  const levels = new Set(jobs.map((job) => job.level));
  const types = new Set(jobs.map((job) => job.type));
  const skills = new Set(jobs.map((job) => job.skill));

  populateDropdown("levelFilter", levels);
  populateDropdown("typeFilter", types);
  populateDropdown("skillFilter", skills);
}

function populateDropdown(id, options) {
  const dropdown = document.getElementById(id);
  dropdown.innerHTML = `<option value="all">All</option>`;
  options.forEach((option) => {
    dropdown.innerHTML += `<option value="${option}">${option}</option>`;
  });
}

// Render jobs
function renderJobs(filteredJobs) {
  const jobList = document.getElementById("jobList");
  jobList.innerHTML = "";

  if (filteredJobs.length === 0) {
    const noJobsMessage = document.createElement("div");
    noJobsMessage.className = "no-jobs-message";
    noJobsMessage.textContent = "No jobs available.";
    jobList.appendChild(noJobsMessage);
    return;
  }

  filteredJobs.forEach((job) => {
    const div = document.createElement("div");
    div.className = "job-item";
    div.textContent = `${job.title} (${job.getFormattedPostedTime()})`;

    div.addEventListener("mouseover", () => {
      div.style.backgroundColor = "#48bb78";
      div.style.color = "#ffffff";
    });

    div.addEventListener("mouseout", () => {
      div.style.backgroundColor = "#68d391";
      div.style.color = "#ffffff";
    });

    div.addEventListener("click", () => showDetails(job));
    jobList.appendChild(div);
  });
}

// Apply filters and sorting
document.getElementById("filterSortBtn").addEventListener("click", () => {
  let filteredJobs = jobs;

  const level = document.getElementById("levelFilter").value;
  const type = document.getElementById("typeFilter").value;
  const skill = document.getElementById("skillFilter").value;

  if (level !== "all") {
    filteredJobs = filteredJobs.filter((job) => job.level === level);
  }
  if (type !== "all") {
    filteredJobs = filteredJobs.filter((job) => job.type === type);
  }
  if (skill !== "all") {
    filteredJobs = filteredJobs.filter((job) => job.skill === skill);
  }

  const sortOption = document.getElementById("sortOptions").value;

  if (sortOption === "title-asc") {
    filteredJobs.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortOption === "title-desc") {
    filteredJobs.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortOption === "posted-new") {
    filteredJobs.sort(
      (a, b) => convertPostedToMinutes(a.postedTime) - convertPostedToMinutes(b.postedTime)
    );
  } else if (sortOption === "posted-old") {
    filteredJobs.sort(
      (a, b) => convertPostedToMinutes(b.postedTime) - convertPostedToMinutes(a.postedTime)
    );
  }

  renderJobs(filteredJobs);
});

// Reset filters
document.getElementById("resetFiltersBtn").addEventListener("click", () => {
  document.getElementById("levelFilter").value = "all";
  document.getElementById("typeFilter").value = "all";
  document.getElementById("skillFilter").value = "all";
  document.getElementById("sortOptions").value = "posted-new";
  renderJobs(jobs);
});

// Convert posted time to minutes
function convertPostedToMinutes(posted) {
  const parts = posted.split(" ");
  const value = parseInt(parts[0], 10);
  const unit = parts[1].toLowerCase();

  if (unit.includes("minute")) return value;
  if (unit.includes("hour")) return value * 60;
  if (unit.includes("day")) return value * 60 * 24;
  if (unit.includes("week")) return value * 60 * 24 * 7;
  if (unit.includes("month")) return value * 60 * 24 * 30;

  return Infinity;
}

// Show job details
function showDetails(job) {
  const existingPopup = document.querySelector(".details-popup");
  const existingOverlay = document.querySelector(".overlay");
  if (existingPopup) document.body.removeChild(existingPopup);
  if (existingOverlay) document.body.removeChild(existingOverlay);

  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const popup = document.createElement("div");
  popup.className = "details-popup";
  popup.innerHTML = job.getDetails();
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
    document.body.removeChild(popup);
  });

  popup.appendChild(closeButton);
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
}
