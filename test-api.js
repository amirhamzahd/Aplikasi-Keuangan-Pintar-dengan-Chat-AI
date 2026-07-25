const https = require('https');

async function testApi() {
  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const body = JSON.stringify({ imageBase64: base64 });
  
  const options = {
    hostname: 'project-4vdfh-gpdop0hku-hamzah999.vercel.app',
    port: 443,
    path: '/api/gemini/receipt',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('RESPONSE:', res.statusCode, data));
  });

  req.on('error', (e) => console.error(e));
  req.write(body);
  req.end();
}
testApi();
