import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Allow more time for image processing

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Strip the data:image/jpeg;base64, prefix if it exists
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const systemInstruction = `Anda adalah asisten ekstraksi data keuangan. 
Tugas Anda adalah membaca gambar struk belanja (receipt) dan mengekstrak informasi ke dalam format JSON murni TANPA markdown block.
JSON harus memiliki format tepat seperti ini:
{
  "amount": angka (integer, total belanja/bayar),
  "description": "nama toko atau tempat belanja",
  "category": "Makan" | "Transportasi" | "Belanja" | "Lainnya" | "Kesehatan" | "Hiburan" (pilih yang paling relevan),
  "type": "expense",
  "items": [
    { "name": "nama barang", "qty": angka, "price": angka (total harga untuk barang ini) }
  ]
}
Jika gambar bukan struk atau nominal tidak terbaca sama sekali, kembalikan:
{ "amount": 0, "description": "Gagal membaca struk", "category": "Lainnya", "type": "expense", "items": [] }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg' // we assume jpeg/png, gemini handles it well
          }
        },
        "Ekstrak data dari struk ini menjadi JSON"
      ],
      config: {
        systemInstruction,
        temperature: 0.1, // low temperature for precise extraction
        responseMimeType: "application/json"
      }
    });

    let resultText = response.text || "{}";
    
    // Clean up potential markdown blocks if the model ignored responseMimeType
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Receipt API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
