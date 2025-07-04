window.onload = () => {
    const storedKey = localStorage.getItem("groq_apikey");
    const storedModel = localStorage.getItem("groq_model");
    const storedURL = localStorage.getItem("groq_joburl");

    if (storedKey) document.getElementById("apikey").value = storedKey;
    if (storedModel) document.getElementById("model").value = storedModel;
    if (storedURL) document.getElementById("url").value = storedURL;

    document.getElementById("apikey").addEventListener("blur", () => {
        localStorage.setItem("groq_apikey", document.getElementById("apikey").value);
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

    responseContainer.textContent = '';
    loader.style.display = 'block';
    downloadBtn.style.display = 'none';

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
                        content: "You are an expert job content scraper. Extract and structure job details from Naukri.com job listings into clean, organized data."
                    },
                    {
                        role: "user",
                        content: `Scrape the following Naukri job URL:\n\nURL: ${jobUrl}
            \n\nExtract structured fields like:\n1. Job Title\n2. Company Name\n3. 
            Location\n4. Experience Required\n5. Salary (if available)\n6.
             Full Job Description\n7. Key Skills\n8. Posted Date / Freshness\n9. 
             Employment Type\n10. Education Required\n11. Company Overview\n12.
              Apply Link\n13. Meta Tags`
                    }
                ],
                temperature: 0.3,
                max_tokens: 3000
            })
        });

        const data = await response.json();
        const resultText = data.choices[0].message.content;
        animateTyping(resultText, responseContainer);
        downloadBtn.style.display = 'inline-block';
    } catch (err) {
        responseContainer.textContent = '❌ Error: ' + err.message;
    } finally {
        loader.style.display = 'none';
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
