
import { GoogleGenAI, Type } from "@google/genai";
import { FashionAnswers } from "../types";

const prepareParts = (images: string[]) => {
  return images.map(img => ({
    inlineData: {
      mimeType: img.split(';')[0].split(':')[1],
      data: img.split(',')[1]
    }
  }));
};

export const analyzeImageForPerson = async (images: string[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts = prepareParts(images);

  const systemInstruction = `
    Você é um Especialista em Biometria Fashion. Analise as imagens para definir o BIOTIPO REAL da modelo.
    FOCO ABSOLUTO: Se a modelo for plus-size, descreva como "full-figured model with realistic plus-size curvy physique". 
    Seja específico sobre etnia, tom de pele e tipo de cabelo se visível.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [...parts, { text: "Faça a análise biométrica e de vestuário de todas as referências." }] }],
      config: { systemInstruction, temperature: 0.1 },
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};

export const suggestAllFields = async (images: string[], type: 'video' | 'image'): Promise<Partial<FashionAnswers>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts = prepareParts(images);

  const systemInstruction = `
    Você é um Diretor de Arte de Moda. Analise as referências e crie um briefing em Português:
    - scenario: Local que valorize as cores.
    - modelDescription: Descrição anatômica inegociável baseada na foto (inclua biotipo real).
    - action: Movimento/Pose.
    - cameraStyle: Estética cinematográfica.
    - details: Detalhes técnicos do tecido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [...parts, { text: "Gere o briefing técnico baseado em todas as referências." }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING },
            modelDescription: { type: Type.STRING },
            action: { type: Type.STRING },
            cameraStyle: { type: Type.STRING },
            details: { type: Type.STRING },
          },
          required: ["scenario", "modelDescription", "action", "cameraStyle", "details"],
        }
      },
    });
    const text = response.text?.trim();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return {};
  }
};

export const suggestFieldContent = async (field: keyof FashionAnswers, currentAnswers: FashionAnswers, images: string[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts = prepareParts(images);
  
  const systemInstruction = `Sugira um detalhe técnico em Português para o campo ${field} mantendo consistência com as fotos.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [...parts, { text: `Contexto: ${JSON.stringify(currentAnswers)}. Campo: ${field}` }] }],
      config: { systemInstruction, temperature: 0.7 },
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};

export const generateFashionPrompt = async (answers: FashionAnswers, images: string[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts = prepareParts(images);

  const systemInstruction = `
    Você é o melhor engenheiro de prompts do mundo para modelos de vídeo e imagem como Sora, Veo 3 e Midjourney.
    
    Crie um prompt em INGLÊS extremamente detalhado.
    DIRETRIZES:
    1. SUBJECT: Fidelidade absoluta ao peso, curvas e biotipo da modelo nas fotos. Use termos técnicos como "physically accurate proportions", "realistic skin texture".
    2. CLOTHING: Descreva a construção da roupa, costuras, caimento do tecido sob gravidade e interação com a luz.
    3. CINEMATOGRAPHY: Use vocabulário de cinema (ex: anamorphic lens, 8k, photorealistic, cinematic lighting).
    4. NO ALTERATIONS: Proibir expressamente mudanças no peso ou design original.
    
    Retorne apenas o prompt final estruturado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [...parts, { text: `Dados do formulário: ${JSON.stringify(answers)}` }] }],
      config: { systemInstruction, temperature: 0.3 },
    });
    return response.text?.trim() || "Error generating high-fidelity prompt.";
  } catch (error) {
    throw new Error("Erro na geração técnica do prompt.");
  }
};
