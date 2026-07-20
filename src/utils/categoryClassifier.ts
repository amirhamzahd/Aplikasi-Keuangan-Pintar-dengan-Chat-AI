// Custom TF-IDF & KNN Cosine Similarity classifier for Indonesian financial descriptions
// Runs client-side & server-side with zero dependencies, fast and offline-ready.

export interface TrainingDoc {
  text: string;
  category: string;
}

// 1. Dataset Latih untuk Klasifikasi Kategori Finansial Khas Indonesia
const TRAINING_DATA: TrainingDoc[] = [
  // === MAKANAN & MINUMAN ===
  { text: "beli air", category: "Makanan & Minuman" },
  { text: "beli air galon", category: "Makanan & Minuman" },
  { text: "air minum aqua", category: "Makanan & Minuman" },
  { text: "air mineral le minerale", category: "Makanan & Minuman" },
  { text: "beli vit botol", category: "Makanan & Minuman" },
  { text: "air ades", category: "Makanan & Minuman" },
  { text: "air cleo dingin", category: "Makanan & Minuman" },
  { text: "club air mineral", category: "Makanan & Minuman" },
  { text: "makan siang", category: "Makanan & Minuman" },
  { text: "makan malam", category: "Makanan & Minuman" },
  { text: "sarapan pagi bubur", category: "Makanan & Minuman" },
  { text: "beli nasi goreng", category: "Makanan & Minuman" },
  { text: "makan soto ayam", category: "Makanan & Minuman" },
  { text: "bakso urat", category: "Makanan & Minuman" },
  { text: "mie ayam pangsit", category: "Makanan & Minuman" },
  { text: "indomie rebus telor", category: "Makanan & Minuman" },
  { text: "sate kambing", category: "Makanan & Minuman" },
  { text: "nasi padang lauk rendang", category: "Makanan & Minuman" },
  { text: "warteg pak budi", category: "Makanan & Minuman" },
  { text: "kopi susu", category: "Makanan & Minuman" },
  { text: "es kopi gula aren", category: "Makanan & Minuman" },
  { text: "starbucks coffee", category: "Makanan & Minuman" },
  { text: "beli boba cup", category: "Makanan & Minuman" },
  { text: "thai tea mixue", category: "Makanan & Minuman" },
  { text: "es teh manis", category: "Makanan & Minuman" },
  { text: "suku ultra milk", category: "Makanan & Minuman" }, // typo proof
  { text: "susu ultra milk", category: "Makanan & Minuman" },
  { text: "jus alpukat", category: "Makanan & Minuman" },
  { text: "jajan cilok", category: "Makanan & Minuman" },
  { text: "cireng bumbu rujak", category: "Makanan & Minuman" },
  { text: "martabak manis cokelat", category: "Makanan & Minuman" },
  { text: "seblak pedas", category: "Makanan & Minuman" },
  { text: "risoles mayo", category: "Makanan & Minuman" },
  { text: "roti tawar sari roti", category: "Makanan & Minuman" },
  { text: "donat jco", category: "Makanan & Minuman" },
  { text: "gorengan tempe tahu", category: "Makanan & Minuman" },
  { text: "mcd burger", category: "Makanan & Minuman" },
  { text: "kfc ayam goreng", category: "Makanan & Minuman" },
  { text: "pizza hut", category: "Makanan & Minuman" },
  { text: "beras premium karung", category: "Makanan & Minuman" },
  { text: "minyak goreng bimoli", category: "Makanan & Minuman" },
  { text: "telur ayam kiloan", category: "Makanan & Minuman" },
  { text: "belanja sayuran segar", category: "Makanan & Minuman" },
  { text: "buah mangga semangka", category: "Makanan & Minuman" },
  { text: "daging sapi rendang", category: "Makanan & Minuman" },

  // === TRANSPORTASI ===
  { text: "bensin motor", category: "Transportasi" },
  { text: "isi pertalite", category: "Transportasi" },
  { text: "isi pertamax", category: "Transportasi" },
  { text: "solar dex", category: "Transportasi" },
  { text: "pertamina spbu", category: "Transportasi" },
  { text: "bensin shell v-power", category: "Transportasi" },
  { text: "ojek online gojek", category: "Transportasi" },
  { text: "grab ride motor", category: "Transportasi" },
  { text: "maxim ojek", category: "Transportasi" },
  { text: "indrive ride", category: "Transportasi" },
  { text: "go-car taksi", category: "Transportasi" },
  { text: "grabcar bandara", category: "Transportasi" },
  { text: "taksi bluebird", category: "Transportasi" },
  { text: "bayar tol cipularang", category: "Transportasi" },
  { text: "isi saldo e-toll", category: "Transportasi" },
  { text: "ongkos parkir motor", category: "Transportasi" },
  { text: "parkir mall", category: "Transportasi" },
  { text: "tiket krl commuterline", category: "Transportasi" },
  { text: "mrt jakarta dukuh atas", category: "Transportasi" },
  { text: "lrt jabodebek", category: "Transportasi" },
  { text: "tiket busway transjakarta", category: "Transportasi" },
  { text: "bus malam po haryanto", category: "Transportasi" },
  { text: "tiket kereta api kai", category: "Transportasi" },
  { text: "tiket pesawat garuda", category: "Transportasi" },
  { text: "penerbangan lion air", category: "Transportasi" },
  { text: "travel jakarta bandung", category: "Transportasi" },
  { text: "servis motor berkala", category: "Transportasi" },
  { text: "ganti oli mesin mpx2", category: "Transportasi" },
  { text: "cuci motor bersih", category: "Transportasi" },
  { text: "cuci mobil hidrolik", category: "Transportasi" },
  { text: "tambal ban bocor", category: "Transportasi" },
  { text: "beli helm cargloss", category: "Transportasi" },

  // === BELANJA ===
  { text: "beli baju kaos", category: "Belanja" },
  { text: "celana jeans levi's", category: "Belanja" },
  { text: "kemeja batik kerja", category: "Belanja" },
  { text: "jaket hoodie uniqlo", category: "Belanja" },
  { text: "rok panjang wanita", category: "Belanja" },
  { text: "sepatu sneaker compass", category: "Belanja" },
  { text: "sandal jepit swallow", category: "Belanja" },
  { text: "tas ransel eiger", category: "Belanja" },
  { text: "belanja bulanan keluarga", category: "Belanja" },
  { text: "belanja mingguan sayur", category: "Belanja" },
  { text: "ke supermarket", category: "Belanja" },
  { text: "ke pasar tradisional", category: "Belanja" },
  { text: "belanja alfamart", category: "Belanja" },
  { text: "beli barang indomaret", category: "Belanja" },
  { text: "alfamidi minimarket", category: "Belanja" },
  { text: "superindo belanja daging", category: "Belanja" },
  { text: "hypermart promo", category: "Belanja" },
  { text: "transmart carrefour", category: "Belanja" },
  { text: "checkout shopee paylater", category: "Belanja" },
  { text: "tokopedia beli barang", category: "Belanja" },
  { text: "lazada shopping", category: "Belanja" },
  { text: "tiktok shop online", category: "Belanja" },
  { text: "skincare wardah", category: "Belanja" },
  { text: "kosmetik makeup", category: "Belanja" },
  { text: "parfum wangi pria", category: "Belanja" },
  { text: "lipstik wardah", category: "Belanja" },
  { text: "facial wash senka", category: "Belanja" },
  { text: "sabun mandi dettol", category: "Belanja" },
  { text: "shampoo sunsilk", category: "Belanja" },
  { text: "pasta gigi odol pepsodent", category: "Belanja" },
  { text: "deterjen cair rinso", category: "Belanja" },
  { text: "beli laptop asus", category: "Belanja" },
  { text: "smartphone samsung", category: "Belanja" },
  { text: "iphone baru", category: "Belanja" },
  { text: "charger hp type c", category: "Belanja" },
  { text: "headset bluetooth", category: "Belanja" },

  // === TAGIHAN & UTILITAS ===
  { text: "bayar listrik bulanan", category: "Tagihan & Utilitas" },
  { text: "token listrik pln", category: "Tagihan & Utilitas" },
  { text: "tagihan pln pascabayar", category: "Tagihan & Utilitas" },
  { text: "air pdam bersih", category: "Tagihan & Utilitas" },
  { text: "tagihan air pdam", category: "Tagihan & Utilitas" },
  { text: "tagihan internet wifi", category: "Tagihan & Utilitas" },
  { text: "indihome bulanan", category: "Tagihan & Utilitas" },
  { text: "biznet home internet", category: "Tagihan & Utilitas" },
  { text: "first media cable tv", category: "Tagihan & Utilitas" },
  { text: "myrepublic wifi", category: "Tagihan & Utilitas" },
  { text: "beli pulsa telkomsel", category: "Tagihan & Utilitas" },
  { text: "paket data kuota xl", category: "Tagihan & Utilitas" },
  { text: "kuota internet indosat", category: "Tagihan & Utilitas" },
  { text: "kartu tri 3 kuota", category: "Tagihan & Utilitas" },
  { text: "smartfren unlimited", category: "Tagihan & Utilitas" },
  { text: "iuran bpjs kesehatan", category: "Tagihan & Utilitas" },
  { text: "premi asuransi prudential", category: "Tagihan & Utilitas" },
  { text: "pajak motor samsat", category: "Tagihan & Utilitas" },
  { text: "pajak bumi dan bangunan pbb", category: "Tagihan & Utilitas" },
  { text: "sewa kontrakan rumah", category: "Tagihan & Utilitas" },
  { text: "bayar kosan bulanan", category: "Tagihan & Utilitas" },
  { text: "sewa apartemen bulanan", category: "Tagihan & Utilitas" },
  { text: "cicilan motor adira", category: "Tagihan & Utilitas" },
  { text: "tagihan kartu kredit", category: "Tagihan & Utilitas" },

  // === HIBURAN ===
  { text: "nonton bioskop xxi", category: "Hiburan" },
  { text: "tiket bioskop cgv", category: "Hiburan" },
  { text: "spotify premium bulanan", category: "Hiburan" },
  { text: "netflix subscription", category: "Hiburan" },
  { text: "disney plus hotstar", category: "Hiburan" },
  { text: "youtube premium", category: "Hiburan" },
  { text: "top up steam wallet", category: "Hiburan" },
  { text: "top up mobile legends ml", category: "Hiburan" },
  { text: "beli diamond ml", category: "Hiburan" },
  { text: "koin game playstation", category: "Hiburan" },
  { text: "nongkrong di cafe kopi", category: "Hiburan" },
  { text: "hangout cafe bareng teman", category: "Hiburan" },
  { text: "liburan ke bali tiket", category: "Hiburan" },
  { text: "staycation hotel traveloka", category: "Hiburan" },
  { text: "tiket masuk dufan", category: "Hiburan" },
  { text: "camping di gunung", category: "Hiburan" },
  { text: "tiket konser musik", category: "Hiburan" },
  { text: "karaoke keluarga happy puppy", category: "Hiburan" },
  { text: "main billiard malam", category: "Hiburan" },

  // === PEKERJAAN ===
  { text: "beli atk kantor", category: "Pekerjaan" },
  { text: "kertas hvs a4 printer", category: "Pekerjaan" },
  { text: "pulpen dan pensil box", category: "Pekerjaan" },
  { text: "buku tulis catatan agenda", category: "Pekerjaan" },
  { text: "bayar hosting website", category: "Pekerjaan" },
  { text: "sewa domain dot com niagahoster", category: "Pekerjaan" },
  { text: "server cloud aws amazon", category: "Pekerjaan" },
  { text: "digitalocean vps cloud", category: "Pekerjaan" },
  { text: "canva pro subscription", category: "Pekerjaan" },
  { text: "chatgpt plus openai", category: "Pekerjaan" },
  { text: "gemini advanced google", category: "Pekerjaan" },
  { text: "lisensi software adobe", category: "Pekerjaan" },
  { text: "zoom meeting bulanan", category: "Pekerjaan" },
  { text: "iklan facebook ads FB", category: "Pekerjaan" },
  { text: "google ads campaign marketing", category: "Pekerjaan" },
  { text: "iklan instagram ads", category: "Pekerjaan" },
  { text: "modal usaha warung", category: "Pekerjaan" },
  { text: "pembelian bahan baku proyek", category: "Pekerjaan" },

  // === KESEHATAN ===
  { text: "beli obat apotek kimia farma", category: "Kesehatan" },
  { text: "resep dokter k24", category: "Kesehatan" },
  { text: "paracetamol obat pusing", category: "Kesehatan" },
  { text: "panadol bodrex flu", category: "Kesehatan" },
  { text: "periksa dokter gigi", category: "Kesehatan" },
  { text: "klinik kesehatan umum", category: "Kesehatan" },
  { text: "rumah sakit rs rujukan", category: "Kesehatan" },
  { text: "puskesmas berobat", category: "Kesehatan" },
  { text: "periksa laboratorium darah", category: "Kesehatan" },
  { text: "vitamin c halodoc", category: "Kesehatan" },
  { text: "suplemen multivitamin", category: "Kesehatan" },
  { text: "madu tj kesehatan", category: "Kesehatan" },
  { text: "masker medis sensi", category: "Kesehatan" },
  { text: "handsanitizer disinfektan", category: "Kesehatan" },
  { text: "pijat refleksi pegal", category: "Kesehatan" },
  { text: "urut urut tradisional terkilir", category: "Kesehatan" },

  // === PENDIDIKAN ===
  { text: "spp sekolah bulanan anak", category: "Pendidikan" },
  { text: "uang kuliah tunggal ukt semester", category: "Pendidikan" },
  { text: "bayar semesteran kuliah", category: "Pendidikan" },
  { text: "buku pelajaran sekolah erlangga", category: "Pendidikan" },
  { text: "buku cetak kuliah teks", category: "Pendidikan" },
  { text: "kamus bahasa inggris oxford", category: "Pendidikan" },
  { text: "kursus programming dicoding", category: "Pendidikan" },
  { text: "pelatihan sertifikasi kompetensi", category: "Pendidikan" },
  { text: "udemy course programming", category: "Pendidikan" },
  { text: "ruangguru premium bimbel", category: "Pendidikan" },
  { text: "seminar nasional pendidikan", category: "Pendidikan" },
  { text: "workshop bisnis startup", category: "Pendidikan" },
  { text: "bimbingan skripsi dosen", category: "Pendidikan" },
  { text: "biaya wisuda", category: "Pendidikan" },

  // === HUTANG & PIUTANG ===
  { text: "bayar utang temen", category: "Hutang" },
  { text: "cicilan pinjaman online pinjol", category: "Hutang" },
  { text: "saur hutang saudara", category: "Hutang" },
  { text: "lunasin utang bank", category: "Hutang" },
  { text: "piutang cair dibayar", category: "Piutang" },
  { text: "terima bayaran utang", category: "Piutang" },
  { text: "balikin uang pinjaman ke saya", category: "Piutang" },

  // === PENDAPATAN ===
  { text: "terima gaji bulanan kantor", category: "Pendapatan" },
  { text: "gajian payroll", category: "Pendapatan" },
  { text: "bonus tahunan kerja", category: "Pendapatan" },
  { text: "komisi penjualan agen", category: "Pendapatan" },
  { text: "fee freelance project", category: "Pendapatan" },
  { text: "penjualan produk online shop", category: "Pendapatan" },
  { text: "hasil jualan makanan warung", category: "Pendapatan" },
  { text: "keuntungan dagang harian", category: "Pendapatan" },
  { text: "cashback gopay shopeepay", category: "Pendapatan" },
  { text: "refund dana pembatalan belanja", category: "Pendapatan" },
  { text: "bunga bank bulanan tabungan", category: "Pendapatan" }
];

