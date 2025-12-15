import { GoogleGenAI, Type } from "@google/genai";
import { ReflectionQuestion } from "../types";

// Fungsi aman untuk mengambil API KEY tanpa membuat browser crash
const getApiKey = () => {
  try {
    // Gunakan import.meta.env untuk Vite/Vercel
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    console.warn("Gagal membaca environment variable.");
  }
  return '';
};

// Inisialisasi Lazy (hanya saat dibutuhkan) untuk mencegah crash saat load awal
let ai: GoogleGenAI | null = null;

const getAIInstance = () => {
  if (!ai) {
    const key = getApiKey();
    if (key) {
      ai = new GoogleGenAI({ apiKey: key });
    }
  }
  return ai;
};

export const generateReflectionQuestions = async (title: string, content: string, grade: string): Promise<ReflectionQuestion[]> => {
  const aiInstance = getAIInstance();

  // Jika API Key tidak ada, gunakan pertanyaan fallback (JANGAN CRASH)
  if (!aiInstance) {
    console.warn("API Key Gemini tidak ditemukan atau tidak valid. Menggunakan pertanyaan default.");
    return [
      { id: 'auto-1', text: 'Apa bagian paling menarik dari bacaan ini menurutmu?' },
      { id: 'auto-2', text: 'Pelajaran apa yang bisa diambil dari bacaan tersebut?' },
      { id: 'auto-3', text: 'Tuliskan satu hal baru yang kamu pelajari hari ini!' }
    ];
  }

  try {
    const prompt = `
      Kamu adalah asisten guru SD. Buatkan 3-5 pertanyaan refleksi yang mendorong berpikir kritis untuk siswa kelas ${grade} SD.
      Berdasarkan materi berikut:
      Judul: "${title}"
      Isi/Ringkasan: "${content}"
      
      Output harus HANYA berupa JSON array of strings. Jangan ada teks lain.
      Contoh: ["Apa pelajaran moral dari cerita ini?", "Bagaimana perasaan tokoh utama?"]
    `;

    const response = await aiInstance.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const questionsArray: string[] = JSON.parse(text);

    return questionsArray.map((q, index) => ({
      id: `gen-${Date.now()}-${index}`,
      text: q
    }));

  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback jika kuota habis atau error koneksi
    return [
      { id: 'err1', text: 'Sebutkan hal menarik dari bacaan ini!' },
      { id: 'err2', text: 'Apa pesan moral yang kamu dapatkan?' }
    ];
  }
};