const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModels() {
  const models = ['gemini-flash-latest'];
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
