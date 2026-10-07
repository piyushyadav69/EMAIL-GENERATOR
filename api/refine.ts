import { GoogleGenAI, Type } from '@google/genai';
import { refineStructuredDraftLocally } from '../src/lib/mailComposerEngine';

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

const MODEL_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    currentDraft,
    action = 'formal',
    customInstruction,
    tone,
    length,
    language,
  } = req.body || {};

  try {
    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.SECONDARY_GEMINI_API_KEY,
      process.env.DRAFT_API_KEY,
    ]
      .map((k) => (k || '').trim())
      .filter((k) => k && k !== 'MY_GEMINI_API_KEY' && k !== 'MY_SECONDARY_GEMINI_API_KEY');

    const prompt = `MODE: Targeted Draft Revision
Current Draft JSON:
${JSON.stringify(currentDraft, null, 2)}
Tone: ${tone || 'Professional'} | Length: ${length || 'Standard'} | Language: ${language || 'English'}
Instruction: ${customInstruction || action}`;

    for (const apiKey of apiKeys) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      for (const modelName of MODEL_CANDIDATES) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: PRODUCTION_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: EMAIL_RESPONSE_SCHEMA,
              temperature: 0.35,
            },
          });

          if (response.text?.trim()) {
            return res.status(200).json(JSON.parse(response.text));
          }
        } catch {
          // Continue to next model / key
        }
      }
    }

    const fallbackRefined = refineStructuredDraftLocally({
      currentDraft,
      action,
      customInstruction,
      tone,
    });
    return res.status(200).json(fallbackRefined);
  } catch {
    const fallbackRefined = refineStructuredDraftLocally({
      currentDraft,
      action,
      customInstruction,
      tone,
    });
    return res.status(200).json(fallbackRefined);
  }
}
