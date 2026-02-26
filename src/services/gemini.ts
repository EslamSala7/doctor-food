import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type UserProfile = {
  age: string;
  gender: 'male' | 'female' | '';
  weight: string;
};

export async function analyzeFood(base64Image: string, profile: UserProfile) {
  // Extract base64 data and mime type
  const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format");
  }
  const mimeType = match[1];
  const data = match[2];

  const prompt = `
    أنت خبير تغذية وطبيب محترف. قم بتحليل صورة الطعام المرفقة.
    المستخدم هو: ${profile.gender === 'male' ? 'ذكر' : 'أنثى'}، العمر: ${profile.age} سنة، الوزن: ${profile.weight} كجم.
    
    قم بتحليل الصورة بدقة وقدم المعلومات التالية باللغة العربية:
    1. اسم الطعام أو الوجبة.
    2. الوزن التقديري للوجبة بالجرام.
    3. السعرات الحرارية التقديرية.
    4. نبذة عن التأثير الصحي لهذه الوجبة على المستخدم بناءً على بياناته.
    5. هل الوجبة صحية أم لا (نعم/لا).
    6. تقييم الوجبة من 10 (رقم).
    7. قائمة بالبدائل الصحية إذا كانت غير صحية، أو إضافات صحية إذا كانت صحية.
    8. تحليل شامل ومفصل للوجبة ومدى ملاءمتها للمستخدم.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: {
            type: Type.STRING,
            description: "اسم الطعام أو الوجبة",
          },
          estimatedWeight: {
            type: Type.STRING,
            description: "الوزن التقديري مع الوحدة (مثال: 250 جرام)",
          },
          calories: {
            type: Type.STRING,
            description: "السعرات الحرارية التقديرية (مثال: 450 سعرة)",
          },
          healthiness: {
            type: Type.STRING,
            description: "نبذة قصيرة عن التأثير الصحي",
          },
          isHealthy: {
            type: Type.BOOLEAN,
            description: "هل الوجبة صحية بشكل عام",
          },
          rating: {
            type: Type.NUMBER,
            description: "تقييم الوجبة من 10",
          },
          healthyAlternatives: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "بدائل صحية أو إضافات مقترحة",
          },
          analysis: {
            type: Type.STRING,
            description: "تحليل شامل ومفصل",
          },
        },
        required: [
          "foodName",
          "estimatedWeight",
          "calories",
          "healthiness",
          "isHealthy",
          "rating",
          "healthyAlternatives",
          "analysis",
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(text);
}
