const { GoogleGenAI } = require('@google/genai');

const origFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log("REQUEST BODY:", options.body);
  return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
};

const ai = new GoogleGenAI({ apiKey: "fake-key" });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          inlineData: {
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            mimeType: 'image/png'
          }
        },
        "Test string"
      ]
    });
  } catch (e) {
    console.error("ERROR IMAGE:", e.message);
  }
}
test();
