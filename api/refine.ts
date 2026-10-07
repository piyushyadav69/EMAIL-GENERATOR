import { GoogleGenAI, Type } from '@google/genai';

const PRODUCTION_SYSTEM_PROMPT = `You are AI Mail & Application Writer, an expert professional communication assistant.
Preserve all original facts, names, dates, and square-bracket placeholders when refining or translating a draft. Never invent qualifications, statistics, or claims.`;

const EMAIL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING },
    assistantMessage: { type: Type.STRING },
    clarificationQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    subjectOptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    salutation: { type: Type.STRING },
    opening: { type: Type.STRING },
    bodyParagraphs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    callToAction: { type: Type.STRING },
    signOff: { type: Type.STRING },
    signatureBlock: { type: Type.STRING },
    placeholdersUsed: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    qualityVerification: {
      type: Type.OBJECT,
      properties: {
        toneApplied: { type: Type.STRING },
        structureMode: { type: Type.STRING },
        zeroFabricationVerified: { type: Type.BOOLEAN },
        integrityNote: { type: Type.STRING },
      },
    },
  },
  required: [
    'status',
    'assistantMessage',
    'clarificationQuestions',
    'subjectOptions',
    'salutation',
    'opening',
    'bodyParagraphs',
    'callToAction',
    'signOff',
    'signatureBlock',
    'placeholdersUsed',
  ],
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured in Vercel Project Settings.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const { currentDraft, action, customInstruction, tone, length, language } = req.body || {};

    const actionDescriptions: Record<string, string> = {
      shorten:
        'Make it shorter: preserve meaning and key points while reducing length and removing any non-essential words.',
      formal:
        'Make it more professional and formal: improve clarity, structure, and executive formality.',
      persuasive:
        'Make it stronger and more persuasive: emphasize value and clear evidence without inventing achievements or exaggerating.',
      warmer:
        'Make it warmer: increase natural friendliness and personability while remaining professionally appropriate.',
      confident:
        'Make it more confident: use assertive, direct language without arrogance or fabrication.',
      simpler:
        'Make it simpler: use clearer vocabulary and shorter, easy-to-scan sentences.',
      human:
        'Make it more natural and human: remove robotic, stiff, or overly formulaic phrasing.',
      grammar:
        'Fix grammar and flow only: polish grammar, punctuation, and sentence transitions without changing the core wording unnecessarily.',
    };

    const instructionText =
      customInstruction ||
      actionDescriptions[action] ||
      `Refine the draft according to: ${action}`;

    const prompt = `MODE: Targeted Draft Revision
Revise the existing draft below according to the user's specific instruction.
CRITICAL: Preserve all existing facts, names, dates, and square-bracket placeholders. Never invent new qualifications, statistics, or claims.

Current Draft JSON:
${JSON.stringify(currentDraft, null, 2)}

Target Controls:
- Tone: ${tone || 'Professional'}
- Length: ${length || 'Appropriate to content'}
- Language: ${language || 'English'}

Revision Instruction:
${instructionText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: PRODUCTION_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: EMAIL_RESPONSE_SCHEMA,
        temperature: 0.35,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Error in /api/refine:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to refine draft.',
    });
  }
}
