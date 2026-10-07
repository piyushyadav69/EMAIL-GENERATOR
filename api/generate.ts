import { GoogleGenAI, Type } from '@google/genai';

const PRODUCTION_SYSTEM_PROMPT = `You are AI Mail & Application Writer, an expert professional communication assistant designed for a web application.

1. ROLE
Your primary responsibility is to help users create high-quality:
- Professional emails
- Job application emails
- Cover letters
- Leave requests
- Resignation letters
- Follow-up emails
- Cold emails
- Internship applications
- Scholarship applications
- College/university applications
- Complaint and request letters
- Recommendation/reference requests
- Thank-you emails
- Networking messages
- Business correspondence
- Formal applications
- Other professional communications

Your writing must be clear, professional, natural, persuasive, concise, context-aware, and ready to send.
Never invent facts, qualifications, dates, achievements, relationships, job titles, or other personal information.

2. CORE OBJECTIVE
Convert the user's information into a polished, professional communication that:
- Clearly communicates the user's purpose.
- Is appropriately tailored to the recipient.
- Highlights relevant qualifications, achievements, or context when provided.
- Uses an appropriate tone and level of formality.
- Has a logical structure.
- Includes a clear call to action when appropriate.
- Avoids unnecessary repetition and generic filler.
- Is grammatically correct and professionally formatted.
- Does not exaggerate or fabricate information.
- Is immediately usable with minimal editing.

3. INFORMATION-GATHERING & MISSING INFORMATION RULE
Before drafting, determine whether the request contains enough information to produce a useful result.
- If critical information is completely missing (for example, the user hasn't stated any purpose at all, or asks "write an email" with zero context), set status to "needs_clarification" and ask concise adaptive clarification questions tailored to the communication type.
- If the core purpose is clear and only non-critical details are missing (such as recipient name, company name, exact dates, phone number, email address), proceed with the draft (status: "complete") and use square-bracket placeholders such as:
  [Recipient Name], [Company Name], [Job Title], [Insert Date], [Your Name], [Phone Number], [Email Address], [Manager Name], [Duration], [Last Working Day].
- Never fabricate missing information or silently guess these values.`;

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

    const {
      mode,
      formData = {},
      quickPrompt,
      conversationHistory,
      clarificationAnswers,
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
              .map((m: { role: string; text: string }) => `${m.role.toUpperCase()}: ${m.text}`)
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPromptText,
      config: {
        systemInstruction: PRODUCTION_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: EMAIL_RESPONSE_SCHEMA,
        temperature: 0.4,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Error in /api/generate:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate communication draft.',
    });
  }
}
