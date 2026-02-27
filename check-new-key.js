const apiKey = "AIzaSyBsaiClqVyNUWbB8JwuF4hqQadz2QD5Cjk";
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        contents: [{
            parts: [
                { text: "Extract numbers: 120" }
            ]
        }]
    })
}).then(res => res.json()).then(console.log).catch(console.error);
