const jobDataRows = [];

async function scrapeJob() {
  const apikey = document.getElementById("apikey").value;
  const model = document.getElementById("model").value;
  const jobUrl = document.getElementById("url").value;
  const responseContainer = document.getElementById("response");
  const loader = document.getElementById("loading");

  if (!apikey || !jobUrl) {
    alert("Please enter both API key and job URL");
    return;
  }

  responseContainer.innerHTML = '';
  loader.style.display = 'block';
  document.getElementById("downloadBtn").style.display = "none";
  document.getElementById("downloadExcelBtn").style.display = "none";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are an expert job content scraper."
          },
          {
            role: "user",
            content: `Scrape the following Naukri job URL:\n\nURL: ${jobUrl}

Extract the following structured fields in this format:
**1. Job Title**: ...
**2. Company Name**: ...
**3. Location**: ...
**4. Experience Required**: ...
**5. Salary**: ...
**6. Full Job Description**: ...
**7. Key Skills**: ...
**8. Posted Date**: ...
**9. Employment Type**: ...
**10. Education Required**: ...
**11. Company Overview**: ...
**12. Apply Link**: ...
**13. Meta Tags**: ...
**14. mail id**: ...`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from API");
    }

    const resultText = data.choices[0].message.content;
    animateTypingHTML(resultText, responseContainer);

    document.getElementById("downloadBtn").style.display = "inline-block";
    document.getElementById("downloadExcelBtn").style.display = "inline-block";

    // Create structured data row
    const row = {
      CourseId: `COURSE-${jobDataRows.length + 1}`,
      PrimarySkills: extractSkillsMarkdown(resultText),
      Experience: extractFieldMarkdown(resultText, "Experience Required"),
      JobTitle: extractFieldMarkdown(resultText, "Job Title"),
      Company: extractFieldMarkdown(resultText, "Company Name"),
      Location: extractFieldMarkdown(resultText, "Location"),
      NoticePeriod: "Not specified",
      SalaryRange: extractFieldMarkdown(resultText, "Salary"),
      JobDescription: extractFieldMarkdown(resultText, "Full Job Description"),
      AdditionalSkills: extractSkillsMarkdown(resultText),
      ContactNumber: "",
      Email: "",
      JobPostDate: extractFieldMarkdown(resultText, "Posted Date"),
      WorkType: extractFieldMarkdown(resultText, "Employment Type"),
      JobLink: jobUrl
    };

    jobDataRows.push(row);
    console.log("Job data added:", row);

  } catch (err) {
    console.error("Error scraping job:", err);
    responseContainer.innerHTML = `<div style="color: red; font-weight: bold;">❌ Error: ${err.message}</div>`;
  } finally {
    loader.style.display = 'none';
  }
}

// ✅ Extract multiline fields using Markdown-style headings
function extractFieldMarkdown(text, label) {
  // Try multiple patterns to match the field
  const patterns = [
    `\\*\\*\\d+\\.\\s*${label}\\*\\*:\\s*([\\s\\S]*?)(?=\\*\\*\\d+\\.|\\*\\*[A-Z]|$)`,
    `\\*\\*${label}\\*\\*:\\s*([\\s\\S]*?)(?=\\*\\*|$)`,
    `${label}:\\s*([\\s\\S]*?)(?=\\n\\n|\\*\\*|$)`
  ];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "i");
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim().replace(/\n+/g, " ").replace(/\s+/g, " ");
    }
  }
  
  return "Not specified";
}

function extractSkillsMarkdown(text) {
  const raw = extractFieldMarkdown(text, "Key Skills");
  if (raw === "Not specified") return raw;
  
  return raw
    .split(/\n|,|•|-|;/)
    .map(s => s.trim())
    .filter(s => s && s.length > 1)
    .join(", ");
}

// ✅ Typing animation
function animateTypingHTML(text, element) {
  let i = 0;
  let temp = "";
  element.innerHTML = "";
  
  function type() {
    if (i < text.length) {
      temp += text.charAt(i);
      element.innerHTML = temp;
      i++;
      setTimeout(type, 2); // Faster typing
    }
  }
  type();
}

// ✅ Download visible response as .txt
function downloadResult() {
  const text = document.getElementById("response").innerText;
  if (!text || text.trim() === '') {
    alert('No data to download. Please scrape a job first.');
    return;
  }
  
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.download = "job-details.txt";
  link.href = URL.createObjectURL(blob);
  link.click();
}

