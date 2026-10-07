import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
- If critical information is completely missing (for example, the user hasn't stated any purpose at all, or asks "write an email" with zero context), set status to "needs_clarification" and ask concise adaptive clarification questions tailored to the communication type. Do not overwhelm the user with a long questionnaire.
- If the core purpose is clear and only non-critical details are missing (such as recipient name, company name, exact dates, phone number, email address), proceed with the draft (status: "complete") and use square-bracket placeholders such as:
  [Recipient Name], [Company Name], [Job Title], [Insert Date], [Your Name], [Phone Number], [Email Address], [Manager Name], [Duration], [Last Working Day].
- Never fabricate missing information or silently guess these values.

4. ADAPTIVE QUESTIONING PRIORITIES
Ask only what is relevant when clarification is needed or suggest optional enhancements:
- Job Applications: Job title, company, job description, relevant experience, skills, education, achievements, availability, why interested.
- Leave Requests: Leave dates, reason (if user wants to disclose), duration, work handover information.
- Resignation: Position, company, intended last working day, notice period, optional reason, appreciation message.
- Cold Emails: Recipient, company, reason for contacting, desired outcome, relevant background/value proposition.
- Follow-Ups: Previous interaction, original request, date of previous communication, desired next step.

5. WRITING PRINCIPLES & PERSONALIZATION
- Clarity: Straightforward language that is easy to understand.
- Professionalism: Maintain appropriate professional etiquette.
- Specificity: Use the user's actual information rather than generic statements. Avoid generic clichés like "I am writing to express my interest in your esteemed organization." Prefer specific language grounded in user inputs.
- Conciseness: Remove unnecessary words, repetition, clichés, and filler.
- Persuasion: Communicate value through relevant evidence rather than exaggerated claims.
- Natural Language: Sound human and authentic rather than robotic or overly formulaic.
- Action Orientation: Make the requested next step clear.
- Accuracy & Safety: Never fabricate qualifications, employment history, academic achievements, relationships, fake references, fake statistics, company policies, or dates. If asked to exaggerate or create false info, explain briefly in integrityNote that you strengthened the wording while keeping it truthful.

6. OUTPUT STRUCTURE MODES
- Standard Email / Correspondence:
  * 2-3 specific, short, professional, non-clickbait Subject Line options.
  * Professional salutation (e.g., "Dear [Recipient Name]," or "Dear Hiring Manager,").
  * Opening paragraph immediately establishing why the user is writing, relevant context, and purpose.
  * Core message / value proposition in short paragraphs with logical progression.
  * Call to action with a clear next step.
  * Professional sign-off ("Best regards,", "Sincerely,", etc.) and signature block.
- Cover Letter Mode:
  * Professional opening, position and company, relevant experience/background, key skills and achievements, why interested & strong fit, closing and call to action. Do not simply repeat a resume; prioritize relevance and evidence.
- Formal Application Mode:
  * Formal salutation, clear statement of purpose, relevant background, supporting details, specific request, respectful formal closing.

7. TONE & LENGTH ENGINE
- Adapt strictly to requested tone: Formal, Professional, Warm, Enthusiastic, Persuasive, Direct, Apologetic, Urgent. Default to Professional, warm, and concise if unspecified.
- Respect requested length:
  * Short message: ~50–120 words
  * Standard email: ~100–250 words
  * Cover letter: ~250–450 words
  * Formal application: minimum length necessary to communicate effectively.
  Never pad with fluff merely to reach a word count.

8. REWRITE & TRANSLATION MODES
- In Rewrite/Improve mode: Preserve original facts and intent. Improve grammar, vocabulary, flow, structure, professionalism, clarity, tone, and conciseness without introducing new claims.
- In Translation mode: Preserve meaning, intent, and appropriate formality; adapt idioms naturally; never add facts that were not present.`;

const EMAIL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      description:
        'Set to "complete" when a usable draft is generated (using [Placeholders] for non-critical missing info). Set to "needs_clarification" ONLY when the request lacks enough core purpose/context to write a meaningful draft.',
    },
    assistantMessage: {
      type: Type.STRING,
      description:
        'A brief, helpful 1-2 sentence message from the assistant. If status is needs_clarification, greet briefly and explain what critical context is needed. If complete, briefly note how the draft was tailored or if any truthfulness guardrails were applied.',
    },
    clarificationQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'If status is needs_clarification (or if 1-2 optional high-impact details could make the draft even stronger), list concise, communication-type-specific questions here.',
    },
    subjectOptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '2 to 3 clear, specific, professional subject line options. No clickbait.',
    },
    salutation: {
      type: Type.STRING,
      description: 'Professional salutation, e.g., "Dear [Recipient Name],"',
    },
    opening: {
      type: Type.STRING,
      description:
        'Opening paragraph immediately establishing purpose and relevant context.',
    },
    bodyParagraphs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Core message, value proposition, or supporting paragraphs in logical order.',
    },
    callToAction: {
      type: Type.STRING,
      description:
        'Clear next step or closing paragraph (e.g., requesting an interview, confirmation, or meeting).',
    },
    signOff: {
      type: Type.STRING,
      description: 'Professional closing phrase, e.g., "Best regards," or "Sincerely,"',
    },
    signatureBlock: {
      type: Type.STRING,
      description:
        'Multi-line signature block with sender name, role/qualification, phone, and email (using [Your Name], [Phone Number], etc. if not provided).',
    },
    placeholdersUsed: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Exact list of all square-bracket placeholders used anywhere in the subject or body, e.g. ["[Recipient Name]", "[Company Name]"].',
    },
    extractedFields: {
      type: Type.OBJECT,
      description:
        'Structured fields inferred or used from the user input so the UI can sync them.',
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
      description: 'Silent quality check results before returning the final draft.',
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

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  app.post('/api/generate', async (req, res) => {
    try {
      const {
        mode,
        formData,
        quickPrompt,
        conversationHistory,
        clarificationAnswers,
      } = req.body;

      const ai = getAiClient();

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
${clarificationAnswers ? `\nUser's Additional Clarification Answers:\n${clarificationAnswers}` : ''}
`;
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
Additional Instructions: ${formData.additionalInstructions || '(None)'}
`;
      } else {
        // Quick Write / Conversational Mode
        const historyStr = Array.isArray(conversationHistory) && conversationHistory.length > 0
          ? conversationHistory
              .map((m: { role: string; text: string }) => `${m.role.toUpperCase()}: ${m.text}`)
              .join('\n\n')
          : '';

        userPromptText = `MODE: Quick Write & Adaptive Conversation
Sender Profile Context (if saved by user):
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
${clarificationAnswers ? `\nUser's Answers to Clarification Questions:\n"""\n${clarificationAnswers}\n"""` : ''}

Instructions:
1. If the user's request has enough core purpose (e.g., "Write a leave request for 2 days because of a family function"), draft immediately (status: "complete") and use square-bracket placeholders ([Manager Name], [Start Date], [End Date], [Your Name], etc.) for missing details. Also list 1-2 optional adaptive questions in clarificationQuestions that could further personalize the draft if the user wishes.
2. Only set status to "needs_clarification" if the request is too vague or empty to know what to write (e.g. "Hi", "Help me write an email" with no subject or purpose).`;
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

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/generate:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate communication draft.',
      });
    }
  });

  app.post('/api/refine', async (req, res) => {
    try {
      const { currentDraft, action, customInstruction, tone, length, language } = req.body;
      const ai = getAiClient();

      const actionDescriptions: Record<string, string> = {
        shorten: 'Make it shorter: preserve meaning and key points while reducing length and removing any non-essential words.',
        formal: 'Make it more professional and formal: improve clarity, structure, and executive formality.',
        persuasive: 'Make it stronger and more persuasive: emphasize value and clear evidence without inventing achievements or exaggerating.',
        warmer: 'Make it warmer: increase natural friendliness and personability while remaining professionally appropriate.',
        confident: 'Make it more confident: use assertive, direct language without arrogance or fabrication.',
        simpler: 'Make it simpler: use clearer vocabulary and shorter, easy-to-scan sentences.',
        human: 'Make it more natural and human: remove robotic, stiff, or overly formulaic phrasing.',
        grammar: 'Fix grammar and flow only: polish grammar, punctuation, and sentence transitions without changing the core wording unnecessarily.',
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

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/refine:', error);
      res.status(500).json({
        error: error?.message || 'Failed to refine draft.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Mail & Application Writer server listening on http://localhost:${PORT}`);
  });
}

startServer();
