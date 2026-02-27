const apiKey = "AIzaSyBsaiClqVyNUWbB8JwuF4hqQadz2QD5Cjk";
const mimeType = "image/png";
const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        contents: [{
            parts: [
                { text: `Return {"amount": 10, "company": "test"}` },
                { inlineData: { mimeType, data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 150,
            responseMimeType: "application/json"
        }
    })
})
    .then(res => Promise.all([res.status, res.json()]))
    .then(console.log)
    .catch(console.error);