// Helper to tokenize and clean text
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // replace punctuation with space
    .split(/\s+/)             // split by whitespace
    .filter(word => word.length > 0);
}

class TFIDFClassifier {
  private documents: { tokens: string[]; category: string }[] = [];
  private idfs: Map<string, number> = new Map();
  private docVectors: { vector: Map<string, number>; category: string; norm: number }[] = [];

  constructor(trainingDocs: TrainingDoc[]) {
    // Tokenize all docs
    this.documents = trainingDocs.map(doc => ({
      tokens: tokenize(doc.text),
      category: doc.category
    }));

    this.calculateIDFs();
    this.vectorizeDocuments();
  }

  private calculateIDFs() {
    const totalDocs = this.documents.length;
    const wordDocCounts: Map<string, number> = new Map();

    for (const doc of this.documents) {
      const uniqueTokens = new Set(doc.tokens);
      for (const token of uniqueTokens) {
        wordDocCounts.set(token, (wordDocCounts.get(token) || 0) + 1);
      }
    }

    for (const [word, count] of wordDocCounts.entries()) {
      // Standard IDF formula with smoothing: ln(1 + totalDocs / (1 + docCount))
      const idf = Math.log(1 + totalDocs / (1 + count));
      this.idfs.set(word, idf);
    }
  }

