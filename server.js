window.onload = () => {
  const storedKey = localStorage.getItem("groq_apikey");
  const storedModel = localStorage.getItem("groq_model");
  const storedURL = localStorage.getItem("groq_joburl");

  if (storedKey) document.getElementById("apikey").value = storedKey;
  if (storedModel) document.getElementById("model").value = storedModel;
  if (storedURL) document.getElementById("url").value = storedURL;

  document.getElementById("apikey").addEventListener("blur", () => {
    localStorage.setItem(
      "groq_apikey",
      document.getElementById("apikey").value
    );
  });

  document.getElementById("model").addEventListener("change", () => {
    localStorage.setItem("groq_model", document.getElementById("model").value);
  });

  document.getElementById("url").addEventListener("blur", () => {
    localStorage.setItem("groq_joburl", document.getElementById("url").value);
  });
};

async function scrapeJob() {
  const apikey = document.getElementById("apikey").value;
  const model = document.getElementById("model").value;
  const jobUrl = document.getElementById("url").value;
  const responseContainer = document.getElementById("response");
  const loader = document.getElementById("loading");
  const downloadBtn = document.getElementById("downloadBtn");

  if (!apikey || !jobUrl) {
    alert("Please enter both API key and job URL");
    return;
  }

  responseContainer.textContent = "";
  loader.style.display = "block";
  downloadBtn.style.display = "none";

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apikey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content:
                "You are an expert job content scraper. Extract and structure job details from Naukri.com job listings into clean, organized data.",
            },
            {
              role: "user",
              content: `Scrape the following Naukri job URL:

**URL**: ${jobUrl}

Extract the following **structured fields**:

**1. Job Title**  
**2. Company Name**  
**3. Location**  
**4. Experience Required**  
**5. Salary** (if available)  
**6. Full Job Description**  
**7. Key Skills**  
**8. Posted Date / Freshness**  
**9. Employment Type**  
**10. Education Required**  
**11. Company Overview**  
**12. Apply Link**  
**13. Meta Tags (Page Title, Canonical URL, etc.)**

**Instructions:**
- Make sure each section heading is in **bold letters**
- Preserve all formatting such as bullet points and line breaks in the job description
- Present the output in a human-readable, organized format
- If any field is missing, mention “Not specified”
- Ensure spacing between fields for clarity

Output should be **easy to read**, **well-structured**, and suitable for downloading as plain text.`,
            },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      }
    );

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    animateTyping(resultText, responseContainer);
    downloadBtn.style.display = "inline-block";
  } catch (err) {
    responseContainer.textContent = "❌ Error: " + err.message;
  } finally {
    loader.style.display = "none";
  }
}

function downloadResult() {
  const text = document.getElementById("response").textContent;
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.download = "job-details.txt";
  link.href = URL.createObjectURL(blob);
  link.click();
}

// Typing effect
function animateTyping(text, element) {
  let i = 0;
  element.textContent = "";
  const speed = 8;
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}
