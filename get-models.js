const https = require('https');
const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log("AVAILABLE FLASH MODELS:");
        json.models.forEach(m => {
          if (m.name.includes('flash')) {
            console.log(m.name);
          }
        });
      } else {
        console.log("NO MODELS:", json);
      }
    } catch(e) {
      console.log("ERR", e);
    }
  });
});
