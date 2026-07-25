const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testAll() {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite'
  ];
  for (const m of models) {
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: "Test"
      });
      console.log(`[${m}] SUCCESS:`, res.text);
    } catch(e) {
      console.error(`[${m}] ERROR:`, e.message);
    }
  }
}
testAll();
