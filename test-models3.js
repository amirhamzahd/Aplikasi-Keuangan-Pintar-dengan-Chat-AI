const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModels() {
  const models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite-preview-02-05'];
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
testModels();
