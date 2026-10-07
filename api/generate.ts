import { GoogleGenAI, Type } from '@google/genai';
import { composeStructuredDraft } from '../src/lib/mailComposerEngine';

const PRODUCTION_SYSTEM_PROMPT = `You are AI Mail & Application Writer, an expert professional communication assistant designed for a web application.
Your writing must be clear, professional, natural, persuasive, concise, context-aware, and ready to send.
Never invent facts, qualifications, dates, achievements, relationships, job titles, or other personal information. Use square-bracket placeholders such as [Recipient Name], [Company Name], [Insert Date], [Your Name] whenever non-critical details are missing.`;

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
    extractedFields: {
      type: Type.OBJECT,
      properties: {
        communicationType: { type: Type.STRING },
        recipientName: { type: Type.STRING },
        recipientRole: { type: Type.STRING },
        organization: { type: Type.STRING },
        purpose: { type: Type.STRING },
        keyPoints: { type: Type.STRING },
        tone: { type: Type.STRING },
      },
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
    mode = 'create',
    formData = {},
    quickPrompt = '',
    conversationHistory = [],
    clarificationAnswers = '',
  } = req.body || {};

  try {
    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.SECONDARY_GEMINI_API_KEY,
      process.env.DRAFT_API_KEY,
    ]
      .map((k) => (k || '').trim())
      .filter((k) => k && k !== 'MY_GEMINI_API_KEY' && k !== 'MY_SECONDARY_GEMINI_API_KEY');

    const userPromptText =
      mode === 'create'
        ? `MODE: Create New Communication
- Communication Type: ${formData.communicationType || 'Professional Email'}
- Recipient: ${formData.recipientName || '[Recipient Name]'} (${formData.recipientRole || ''}) at ${formData.organization || '[Company Name]'}
- Sender: ${formData.senderName || '[Your Name]'} (${formData.senderRole || ''})
- Background: ${formData.background || ''}
- Purpose: ${formData.purpose || ''}
- Key Points: ${formData.keyPoints || ''}
- Achievements: ${formData.achievements || ''}
- Dates: ${formData.dates || ''}
- Tone: ${formData.tone || 'Professional'}
- Length: ${formData.length || 'Standard Email'}
- Language: ${formData.language || 'English'}
${clarificationAnswers ? `\nClarification Details: ${clarificationAnswers}` : ''}`
        : mode === 'improve'
        ? `MODE: Improve Existing Draft
Draft:
"""
${formData.existingDraft || ''}
"""
Goals: ${(formData.improvementGoals || ['Clarity', 'Professionalism']).join(', ')}
Tone: ${formData.tone || 'Professional'}
Language: ${formData.language || 'English'}`
        : `MODE: Quick Write
Sender: ${formData?.senderName || '[Your Name]'} (${formData?.senderRole || ''})
Tone: ${formData?.tone || 'Professional'}
Language: ${formData?.language || 'English'}
Request: ${quickPrompt}
${clarificationAnswers ? `\nAdditional Details: ${clarificationAnswers}` : ''}
${Array.isArray(conversationHistory) && conversationHistory.length > 0 ? '' : ''}`;

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
            contents: userPromptText,
            config: {
              systemInstruction: PRODUCTION_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: EMAIL_RESPONSE_SCHEMA,
              temperature: 0.4,
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

    const fallbackDraft = composeStructuredDraft({
      mode,
      formData,
      quickPrompt,
      clarificationAnswers,
    });
    return res.status(200).json(fallbackDraft);
  } catch {
    const fallbackDraft = composeStructuredDraft({
      mode,
      formData,
      quickPrompt,
      clarificationAnswers,
    });
    return res.status(200).json(fallbackDraft);
  }
}
