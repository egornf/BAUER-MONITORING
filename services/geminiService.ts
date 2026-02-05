import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CallAnalysis } from "../types";

const SYSTEM_INSTRUCTION = `
Ты — элитный бизнес-тренер и эксперт по продажам с 15-летним опытом. Твоя задача — провести глубокий, детальный и бескомпромиссный аудит телефонного звонка менеджера.

ТВОИ ЗАДАЧИ:

1. ИДЕНТИФИКАЦИЯ: 
   - Определи имена.

2. ТРАНСКРИБАЦИЯ (ТОЧНАЯ) И ОШИБКИ:
   - Сделай ДОСЛОВНУЮ транскрибацию диалога. Не упускай детали.
   - Для КАЖДОЙ реплики укажи точный таймкод начала (startTime) в секундах (число).
   - В поле 'error' помечай любые ошибки: слова-паразиты, неуверенность, перебивание, грубость, игнорирование вопроса клиента.

3. ОЦЕНКА ПО БЛОКАМ (0-10) И РАЗВЕРНУТЫЕ КОММЕНТАРИИ:
   - Оценивай каждый этап: Приветствие, Присоединение, Презентация, Приведи друга, Закрепление, Отсоединение.
   - КОММЕНТАРИЙ ДОЛЖЕН БЫТЬ ОБШИРНЫМ (минимум 3-4 предложения на каждый блок).
   - Не пиши общих фраз ("Всё хорошо"). Пиши детально: "Менеджер использовал правильную интонацию, но забыл спросить имя. Фраза Х прозвучала неуверенно. Было упущено выявление потребности Y."
   - Анализируй психологию влияния и технику продаж.

4. СОВЕТЫ (TIPS):
   - Напиши "Общий совет" по всему звонку.
   - Напиши персональный совет для каждого блока, ЕСЛИ ОЦЕНКА НИЖЕ 8 БАЛЛОВ.
   - Совет должен быть конкретным действием: "В следующий раз используй технику СПИН", "Замени фразу Х на фразу Y".

5. ОБЩЕЕ РЕЗЮМЕ:
   - Сильные стороны и зоны критического роста.

Формат ответа строго JSON.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    managerName: { type: Type.STRING, description: "Имя менеджера" },
    clientName: { type: Type.STRING, description: "Имя клиента" },
    transcription: {
      type: Type.ARRAY,
      description: "Транскрибация с анализом ошибок и таймкодами",
      items: {
        type: Type.OBJECT,
        properties: {
          speaker: { type: Type.STRING },
          role: { type: Type.STRING, enum: ["manager", "client", "other"] },
          text: { type: Type.STRING },
          startTime: { type: Type.NUMBER, description: "Время начала реплики в секундах" },
          error: {
            type: Type.OBJECT,
            description: "Заполнять только если есть ошибка в этой реплике",
            properties: {
              hasError: { type: Type.BOOLEAN },
              comment: { type: Type.STRING, description: "Почему это ошибка и как надо было сказать" },
              severity: { type: Type.STRING, enum: ["low", "medium", "high"] }
            },
            required: ["hasError", "comment", "severity"]
          }
        },
        required: ["speaker", "role", "text", "startTime"]
      }
    },
    advice: {
      type: Type.OBJECT,
      properties: {
        overall: { type: Type.STRING, description: "Главный совет менеджеру на будущее" },
        greeting: { type: Type.STRING, description: "Совет по блоку Приветствие (если оценка < 8)" },
        joining: { type: Type.STRING, description: "Совет по блоку Присоединение (если оценка < 8)" },
        presentation: { type: Type.STRING, description: "Совет по блоку Презентация (если оценка < 8)" },
        referAFriend: { type: Type.STRING, description: "Совет по блоку Приведи друга (если оценка < 8)" },
        consolidation: { type: Type.STRING, description: "Совет по блоку Закрепление (если оценка < 8)" },
        disconnection: { type: Type.STRING, description: "Совет по блоку Отсоединение (если оценка < 8)" },
      },
      required: ["overall"]
    },
    greeting: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        comment: { type: Type.STRING, description: "Подробный разбор (3-4 предложения)" },
      },
      required: ["score", "comment"],
    },
    joining: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        comment: { type: Type.STRING, description: "Подробный разбор (3-4 предложения)" },
      },
      required: ["score", "comment"],
    },
    presentation: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        comment: { type: Type.STRING, description: "Подробный разбор (3-4 предложения)" },
      },
      required: ["score", "comment"],
    },
    referAFriend: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        comment: { type: Type.STRING, description: "Подробный разбор (3-4 предложения)" },
      },
      required: ["score", "comment"],
    },
    consolidation: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        comment: { type: Type.STRING, description: "Подробный разбор (3-4 предложения)" },
      },
      required: ["score", "comment"],
    },
    disconnection: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        comment: { type: Type.STRING, description: "Подробный разбор (3-4 предложения)" },
      },
      required: ["score", "comment"],
    },
    overallScore: { type: Type.NUMBER },
    summary: { type: Type.STRING },
  },
  required: [
    "managerName",
    "clientName",
    "transcription",
    "advice",
    "greeting",
    "joining",
    "presentation",
    "referAFriend",
    "consolidation",
    "disconnection",
    "overallScore",
    "summary",
  ],
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      // Remove data:audio/mp3;base64, prefix
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeCall = async (file: File): Promise<CallAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const audioPart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: {
        parts: [
          audioPart,
          { text: "Проведи профессиональный аудит этого звонка." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as CallAnalysis;
  } catch (error) {
    console.error("Error analyzing call:", error);
    throw error;
  }
};