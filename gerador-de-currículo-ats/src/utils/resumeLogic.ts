import { ResumeData, Experience, TemplateId } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const parseResumeFromText = async (text: string): Promise<Partial<ResumeData>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extraia as informações deste texto para preencher um currículo. Retorne APENAS um JSON válido.
      Texto: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nome_completo: { type: Type.STRING },
            cidade: { type: Type.STRING },
            estado_uf: { type: Type.STRING },
            telefone: { type: Type.STRING },
            email: { type: Type.STRING },
            cargo_desejado: { type: Type.STRING },
            tipo_jornada: { type: Type.STRING },
            resumo_base: { type: Type.STRING },
            experiencias: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  empresa: { type: Type.STRING },
                  cargo: { type: Type.STRING },
                  periodo: { type: Type.STRING },
                  atividades: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            cursos: { type: Type.ARRAY, items: { type: Type.STRING } },
            idiomas: { type: Type.ARRAY, items: { type: Type.STRING } },
            habilidades_extra: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro ao processar texto com IA:", error);
    throw error;
  }
};

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  return phone;
};

export const formatName = (name: string): string => {
  const lowerExclusions = ['dos', 'da', 'de', 'do', 'das', 'e'];
  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && lowerExclusions.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const chooseTemplate = (data: ResumeData): TemplateId => {
  if (data.experiencias.length === 0) {
    return 'T1_MINIMAL_ATS';
  }
  return 'T2_STANDARD';
};

export const generateHeadline = (cargo: string): string => {
  return `${cargo} | Atendimento e Suporte`;
};

export const buildObjective = (data: ResumeData): string => {
  return `Atuar como ${data.cargo_desejado} em regime ${data.tipo_jornada.toLowerCase()}, contribuindo com proatividade, organização e foco em resultados para a empresa.`;
};

export const buildSummary = (data: ResumeData): string => {
  if (data.resumo_base) return data.resumo_base;
  
  return `Profissional dedicado com foco em ${data.cargo_desejado.toLowerCase()}. Possuo facilidade de comunicação, capacidade de aprendizado rápido e adaptação a novos processos. Comprometido com a qualidade do atendimento e a organização das rotinas de trabalho.`;
};

export const buildSkills = (data: ResumeData): string[] => {
  const baseSkills = [
    "Atendimento e Relacionamento",
    "Organização e Rotina",
    "Comunicação Interpessoal",
    "Aprendizado rápido e adaptação a novos sistemas"
  ];
  return [...baseSkills, ...data.habilidades_extra];
};

export const generateChatGPTPrompt = (data: ResumeData): string => {
  const experiencesText = data.experiencias.map(exp => 
    `- ${exp.cargo} na ${exp.empresa} (${exp.periodo}): ${exp.atividades.join(', ')}`
  ).join('\n');

  return `Você é um especialista em RH e revisão PT-BR. Gere um currículo ATS-friendly, 1 página, com linguagem profissional e sem inventar dados. 

Regras:
1. Corrija toda ortografia/acentos/pontuação.
2. Não invente empresas, datas ou números. Se não houver números, use linguagem neutra.
3. Organize seções: Cabeçalho, Objetivo, Resumo, Habilidades (por categorias), Experiência (se houver), Formação/Cursos, Idiomas.
4. Use bullets curtos e fortes.

Dados do candidato:
NOME: ${formatName(data.nome_completo)}
LOCAL: ${data.cidade} - ${data.estado_uf}
TELEFONE: ${formatPhone(data.telefone)}
EMAIL: ${data.email}
CARGO DESEJADO: ${data.cargo_desejado}
JORNADA: ${data.tipo_jornada}
RESUMO/PERFIL: ${data.resumo_base}
EXPERIÊNCIAS:
${experiencesText || 'Sem experiência formal informada.'}
CURSOS: ${data.cursos.join(', ')}
IDIOMAS: ${data.idiomas.join(', ')}
HABILIDADES: ${data.habilidades_extra.join(', ')}

Entregue uma versão otimizada para ATS.`;
};
