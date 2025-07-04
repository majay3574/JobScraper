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

<b>URL</b>: ${jobUrl}

Return the result using <b>HTML bold tags</b> for each heading. Example:

<b>1. Job Title:</b> Some title  
<b>2. Company Name:</b> Some company  
...

<b>Extract these fields:</b>
1. Job Title  
2. Company Name  
3. Location  
4. Experience Required  
5. Salary (if available)  
6. Full Job Description  
7. Key Skills  
8. Posted Date / Freshness  
9. Employment Type  
10. Education Required  
11. Company Overview  
12. Apply Link  
13. Meta Tags (Page Title, Canonical URL, etc.)

<b>Instructions:</b>
- Format section titles using <b> tags
- Use <br> for line breaks between sections
- Preserve line breaks and bullets in descriptions
- If data not available, say "Not specified"
- Return response in raw HTML for rendering
`,
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: 3000,
                }),
            }
        );

        const data = await response.json();
        const resultText = data.choices[0].message.content;
        animateTypingHTML(resultText, responseContainer);
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
function animateTypingHTML(text, element) {
    let i = 0;
    let temp = "";
    element.innerHTML = ""; // Clear existing content

    const speed = 8;

    function type() {
        if (i < text.length) {
            temp += text.charAt(i);
            element.innerHTML = temp; // This renders HTML tags properly
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}
