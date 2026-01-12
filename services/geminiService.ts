
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
    Você é um Engenheiro de Produto Fashion e Especialista em Visão Computacional.
    Analise as imagens com foco em FIDELIDADE TÉCNICA ABSOLUTA:
    1. TEXTOS E LOGOS: Identifique tipografias, marcas, patches ou bordados. Descreva sua posição exata e estilo.
    2. SILHUETA: Defina se a peça é oversized, ajustada, assimétrica. Mapeie volumes e formas.
    3. BIOTIPO: Identifique o biotipo da modelo nas fotos para manter consistência ou sugerir variações realistas.
    
    Seja técnico e descritivo em Português.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [...parts, { text: "Faça um raio-x técnico da peça e da modelo." }] }],
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
    Você é um Diretor de Arte de Moda focado em High-Fidelity. Analise as referências e crie um briefing:
    - scenario: Local que não ofusque os detalhes da peça.
    - modelDescription: Descrição baseada no biotipo real das fotos.
    - action: Movimentos que mostrem o caimento real do tecido.
    - cameraStyle: Close-ups técnicos e movimentos suaves.
    - details: Mapeie bordados, logos, texturas e acabamentos de costura.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [...parts, { text: "Gere o briefing técnico priorizando a integridade da peça." }] }],
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
  
  const systemInstruction = `Sugira um detalhe técnico em Português para o campo ${field} focado em manter a fidelidade da marca e forma da peça.`;

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
    Você é o Diretor de Tecnologia da Coleção.IA, especialista em prompts para Sora, Veo 3 e Runway.
    Seu objetivo é gerar um prompt que preserve a ROUPA ACIMA DE TUDO.
    
    REGRAS DE OURO PARA O PROMPT (EM INGLÊS):
    1. BRANDING & TEXT: Use termos como "precise graphic placement", "identical branding typography", "sharp text legibility on fabric".
    2. GARMENT PHYSICS: Descreva o peso do tecido (ex: "heavyweight 400gsm cotton", "fluid silk drape").
    3. SILHOUETTE CONSISTENCY: Enfatize a forma (ex: "maintain the specific boxy oversized silhouette", "preserve the exact cropped ratio").
    4. VARIATION CASTING: Integre as variações de pele/cabelo (se fornecidas) sem alterar o biotipo estrutural da modelo que veste a peça.
    5. LIGHTING: Iluminação que revele a textura real da trama do tecido.
    
    Retorne apenas o prompt técnico final em inglês.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [...parts, { text: `Briefing de Produção: ${JSON.stringify(answers)}` }] }],
      config: { systemInstruction, temperature: 0.2 },
    });
    return response.text?.trim() || "Error generating high-fidelity prompt.";
  } catch (error) {
    throw new Error("Erro na geração técnica do prompt.");
  }
};
