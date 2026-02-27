const apiKey = "AIzaSyBsaiClqVyNUWbB8JwuF4hqQadz2QD5Cjk";
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
        if (data.models) {
            console.log("Available models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("Response:", data);
        }
    })
    .catch(console.error);
