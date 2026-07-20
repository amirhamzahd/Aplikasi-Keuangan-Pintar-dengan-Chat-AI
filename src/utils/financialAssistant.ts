import { DbTransaction, DbAccount, DbBudget } from '@/services/db/localStorageDb';

interface AssistantResponse {
  isTransactionCommand: boolean;
  reply: string;
}

export function handleFinancialAssistant(
  text: string,
  transactions: DbTransaction[],
  accounts: DbAccount[],
  budgets: DbBudget[]
): AssistantResponse {
  const lowerText = text.toLowerCase().trim();

  // Helper to format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Helper to get current month transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const lastMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    let targetMonth = currentMonth - 1;
    let targetYear = currentYear;
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    }
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  // --- 1. DETECT TRANSACTION COMMANDS FIRST ---
  // E.g., Beli kopi 18rb, Bayar listrik 200k, Pemasukan 5jt, Gaji masuk 10juta
  // Must contain amount patterns and NOT contain question marks or question keywords
  const hasAmount = lowerText.match(/\b\d+([.,]\d+)?\s*(k|rb|ribu|jt|juta)?\b/gi);
  const isQuestion = lowerText.match(/\b(berapa|bagaimana|bagaimanakah|apa|apakah|mengapa|kenapa|mana|dimana|siapa|tanya|tips|rekomendasi|edukasi|darurat|inflasi)\b/) || lowerText.includes('?');
  
  const actionVerbs = ['beli', 'bayar', 'gaji', 'gajian', 'masuk', 'keluar', 'catat', 'tambah', 'terima', 'dapat', 'isi', 'sampingan', 'freelance', 'transfer'];
  const hasAction = actionVerbs.some(v => lowerText.includes(v));

  if (hasAmount && !isQuestion && (hasAction || lowerText.length < 40)) {
    return {
      isTransactionCommand: true,
      reply: '' // Let the standard nlpParser handle it
    };
  }

  // --- 2. JIKA BUKAN TRANSAKSI, LEMPAR KE GEMINI ---
  return {
    isTransactionCommand: false,
    reply: '' // Frontend akan menembak /api/gemini
  };
}
