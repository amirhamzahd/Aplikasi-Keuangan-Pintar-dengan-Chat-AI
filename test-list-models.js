const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const response = await ai.models.list();
    for (const model of response.models) {
      if (model.name.includes('flash')) {
        console.log(model.name);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
listModels();