  private vectorizeDocuments() {
    for (const doc of this.documents) {
      const vector = this.createVector(doc.tokens);
      let sumSq = 0;
      for (const val of vector.values()) {
        sumSq += val * val;
      }
      const norm = Math.sqrt(sumSq);
      this.docVectors.push({
        vector,
        category: doc.category,
        norm
      });
    }
  }

  private createVector(tokens: string[]): Map<string, number> {
    const vector = new Map<string, number>();
    const termCounts: Map<string, number> = new Map();

    // Term Frequency (TF)
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }

    for (const [term, count] of termCounts.entries()) {
      const idf = this.idfs.get(term) || 0;
      if (idf > 0) {
        vector.set(term, count * idf);
      }
    }

    return vector;
  }

  public classify(text: string, k: number = 3, threshold: number = 0.05): string {
    const queryTokens = tokenize(text);
    if (queryTokens.length === 0) {
      return "Lainnya";
    }

    const queryVector = this.createVector(queryTokens);
    let qSumSq = 0;
    for (const val of queryVector.values()) {
      qSumSq += val * val;
    }
    const qNorm = Math.sqrt(qSumSq);

    if (qNorm === 0) {
      return "Lainnya";
    }

    // Hitung Cosine Similarity untuk semua doc training
    const scores = this.docVectors.map(doc => {
      let dotProduct = 0;
      for (const [term, qVal] of queryVector.entries()) {
        const dVal = doc.vector.get(term) || 0;
        dotProduct += qVal * dVal;
      }

      const similarity = doc.norm > 0 ? dotProduct / (qNorm * doc.norm) : 0;
      return {
        category: doc.category,
        similarity
      };
    });

    // Urutkan berdasarkan similarity tertinggi
    scores.sort((a, b) => b.similarity - a.similarity);

    // Ambil top-K
    const topK = scores.slice(0, k);

    // Jika tetangga terdekat pun similarity-nya sangat rendah, fallback ke Lainnya
    if (topK.length === 0 || topK[0].similarity < threshold) {
      return "Lainnya";
    }

    // Voting dengan pembobotan similarity
    const votes: Map<string, number> = new Map();
    for (const neighbor of topK) {
      if (neighbor.similarity > 0) {
        votes.set(neighbor.category, (votes.get(neighbor.category) || 0) + neighbor.similarity);
      }
    }

    let bestCategory = "Lainnya";
    let maxVote = -1;
    for (const [cat, voteVal] of votes.entries()) {
      if (voteVal > maxVote) {
        maxVote = voteVal;
        bestCategory = cat;
      }
    }

    return bestCategory;
  }
}

// Inisialisasi Singleton Instance dari Classifier
let classifierInstance: TFIDFClassifier | null = null;

export function classifyCategory(text: string): string {
  if (!classifierInstance) {
    classifierInstance = new TFIDFClassifier(TRAINING_DATA);
  }
  return classifierInstance.classify(text, 3, 0.05);
}
