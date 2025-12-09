import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const createClient = () => {
    const apiKey = process.env.API_KEY || ''; 
    // Note: In a real app, never expose key on client. 
    // This assumes the environment is configured or a proxy is used.
    // For this demo, we assume process.env.API_KEY is available.
    if (!apiKey) {
        console.warn("API Key is missing for Gemini");
    }
    return new GoogleGenAI({ apiKey });
}

export const generateQuestions = async (title: string, description: string, grade: string): Promise<Question[]> => {
    const ai = createClient();
    
    const prompt = `Buatkan 3 pertanyaan refleksi literasi yang sederhana dan mendidik untuk siswa kelas ${grade} SD berdasarkan buku/bacaan berjudul "${title}". Deskripsi: "${description}". Pertanyaan harus mengajak siswa berpikir kritis tapi menyenangkan.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const raw = response.text;
        if (!raw) return [];
        
        const parsed = JSON.parse(raw);
        return parsed.map((item: any, idx: number) => ({
            id: `gen_${Date.now()}_${idx}`,
            text: item.text,
            type: 'text'
        }));

    } catch (error) {
        console.error("Gemini Error:", error);
        return [
            { id: 'err1', text: 'Apa bagian yang paling kamu sukai?', type: 'text' },
            { id: 'err2', text: 'Siapa tokoh favoritmu?', type: 'text' },
            { id: 'err3', text: 'Pelajaran apa yang kamu dapatkan?', type: 'text' }
        ];
    }
};