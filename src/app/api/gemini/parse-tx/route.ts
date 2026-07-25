import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { text, categories } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Prepare the list of categories for the prompt
    const categoryList = categories.map((c: any) => `- ${c.name} (${c.type})`).join('\n');

    const systemInstruction = `Anda adalah sistem pengurai (parser) transaksi keuangan cerdas. 
Tugas Anda adalah mengekstrak informasi transaksi dari teks yang diberikan oleh pengguna dan merespon HANYA dalam format JSON ARRAY. Jika pengguna memasukkan lebih dari satu transaksi (misal: "Beli cilok 2rb, parkir 2rb"), Anda HARUS memecahnya menjadi beberapa object dalam array tersebut.

Aturan Klasifikasi Kategori:
Anda HANYA boleh memilih Kategori dari daftar berikut yang dimiliki pengguna:
${categoryList}

Jika teks tidak cocok dengan kategori apapun di atas, pilih kategori yang paling relevan secara semantik, tetapi namanya HARUS persis sama dengan salah satu nama di daftar atas (misal jika ada "Makan", pilih "Makan").

Penting: 
- amount: harus berupa angka murni (number), jangan string. Jika tidak ada nominal, isi dengan 0.
- type: harus berupa 'expense' atau 'income' atau 'transfer'.
- description: deskripsi singkat barang/layanan. Awali dengan huruf kapital.
- tags: array of string, berisi tag-tag relevan.
- category: NAMA kategori dari daftar di atas. Jika tidak ada yang cocok sama sekali, gunakan "Lainnya".

Khusus untuk transaksi HUTANG / PIUTANG:
- Jika teks bermaksud MEMBUAT HUTANG BARU ("Saya meminjamkan uang ke Budi", "Budi ngutang ke saya"):
  isDebt = true, debtType = "give", personName = "Budi", type = "expense", isDebtPayment = false.
- Jika teks bermaksud MEMBUAT HUTANG BARU ("Saya ngutang ke Budi", "Pinjam uang dari Budi"):
  isDebt = true, debtType = "take", personName = "Budi", type = "income", isDebtPayment = false.
- Jika teks bermaksud MEMBAYAR/NYICIL HUTANG ("Saya bayar hutang ke Budi", "Budi bayar hutangnya"):
  isDebt = false, isDebtPayment = true, personName = "Budi", type = "expense" (jika saya bayar) atau "income" (jika budi bayar).
- Jika bukan transaksi hutang/piutang sama sekali, isDebt = false, isDebtPayment = false.

Format Output JSON yang diharapkan (HANYA JSON ARRAY murni tanpa \`\`\`json):
[
  {
    "description": "string",
    "amount": 0,
    "type": "expense",
    "category": "string",
    "tags": [],
    "isDebt": false,
    "isDebtPayment": false,
    "debtType": null,
    "personName": null
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    let reply = response.text || "";
    reply = reply.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsedJSON = JSON.parse(reply);
      return NextResponse.json({ result: parsedJSON });
    } catch (e) {
       console.error("Gemini failed to return valid JSON", reply);
       return NextResponse.json({ error: "Failed to parse JSON" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
