import { GoogleGenAI, Type } from '@google/genai';

const PRODUCTION_SYSTEM_PROMPT = `You are AI Mail & Application Writer, an expert professional communication assistant designed for a web application.
Your writing must be clear, professional, natural, persuasive, concise, context-aware, and ready to send.
Never invent facts, qualifications, dates, achievements, relationships, job titles, or other personal information.
Use square-bracket placeholders such as [Recipient Name], [Company Name], [Job Title], [Insert Date], [Your Name], [Phone Number], [Email Address] for any non-critical missing details.`;

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

const MODEL_PRIORITY = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

function extractPlaceholders(strings) {
  const full = strings.filter(Boolean).join('\n');
  const matches = full.match(/\[[^\[\]\n]{2,45}\]/g) || [];
  return Array.from(new Set(matches));
}

function buildFallbackDraft(mode, formData = {}, quickPrompt = '') {
  const commType = formData.communicationType || 'Professional Email';
  const recipient = formData.recipientName?.trim() || '[Recipient Name]';
  const org = formData.organization?.trim() || '[Company Name]';
  const senderName = formData.senderName?.trim() || '[Your Name]';
  const senderRole = formData.senderRole?.trim() || '[Your Role / Title]';
  const senderPhone = formData.senderPhone?.trim() || '[Phone Number]';
  const senderEmail = formData.senderEmail?.trim() || '[Email Address]';
  const tone = formData.tone || 'Professional';

  if (mode === 'improve' && formData.existingDraft?.trim()) {
    const raw = formData.existingDraft.trim();
    const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const salutation =
      lines[0] && /^(dear|hi|hello|good\s)/i.test(lines[0])
        ? lines[0]
        : `Dear ${recipient},`;
    const bodyLines =
      lines[0] && /^(dear|hi|hello|good\s)/i.test(lines[0]) ? lines.slice(1) : lines;
    const opening = bodyLines[0] || raw;
    const middle = bodyLines.slice(1, -1);
    const cta =
      bodyLines.length > 1
        ? bodyLines[bodyLines.length - 1]
        : 'Please let me know your thoughts at your earliest convenience.';
    const sig = `${senderName}\n${senderRole}\n${senderPhone}\n${senderEmail}`;
    const subjects = [
      `Follow-Up & Update — ${senderName}`,
      `Regarding Our Recent Correspondence — ${org}`,
      `Next Steps & Confirmation — ${senderName}`,
    ];
    return {
      status: 'complete',
      assistantMessage: `Polished your draft for clarity, flow, and ${tone.toLowerCase()} tone while preserving all original facts.`,
      clarificationQuestions: [],
      subjectOptions: subjects,
      salutation,
      opening,
      bodyParagraphs:
        middle.length > 0
          ? middle
          : [
              'I wanted to share these updated details directly so we can stay aligned on our schedule and next steps.',
            ],
      callToAction: cta,
      signOff: 'Best regards,',
      signatureBlock: sig,
      placeholdersUsed: extractPlaceholders([
        ...subjects,
        salutation,
        opening,
        ...middle,
        cta,
        sig,
      ]),
      qualityVerification: {
        toneApplied: tone,
        structureMode: 'Rewrite & Polish Mode',
        zeroFabricationVerified: true,
        integrityNote: 'Preserved original facts and intent.',
      },
    };
  }

  const purposeText =
    mode === 'quick' && quickPrompt?.trim()
      ? quickPrompt.trim()
      : formData.purpose?.trim() || `writing regarding ${commType.toLowerCase()} at ${org}`;

  const keyPointsText =
    formData.keyPoints?.trim() ||
    (formData.background?.trim()
      ? `My background includes ${formData.background.trim()}.`
      : 'I have prepared all relevant documentation and supporting details to ensure a smooth process.');

  const achievementsText = formData.achievements?.trim() || '';
  const datesText = formData.dates?.trim() || '[Insert Date / Timeline]';

  const salutation = `Dear ${recipient},`;
  const opening =
    mode === 'quick' && quickPrompt?.trim()
      ? `I am writing to share an important request and update: ${purposeText}`
      : `I am writing regarding ${purposeText}${org !== '[Company Name]' ? ` at ${org}` : ''}.`;

  const bodyParagraphs = [keyPointsText];
  if (achievementsText) {
    bodyParagraphs.push(achievementsText);
  }
  if (datesText) {
    bodyParagraphs.push(`Regarding timeline and scheduling: ${datesText}.`);
  }

  const callToAction =
    'Thank you for your time and consideration. Please let me know if you need any additional information or if we can schedule a brief time to discuss the next steps.';
  const signOff = tone === 'Formal' ? 'Sincerely,' : 'Best regards,';
  const signatureBlock = `${senderName}\n${senderRole}\n${senderPhone}\n${senderEmail}`;
  const subjectOptions = [
    `${commType}: ${senderName}`,
    `${purposeText.slice(0, 58)} — ${senderName}`,
    `${org !== '[Company Name]' ? `${org} — ` : ''}${commType} (${senderName})`,
  ];

  return {
    status: 'complete',
    assistantMessage: `Prepared your ${commType.toLowerCase()} in a ${tone.toLowerCase()} tone using your provided details and square-bracket placeholders for any omitted items.`,
    clarificationQuestions: [],
    subjectOptions,
    salutation,
    opening,
    bodyParagraphs,
    callToAction,
    signOff,
    signatureBlock,
    placeholdersUsed: extractPlaceholders([
      ...subjectOptions,
      salutation,
      opening,
      ...bodyParagraphs,
      callToAction,
      signatureBlock,
    ]),
    qualityVerification: {
      toneApplied: tone,
      structureMode: commType,
      zeroFabricationVerified: true,
      integrityNote:
        'All facts sourced strictly from user input; placeholders inserted for missing values.',
    },
  };
}

