// Indonesian daily language NLP transaction parser
import { DbCategory } from '@/services/db/localStorageDb';
import { classifyCategory } from './categoryClassifier';

export interface ParsedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  tags: string[];
}

export function parseIndonesianNLP(text: string, categories: DbCategory[] = []): ParsedTransaction {
  const lowerText = text.toLowerCase();
  
  let amount = 0;
  let type: 'income' | 'expense' = 'expense';
  let category = 'Lainnya';
  const tags: string[] = [];

  // 1. Extract Amount
  // Matches patterns like "20 ribu", "20rb", "18k", "7 juta", "7jt", "4.5 juta", "4,5jt", "25.000", "25000"
  const matches = [...lowerText.matchAll(/([\d.,]+)\s*(jt|juta|rb|ribu|k\b)?/gi)];
  
  for (const m of matches) {
    const numStr = m[1];
    const suffix = m[2] ? m[2].toLowerCase() : '';
    let val = 0;

    if (suffix === 'jt' || suffix === 'juta') {
      val = parseFloat(numStr.replace(',', '.')) * 1000000;
    } else if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') {
      val = parseFloat(numStr.replace(',', '.')) * 1000;
    } else {
      // Normal number, strip dots/commas
      val = parseInt(numStr.replace(/[,.]/g, ''), 10);
    }

    if (val > amount) {
      amount = val;
    }
  }

  // 2. Dynamic Custom Categories check first
  const matchedCustomCategory = categories.find(
    c => {
      const catName = c.name.toLowerCase();
      // Exact match
      if (lowerText.includes(catName)) return true;
      // Partial word match for custom categories (words > 3 chars)
      if (!c.isBuiltIn) {
        return catName.split(/\s+/).some(word => word.length > 3 && lowerText.includes(word));
      }
      return false;
    }
  );

  if (matchedCustomCategory) {
    category = matchedCustomCategory.name;
    type = matchedCustomCategory.type;
  } else {
    // 3. Detect Hutang / Piutang Keywords & Type
    const isHutangLunas = lowerText.match(/\b(bayar|cicil|saur|lunas)\b/) && lowerText.match(/\b(utang|hutang|pinjaman|pinjeman)\b/);
    const isPiutangLunas = lowerText.match(/\b(cair|terima|lunas|dibayar|saur)\b/) && lowerText.match(/\b(piutang|utang|hutang)\b/) && !lowerText.match(/\b(bayar)\b/);

    const isHutangBaruKeywords = lowerText.match(/\b(saya|aku)\s+(minjem|pinjem|utang|hutang|pinjam)\b/) || 
                                 lowerText.match(/\b(minjem|pinjem|utang|hutang|pinjam)\s+dari\b/) ||
                                 lowerText.match(/\b(dapat|dapet)\s+(pinjaman|pinjeman)\b/);

    let isPiutangBaru = lowerText.match(/\b(minjemin|pinjemin|ngutangin|kasih\s*pinjam|kasih\s*pinjem|beri\s*pinjaman|beri\s*pinjeman|piutang\s+ke)\b/) !== null;

    if (!isPiutangBaru) {
      const nameBorrowMatch = lowerText.match(/\b([a-z]+)\s+(minjem|pinjem|utang|hutang|pinjam)\b/i);
      if (nameBorrowMatch) {
        const subject = nameBorrowMatch[1].toLowerCase();
        const excludeList = ['saya', 'aku', 'kami', 'kita', 'bayar', 'cicil', 'saur', 'lunas', 'cair', 'terima', 'dapat', 'dapet'];
        if (!excludeList.includes(subject)) {
          isPiutangBaru = true;
        }
      }
    }

    let isHutangBaru = isHutangBaruKeywords !== null;
    if (!isHutangBaru && !isPiutangBaru && !isHutangLunas && !isPiutangLunas) {
      if (lowerText.match(/\b(pinjam|pinjem|utang|hutang)\b/)) {
        isHutangBaru = true;
      }
    }

    if (isHutangBaru) {
      type = 'income'; // Borrowing money = Cash Inflow (+)
      category = 'Hutang';
    } else if (isHutangLunas) {
      type = 'expense'; // Paying debt = Cash Outflow (-)
      category = 'Hutang';
    } else if (isPiutangBaru) {
      type = 'expense'; // Lending money = Cash Outflow (-)
      category = 'Piutang';
    } else if (isPiutangLunas) {
      type = 'income'; // Receiving loan back = Cash Inflow (+)
      category = 'Piutang';
    } else {
      // Standard Type based on Keywords
      const incomeKeywords = [
        'gaji', 'gajian', 'bonus', 'fee', 'komisi', 'transfer client', 
        'freelance', 'penjualan', 'cashback', 'refund', 'terima', 
        'dapat', 'cair', 'piutang cair', 'masuk', 'project', 'sampingan'
      ];
      
      const isIncome = incomeKeywords.some(kw => lowerText.includes(kw));
      
      if (isIncome) {
        type = 'income';
        category = 'Pendapatan'; // default built-in income category
      } else {
        type = 'expense';
        
        // 1. Try modern TF-IDF + Cosine Similarity KNN Classifier first
        const classified = classifyCategory(lowerText);
        if (classified && classified !== 'Lainnya') {
          category = classified;
        } else {
          // 2. Fallback to keyword matching (improved regex)
          if (lowerText.match(/\b(makan|minum|kopi|cafe|coffee|restoran|resto|warteg|bakso|soto|geprek|mcd|kfc|pizza|jajan|sarapan|siang|malam|combro|misro|gorengan|tempe|tahu|sate|pecel|nasi|mie|roti|burger|ramen|sushi|donat|donut|cilok|cireng|batagor|siomay|martabak|seblak|cimol|lumpia|risol|risoles|pastel|onde|klepon|lontong|bubur|ketoprak|gado|es|jus|juice|teh|susu|kopi|boba|starbucks|kopisusu|gula|camilan|snack|cemilan|buah|sayur|daging|ayam|ikan|telur|beras|gandum|indomie|popmie|saus|kecap|kuliner|snack|jajanan|cemil|goreng|air|galon|aqua|mineral|le\s*minerale|club|vit|ades|cleo)\b/)) {
            category = 'Makanan & Minuman';
          } else if (lowerText.match(/\b(bensin|pertalite|pertamax|solar|tol|parkir|grab|gojek|maxim|mrt|krl|bus|kereta|taksi|ojek|motor|mobil|commuter|shell|bp|pertamina|ride|car|anwar|indrive|go-ride|go-car|grabcar|grabride|lrt|busway|transjakarta|angkot|travel|tiket|penerbangan|pesawat|garuda|kai|oli|servis|service|cuci\s*motor|cuci\s*mobil|ban|helm|gopay|ovo)\b/)) {
            category = 'Transportasi';
          } else if (lowerText.match(/\b(indomaret|alfamart|supermarket|shopee|tokopedia|lazada|tiktok|baju|sepatu|tas|elektronik|laptop|hp|gadget|aksesoris|mall|belanja|beli|superindo|hypermart|carefour|transmart|tokopedia|bukalapak|blibli|fashion|kaos|kemeja|celana|rok|jaket|jeans|sandal|skincare|kosmetik|makeup|parfum|sabun|shampoo|pasta\s*gigi|odol|minimarket|warung|pasar)\b/)) {
            category = 'Belanja';
          } else if (lowerText.match(/\b(listrik|internet|wifi|indihome|pulsa|paket\s*data|data|kuota|bpjs|pln|pdam|tagihan|cicilan|asuransi|pajak|samsat|pbb|sewa|kontrakan|kosan|token|biznet|first\s*media|myrepublic|telkomsel|xl|indosat|tri|smartfren|kartu\s*halo)\b/)) {
            category = 'Tagihan & Utilitas';
          } else if (lowerText.match(/\b(bioskop|nonton|netflix|spotify|disney|steam|game|playstation|ps|nongkrong|travel|liburan|hotel|staycation|cgv|xxi|cinepolis|karaoke|billiard|konser|dufan|ancol|puncak|pantai|gunung|camping|rentcar|rental|youtube\s*premium|hbomax)\b/)) {
            category = 'Hiburan';
          } else if (lowerText.match(/\b(atk|printer|hosting|domain|canva|chatgpt|gemini|software|lisensi|zoom|kerja|project|kertas|pulpen|buku\s*tulis|notaris|iklan|ads|facebook\s*ads|google\s*ads|github|aws|digitalocean|server|magang|bisnis)\b/)) {
            category = 'Pekerjaan';
          } else if (lowerText.match(/\b(rumah\s*sakit|rs|klinik|dokter|apotek|obat|vitamin|sehat|sakit|puskesmas|bpjs\s*kesehatan|laboratorium|lab|swab|antigen|masker|handsanitizer|suplemen|jamu|urut|pijat|terapi|susu\s*beruang)\b/)) {
            category = 'Kesehatan';
          } else if (lowerText.match(/\b(kuliah|sekolah|buku|kursus|sertifikasi|pelatihan|belajar|spp|academy|udemy|coursera|bimbel|les|seminar|workshop|skripsi|pendaftaran|wisuda|ruangguru|zenius)\b/)) {
            category = 'Pendidikan';
          }
        }
      }
    }
  }

  // 4. Extract Tags (based on keywords or hashtags)
  if (lowerText.includes('kerja') || lowerText.includes('proyek') || lowerText.includes('kantor')) tags.push('kerja');
  if (lowerText.includes('liburan') || lowerText.includes('jalan') || lowerText.includes('refreshing')) tags.push('liburan');
  if (lowerText.includes('keluarga') || lowerText.includes('rumah') || lowerText.includes('anak')) tags.push('keluarga');
  if (lowerText.includes('kuliah') || lowerText.includes('belajar') || lowerText.includes('sekolah')) tags.push('pendidikan');
  if (lowerText.includes('hemat') || lowerText.includes('promo') || lowerText.includes('diskon')) tags.push('promo');
  if (lowerText.match(/\b(utang|hutang|pinjam|pinjaman|piutang|cicilan)\b/)) tags.push('debt');

  // Clean description
  let description = text;
  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    description,
    amount,
    type,
    category,
    tags
  };
}

