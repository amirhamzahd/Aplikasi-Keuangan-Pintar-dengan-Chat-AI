import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `Anda adalah DIAMOND, asisten kecerdasan buatan spesialis keuangan pribadi yang cerdas, ramah, dan solutif.
Tugas Anda adalah membantu pengguna memahami keuangan mereka, memberikan saran penghematan, menganalisis pengeluaran, dan menjawab pertanyaan edukasi finansial.
Selalu gunakan bahasa Indonesia yang santai namun profesional (gunakan sapaan "Anda").
SANGAT PENTING: Tuliskan jawaban HANYA dalam teks biasa murni tanpa karakter markdown apa pun. DILARANG KERAS menggunakan tanda bintang (* atau **) untuk bold, italic, atau list. Gunakan angka (1. 2. 3.) atau tanda hubung (-) biasa jika ingin membuat daftar (list).

Di bawah ini adalah data keuangan riil milik pengguna saat ini (gunakan data ini sebagai dasar jawaban Anda jika pengguna bertanya tentang uang mereka):
Data Konteks Keuangan:
${JSON.stringify(context, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return NextResponse.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