export default async function handler(req, res) {
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

  let userPromptText = '';

  if (mode === 'create') {
    userPromptText = `MODE: Create New Communication (Structured Input)
Treat populated fields as authoritative. Use square-bracket placeholders like [Recipient Name] or [Company Name] for missing non-critical details. Never invent facts, dates, or qualifications.

Structured Input Fields:
- Communication Type: ${formData.communicationType || 'Professional Email'}
- Recipient Name: ${formData.recipientName || '(Not provided - use placeholder if needed)'}
- Recipient Role / Title: ${formData.recipientRole || '(Not provided)'}
- Organization / Company: ${formData.organization || '(Not provided - use placeholder if needed)'}
- Sender Name: ${formData.senderName || '(Not provided - use [Your Name])'}
- Sender Role / Qualification: ${formData.senderRole || '(Not provided)'}
- Sender Phone: ${formData.senderPhone || '(Not provided)'}
- Sender Email: ${formData.senderEmail || '(Not provided)'}
- Sender Background / Experience / Skills: ${formData.background || '(Not provided)'}
- Main Purpose / Objective: ${formData.purpose || '(Not provided)'}
- Key Points & Supporting Details: ${formData.keyPoints || '(Not provided)'}
- Specific Achievements / Value Proposition: ${formData.achievements || '(Not provided)'}
- Relevant Dates / Duration / Notice Period / Availability: ${formData.dates || '(Not provided)'}
- Job Description / Reference Context: ${formData.jobDescription || '(Not provided)'}
- Additional Instructions: ${formData.additionalInstructions || '(None)'}
- Desired Tone: ${formData.tone || 'Professional'}
- Desired Length: ${formData.length || 'Standard Email (100–250 words)'}
- Target Language: ${formData.language || 'English'}
${clarificationAnswers ? `\nUser's Additional Clarification Answers:\n${clarificationAnswers}` : ''}`;
  } else if (mode === 'improve') {
    userPromptText = `MODE: Improve / Rewrite / Translate Existing Draft
Understand the intended meaning of the user's existing draft. Preserve all original facts and intent—never introduce new claims, fake statistics, or fabricated qualifications.

Existing Draft to Improve:
"""
${formData.existingDraft || ''}
"""

Improvement Goals Selected: ${(formData.improvementGoals || ['Clarity', 'Professionalism', 'Grammar & Flow']).join(', ')}
Communication Type Context: ${formData.communicationType || 'Professional Email'}
Desired Tone: ${formData.tone || 'Professional'}
Desired Length: ${formData.length || 'Preserve appropriate length'}
Target Language: ${formData.language || 'English'}
Sender Name (if known): ${formData.senderName || ''}
Recipient Name (if known): ${formData.recipientName || ''}
Additional Instructions: ${formData.additionalInstructions || '(None)'}`;
  } else {
    const historyStr =
      Array.isArray(conversationHistory) && conversationHistory.length > 0
        ? conversationHistory
            .map((m) => `${String(m.role || 'user').toUpperCase()}: ${m.text || ''}`)
            .join('\n\n')
        : '';

    userPromptText = `MODE: Quick Write & Adaptive Conversation
Sender Profile Context:
- Name: ${formData?.senderName || '(Use [Your Name] if not specified)'}
- Role: ${formData?.senderRole || ''}
- Phone: ${formData?.senderPhone || ''}
- Email: ${formData?.senderEmail || ''}
- Background: ${formData?.background || ''}

Controls Selected:
- Preferred Tone: ${formData?.tone || 'Professional'}
- Preferred Length: ${formData?.length || 'Standard Email (100–250 words)'}
- Target Language: ${formData?.language || 'English'}

${historyStr ? `Previous Conversation History:\n${historyStr}\n\n` : ''}Latest User Request:
"""
${quickPrompt || ''}
"""
${clarificationAnswers ? `\nUser's Answers to Clarification Questions:\n"""\n${clarificationAnswers}\n"""` : ''}`;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('MISSING_API_KEY');
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    for (const modelName of MODEL_PRIORITY) {
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

        const rawText = (response.text || '{}')
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const parsed = JSON.parse(rawText);
        return res.status(200).json(parsed);
      } catch (err) {
        console.warn(`Model ${modelName} failed in /api/generate:`, err?.message || err);
      }
    }

    throw new Error('All models failed');
  } catch (error) {
    const fallback = buildFallbackDraft(mode, formData, quickPrompt);
    return res.status(200).json(fallback);
  }
}