export function parseMultipleIndonesianNLP(text: string, categories: DbCategory[] = []): ParsedTransaction[] {
  // Membagi kalimat berdasarkan koma, kata "dan", "tambah", atau baris baru
  const segments = text.split(/,|\bdan\b|\btambah\b|\n/i).map(s => s.trim()).filter(Boolean);
  const results: ParsedTransaction[] = [];
  
  for (const segment of segments) {
    const parsed = parseIndonesianNLP(segment, categories);
    if (parsed.amount > 0 || segments.length === 1) {
      // Bersihkan deskripsi dari angka nominal agar lebih rapi (misal: "kopi 15rb" -> "kopi")
      let cleanDesc = parsed.description
        .replace(/[\d.,]+\s*(jt|juta|rb|ribu|k\b)?/gi, '')
        .replace(/^(beli|bayar|pengeluaran|pemasukan)\s+/i, '')
        .trim();
        
      cleanDesc = cleanDesc.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
        
      if (cleanDesc) {
        parsed.description = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
      }
      
      results.push(parsed);
    }
  }

  // Fallback jika tidak ada pola yang terdeteksi
  if (results.length === 0) {
    results.push(parseIndonesianNLP(text, categories));
  }

  return results;
}

export function parseReceiptOCR(text: string, categories: DbCategory[] = []): ParsedTransaction {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lowerText = text.toLowerCase();
  
  let amount = 0;
  let category = 'Lainnya';
  let merchant = 'Toko/Merchant';
  
  // 1. Find Merchant Name & Category
  const knownMerchants = [
    { brand: 'indomaret', name: 'Indomaret', category: 'Makanan & Minuman' },
    { brand: 'alfamart', name: 'Alfamart', category: 'Makanan & Minuman' },
    { brand: 'alfamidi', name: 'Alfamidi', category: 'Makanan & Minuman' },
    { brand: 'pertamina', name: 'SPBU Pertamina', category: 'Transportasi' },
    { brand: 'shell', name: 'Shell', category: 'Transportasi' },
    { brand: 'starbucks', name: 'Starbucks', category: 'Makanan & Minuman' },
    { brand: 'kfc', name: 'KFC', category: 'Makanan & Minuman' },
    { brand: 'mcdonald', name: 'McDonalds', category: 'Makanan & Minuman' },
    { brand: 'chatime', name: 'Chatime', category: 'Makanan & Minuman' },
    { brand: 'mixue', name: 'Mixue', category: 'Makanan & Minuman' },
    { brand: 'superindo', name: 'Superindo', category: 'Belanja' },
    { brand: 'hypermart', name: 'Hypermart', category: 'Belanja' },
    { brand: 'transmart', name: 'Transmart', category: 'Belanja' },
    { brand: 'gramedia', name: 'Gramedia', category: 'Pendidikan' },
    { brand: 'guardian', name: 'Guardian', category: 'Kesehatan' },
    { brand: 'watsons', name: 'Watsons', category: 'Kesehatan' },
    { brand: 'apotek', name: 'Apotek', category: 'Kesehatan' },
    { brand: 'spbu', name: 'SPBU', category: 'Transportasi' },
    { brand: 'gojek', name: 'Gojek', category: 'Transportasi' },
    { brand: 'grab', name: 'Grab', category: 'Transportasi' }
  ];

  const matchedBrand = knownMerchants.find(m => lowerText.includes(m.brand));
  
  if (matchedBrand) {
    merchant = matchedBrand.name;
    category = matchedBrand.category;
  } else if (lines.length > 0) {
    merchant = lines[0].substring(0, 20); // First line fallback
  }

  // Override category if a custom category matches the merchant
  const matchedCustomCategory = categories.find(c => 
    !c.isBuiltIn && merchant.toLowerCase().includes(c.name.toLowerCase())
  );
  if (matchedCustomCategory) {
    category = matchedCustomCategory.name;
  }

  // 2. Extract Amount
  let possibleAmounts: number[] = [];
  const extractNumbers = (str: string) => {
    // Match Rp 15.000 or 15,000 or 15.000.00
    const matches = [...str.matchAll(/Rp?\s*([\d.,]+)/gi), ...str.matchAll(/(?<!\d)([\d]{1,3}(?:[.,][\d]{3})+)(?!\d)/g)];
    for (const m of matches) {
      let numStr = m[1] || m[0];
      numStr = numStr.replace(/[,.]00$/, ''); // strip decimal
      const val = parseInt(numStr.replace(/[,.]/g, ''), 10);
      if (val && !isNaN(val) && val > 0) {
        possibleAmounts.push(val);
      }
    }
  };

  // Try finding amounts on lines with keywords first
  const totalLines = lines.filter(l => 
    l.toLowerCase().match(/total|jumlah|tunai|cash|bayar/)
  );
  totalLines.forEach(extractNumbers);
  
  if (possibleAmounts.length === 0) {
    extractNumbers(text); // scan whole text if no keywords found
  }

  // Filter out unlikely phone numbers or dates (only keep 1,000 to 99,999,999)
  possibleAmounts = possibleAmounts.filter(a => a >= 1000 && a < 100000000);
  
  if (possibleAmounts.length > 0) {
    amount = Math.max(...possibleAmounts);
  }

  // 3. Extract items and PPN
  const items: { name: string, price: number }[] = [];
  let tax = 0;

  const extractNumbersArray = (str: string) => {
    const nums: number[] = [];
    const matches = [...str.matchAll(/Rp?\s*([\d.,]+)/gi), ...str.matchAll(/(?<!\d)([\d]{1,3}(?:[.,][\d]{3})+)(?!\d)/g)];
    for (const m of matches) {
      let numStr = m[1] || m[0];
      numStr = numStr.replace(/[,.]00$/, ''); 
      const val = parseInt(numStr.replace(/[,.]/g, ''), 10);
      if (val && !isNaN(val) && val > 0) nums.push(val);
    }
    return nums;
  };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip if it's the merchant line
    if (lowerLine.includes(merchant.toLowerCase()) && merchant.length > 3) continue;

    // Check for tax
    if (lowerLine.match(/\b(ppn|pajak|tax|pb1)\b/)) {
      const nums = extractNumbersArray(line);
      if (nums.length > 0) {
        const possibleTaxes = nums.filter(n => amount === 0 || n < amount);
        if (possibleTaxes.length > 0) {
          tax = Math.max(...possibleTaxes);
        }
      }
      continue;
    }
    
    // Check if it's an item (has text and a number)
    // Ignore lines that are just numbers, or just known headers, or total lines
    if (lowerLine.match(/total|jumlah|tunai|cash|bayar|kembali|change|diskon|discount|debit|kredit|card/i)) continue;

    const nums = extractNumbersArray(line);
    if (nums.length > 0) {
      const price = Math.max(...nums);
      
      // The item name is the line without the price numbers
      let name = line.replace(/Rp?\s*([\d.,]+)/gi, '').replace(/(?<!\d)([\d]{1,3}(?:[.,][\d]{3})+)(?!\d)/g, '').trim();
      name = name.replace(/^[\d\sx*]+/, '').trim(); // remove leading quantities like "1 " or "2x "
      
      if (name.length > 2 && price >= 500 && (amount === 0 || price < amount)) {
        items.push({ name, price });
      }
    }
  }

  // Calculate detailed string description for the chat
  let detailedDescription = `Belanja di ${merchant}`;
  if (items.length > 0 || tax > 0) {
    detailedDescription = `Belanja di ${merchant}\n\n**Rincian:**\n` + 
      items.map(i => `- ${i.name}: Rp${i.price.toLocaleString('id-ID')}`).join('\n');
    if (tax > 0) {
      detailedDescription += `\n- PPN/Pajak: Rp${tax.toLocaleString('id-ID')}`;
    }
  }

  return {
    description: detailedDescription,
    amount,
    type: 'expense',
    category,
    tags: ['ocr']
  };
}