// ✅ Download as Excel with proper formatting
function downloadExcel() {
  // Check if XLSX library is loaded
  if (typeof XLSX === 'undefined') {
    alert('XLSX library is not loaded. Please include this script in your HTML:\n<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>');
    return;
  }

  if (jobDataRows.length === 0) {
    alert('No job data to export. Please scrape a job first.');
    return;
  }

  try {
    // Define headers in the exact order
    const headers = [
      "CourseId", "PrimarySkills", "Experience", "JobTitle", "Company",
      "Location", "NoticePeriod", "SalaryRange", "JobDescription",
      "AdditionalSkills", "ContactNumber", "Email", "JobPostDate",
      "WorkType", "JobLink"
    ];

    // Convert job data to array format
    const dataRows = jobDataRows.map((row, index) => {
      return [
        row.CourseId || `COURSE-${index + 1}`,
        row.PrimarySkills || "Not specified",
        row.Experience || "Not specified",
        row.JobTitle || "Not specified",
        row.Company || "Not specified",
        row.Location || "Not specified",
        row.NoticePeriod || "Not specified",
        row.SalaryRange || "Not specified",
        row.JobDescription || "Not specified",
        row.AdditionalSkills || "Not specified",
        row.ContactNumber || "",
        row.Email || "",
        row.JobPostDate || "Not specified",
        row.WorkType || "Not specified",
        row.JobLink || ""
      ];
    });

    // Combine headers and data
    const worksheetData = [headers, ...dataRows];
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better formatting
    const columnWidths = [
      { wch: 15 }, // CourseId
      { wch: 30 }, // PrimarySkills
      { wch: 15 }, // Experience
      { wch: 30 }, // JobTitle
      { wch: 20 }, // Company
      { wch: 20 }, // Location
      { wch: 15 }, // NoticePeriod
      { wch: 20 }, // SalaryRange
      { wch: 50 }, // JobDescription
      { wch: 30 }, // AdditionalSkills
      { wch: 15 }, // ContactNumber
      { wch: 25 }, // Email
      { wch: 15 }, // JobPostDate
      { wch: 15 }, // WorkType
      { wch: 40 }  // JobLink
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Style the header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scraped Jobs");
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `Job_Scrape_${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(workbook, filename);
    
    console.log(`Excel file '${filename}' downloaded successfully with ${jobDataRows.length} job(s)`);
    alert(`Excel file downloaded successfully!\nFile: ${filename}\nJobs exported: ${jobDataRows.length}`);
    
  } catch (error) {
    console.error('Error creating Excel file:', error);
    alert(`Error creating Excel file: ${error.message}\n\nTrying alternative CSV download...`);
    downloadCSV(); // Fallback to CSV
  }
}

// ✅ Alternative CSV download function (fallback)
function downloadCSV() {
  if (jobDataRows.length === 0) {
    alert('No job data to export. Please scrape a job first.');
    return;
  }

  try {
    const headers = [
      "CourseId", "PrimarySkills", "Experience", "JobTitle", "Company",
      "Location", "NoticePeriod", "SalaryRange", "JobDescription",
      "AdditionalSkills", "ContactNumber", "Email", "JobPostDate",
      "WorkType", "JobLink"
    ];

    // Helper function to escape CSV fields
    function escapeCSV(field) {
      if (field == null) return '""';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    const csvRows = [
      headers.join(','),
      ...jobDataRows.map((row, index) => [
        escapeCSV(row.CourseId || `COURSE-${index + 1}`),
        escapeCSV(row.PrimarySkills || "Not specified"),
        escapeCSV(row.Experience || "Not specified"),
        escapeCSV(row.JobTitle || "Not specified"),
        escapeCSV(row.Company || "Not specified"),
        escapeCSV(row.Location || "Not specified"),
        escapeCSV(row.NoticePeriod || "Not specified"),
        escapeCSV(row.SalaryRange || "Not specified"),
        escapeCSV(row.JobDescription || "Not specified"),
        escapeCSV(row.AdditionalSkills || "Not specified"),
        escapeCSV(row.ContactNumber || ""),
        escapeCSV(row.Email || ""),
        escapeCSV(row.JobPostDate || "Not specified"),
        escapeCSV(row.WorkType || "Not specified"),
        escapeCSV(row.JobLink || "")
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    link.download = `Job_Scrape_${timestamp}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    console.log('CSV file downloaded successfully');
    
  } catch (error) {
    console.error('Error creating CSV file:', error);
    alert('Error creating CSV file: ' + error.message);
  }
}

// ✅ Clear all scraped data
function clearData() {
  jobDataRows.length = 0;
  document.getElementById("response").innerHTML = '';
  document.getElementById("downloadBtn").style.display = "none";
  document.getElementById("downloadExcelBtn").style.display = "none";
  console.log('All data cleared');
}

// ✅ Show scraped jobs count
function showJobsCount() {
  alert(`Total jobs scraped: ${jobDataRows.length}`);
}