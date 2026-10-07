export type WorkspaceMode = 'create' | 'improve' | 'quick' | 'templates';

export type CommunicationType =
  | 'Job Application Email'
  | 'Cover Letter'
  | 'Leave Request'
  | 'Resignation Letter'
  | 'Follow-up Email'
  | 'Cold Email'
  | 'Professional Email'
  | 'Internship Application'
  | 'Scholarship Application'
  | 'College/University Application'
  | 'Complaint & Request Letter'
  | 'Recommendation/Reference Request'
  | 'Thank-You Email'
  | 'Networking Message'
  | 'Business Correspondence'
  | 'Formal Application';

export type ToneOption =
  | 'Professional'
  | 'Formal'
  | 'Warm'
  | 'Enthusiastic'
  | 'Persuasive'
  | 'Direct'
  | 'Apologetic'
  | 'Urgent';

export type LengthOption =
  | 'Short Message (50–120 words)'
  | 'Standard Email (100–250 words)'
  | 'Cover Letter (250–450 words)'
  | 'Formal Application (Concise & Complete)';

export interface SenderProfile {
  senderName: string;
  senderRole: string;
  senderPhone: string;
  senderEmail: string;
  background: string;
}

export interface CommunicationFormData extends SenderProfile {
  communicationType: CommunicationType;
  recipientName: string;
  recipientRole: string;
  organization: string;
  purpose: string;
  keyPoints: string;
  achievements: string;
  dates: string;
  tone: ToneOption;
  length: LengthOption;
  language: string;
  jobDescription: string;
  existingDraft: string;
  improvementGoals: string[];
  additionalInstructions: string;
}

export interface GeneratedDraft {
  status: 'complete' | 'needs_clarification';
  assistantMessage: string;
  clarificationQuestions: string[];
  subjectOptions: string[];
  salutation: string;
  opening: string;
  bodyParagraphs: string[];
  callToAction: string;
  signOff: string;
  signatureBlock: string;
  placeholdersUsed: string[];
  extractedFields?: Partial<CommunicationFormData>;
  qualityVerification?: {
    toneApplied: string;
    structureMode: string;
    zeroFabricationVerified: boolean;
    integrityNote?: string;
  };
}

export interface SavedDraftItem {
  id: string;
  title: string;
  communicationType: CommunicationType;
  tone: ToneOption;
  createdAt: string;
  draft: GeneratedDraft;
  selectedSubjectIndex: number;
}

export interface AdaptiveFieldConfig {
  type: CommunicationType;
  category: 'Career & Academic' | 'Workplace & HR' | 'Outreach & Business';
  description: string;
  defaultLength: LengthOption;
  defaultTone: ToneOption;
  purposeLabel: string;
  purposePlaceholder: string;
  keyPointsLabel: string;
  keyPointsPlaceholder: string;
  datesLabel?: string;
  datesPlaceholder?: string;
  achievementsLabel?: string;
  achievementsPlaceholder?: string;
  showJobDescription?: boolean;
  jobDescriptionLabel?: string;
  jobDescriptionPlaceholder?: string;
  adaptiveChecklist: string[];
}

export const ADAPTIVE_CONFIGS: Record<CommunicationType, AdaptiveFieldConfig> = {
  'Job Application Email': {
    type: 'Job Application Email',
    category: 'Career & Academic',
    description: 'Concise hiring manager email introducing your candidacy and attached resume.',
    defaultLength: 'Standard Email (100–250 words)',
    defaultTone: 'Professional',
    purposeLabel: 'Target Job Title & Why You Are Applying',
    purposePlaceholder: 'e.g., Applying for Senior Frontend Engineer (Req #4082); excited by your design system architecture',
    keyPointsLabel: 'Relevant Experience, Core Skills & Education',
    keyPointsPlaceholder: 'e.g., 5 years in React/TypeScript, led migration of 40+ components, BS in Computer Science',
    achievementsLabel: 'Key Measurable Achievements',
    achievementsPlaceholder: 'e.g., Reduced bundle size by 34% and improved checkout conversion by 11%',
    datesLabel: 'Interview Availability / Notice Period',
    datesPlaceholder: 'e.g., Available immediately for interviews; 2-week notice period',
    showJobDescription: true,
    jobDescriptionLabel: 'Job Description or Posting Highlights (Optional)',
    jobDescriptionPlaceholder: 'Paste key requirements from the job description so the email aligns directly with them...',
    adaptiveChecklist: [
      'Job title & target company',
      'Relevant experience & core skills',
      'Specific measurable achievement',
      'Availability & why you are interested',
    ],
  },
  'Cover Letter': {
    type: 'Cover Letter',
    category: 'Career & Academic',
    description: 'Structured narrative connecting your track record and evidence to the role.',
    defaultLength: 'Cover Letter (250–450 words)',
    defaultTone: 'Confident' as ToneOption,
    purposeLabel: 'Position Applied For & Core Fit Statement',
    purposePlaceholder: 'e.g., Product Manager role at Stripe; combining 6 years of B2B payments experience with developer API design',
    keyPointsLabel: 'Relevant Background, Domain Skills & Why This Company',
    keyPointsPlaceholder: 'e.g., Built merchant onboarding workflows; deeply admire your focus on global settlement reliability',
    achievementsLabel: 'Standout Career Achievements & Evidence (Do not just repeat resume)',
    achievementsPlaceholder: 'e.g., Scaled self-serve onboarding from $4M to $18M ARR across 14 markets in 18 months',
    datesLabel: 'Start Date Availability',
    datesPlaceholder: 'e.g., Available to start in November 2026',
    showJobDescription: true,
    jobDescriptionLabel: 'Job Description / Role Requirements',
    jobDescriptionPlaceholder: 'Paste the job description to tailor evidence and terminology...',
    adaptiveChecklist: [
      'Position and company name',
      'Relevant experience & evidence (beyond resume bullet repetition)',
      'Why you are interested in this specific organization',
      'Why you are a strong fit',
    ],
  },
  'Leave Request': {
    type: 'Leave Request',
    category: 'Workplace & HR',
    description: 'Clear time-off notification with duration and work handover plan.',
    defaultLength: 'Short Message (50–120 words)',
    defaultTone: 'Professional',
    purposeLabel: 'Type of Leave & Reason (Optional to disclose)',
    purposePlaceholder: 'e.g., Annual personal leave for a family function / medical appointment',
    keyPointsLabel: 'Work Handover & Coverage Plan',
    keyPointsPlaceholder: 'e.g., All Q4 sprint deliverables will be completed before Friday; Priya Nair will cover urgent client escalations',
    datesLabel: 'Leave Dates & Total Duration (Critical)',
    datesPlaceholder: 'e.g., October 19 to October 21, 2026 (3 working days), returning October 22',
    adaptiveChecklist: [
      'Exact leave dates & return date',
      'Total duration',
      'Reason (if you choose to disclose)',
      'Work handover & colleague coverage details',
    ],
  },
  'Resignation Letter': {
    type: 'Resignation Letter',
    category: 'Workplace & HR',
    description: 'Respectful formal notice of departure with last working day and transition commitment.',
    defaultLength: 'Standard Email (100–250 words)',
    defaultTone: 'Formal',
    purposeLabel: 'Current Position & Resignation Statement',
    purposePlaceholder: 'e.g., Resigning from my position as Lead Data Analyst at Meridian Health',
    keyPointsLabel: 'Transition Plan & Appreciation Message to Employer',
    keyPointsPlaceholder: 'e.g., Grateful for the mentorship over the past 3 years; committed to documenting all ETL pipelines and training my replacement',
    datesLabel: 'Intended Last Working Day & Notice Period (Critical)',
    datesPlaceholder: 'e.g., 4-week notice period; final working day will be November 6, 2026',
    adaptiveChecklist: [
      'Current position & company',
      'Intended last working day & notice period',
      'Optional reason for leaving',
      'Appreciation message & handover commitment',
    ],
  },
  'Follow-up Email': {
    type: 'Follow-up Email',
    category: 'Outreach & Business',
    description: 'Polite, action-oriented follow-up referencing a prior conversation or application.',
    defaultLength: 'Short Message (50–120 words)',
    defaultTone: 'Warm',
    purposeLabel: 'Original Request & Desired Next Step',
    purposePlaceholder: 'e.g., Following up on our Q4 enterprise licensing proposal to confirm security review sign-off',
    keyPointsLabel: 'Previous Interaction Context & Any New Updates',
    keyPointsPlaceholder: 'e.g., Spoke during Tuesday’s technical walkthrough; attached the requested SOC2 Type II compliance addendum',
    datesLabel: 'Date of Previous Communication / Target Timeline',
    datesPlaceholder: 'e.g., Last spoke on October 1, 2026; hoping to finalize before October 15',
    adaptiveChecklist: [
      'Previous interaction context',
      'Date of previous communication',
      'Original request or value reminder',
      'Clear desired next step',
    ],
  },
  'Cold Email': {
    type: 'Cold Email',
    category: 'Outreach & Business',
    description: 'High-relevance outreach focused on specific recipient context and concrete value.',
    defaultLength: 'Short Message (50–120 words)',
    defaultTone: 'Persuasive',
    purposeLabel: 'Reason for Contacting & Desired Outcome (CTA)',
    purposePlaceholder: 'e.g., Reaching out after reading your engineering post on multi-region caching; proposing a 15-minute architecture exchange',
    keyPointsLabel: 'Value Proposition & Relevant Background',
    keyPointsPlaceholder: 'e.g., We helped two similar fintech teams cut read tail-latency by 42% without changing their Postgres schema',
    achievementsLabel: 'Specific Evidence / Credibility Proof',
    achievementsPlaceholder: 'e.g., Benchmark report from our recent deployment at 40k RPS',
    adaptiveChecklist: [
      'Recipient name, role & company',
      'Specific reason for contacting them now',
      'Concrete value proposition (no generic hype)',
      'Low-friction desired outcome',
    ],
  },
  'Professional Email': {
    type: 'Professional Email',
    category: 'Outreach & Business',
    description: 'Clear day-to-day workplace or client email with structured action items.',
    defaultLength: 'Standard Email (100–250 words)',
    defaultTone: 'Professional',
    purposeLabel: 'Main Objective of the Email',
    purposePlaceholder: 'e.g., Sharing the updated Q4 product roadmap and requesting stakeholder sign-off by Thursday',
    keyPointsLabel: 'Key Points, Decisions & Supporting Context',
    keyPointsPlaceholder: 'e.g., 1. Prioritized SSO integration for November release; 2. Deferred mobile offline sync to Q1; 3. Need QA resource confirmation',
    datesLabel: 'Deadlines or Meeting Times',
    datesPlaceholder: 'e.g., Feedback requested by Thursday, Oct 10 at 5:00 PM EST',
    adaptiveChecklist: [
      'Clear statement of purpose',
      'Recipient & shared context',
      'Structured key points',
      'Specific call to action or deadline',
    ],
  },
  'Internship Application': {
    type: 'Internship Application',
    category: 'Career & Academic',
    description: 'Targeted student or early-career application highlighting coursework, projects, and availability.',
    defaultLength: 'Standard Email (100–250 words)',
    defaultTone: 'Enthusiastic',
    purposeLabel: 'Internship Role & Term',
    purposePlaceholder: 'e.g., Summer 2027 Robotics Software Engineering Internship',
    keyPointsLabel: 'Education, Relevant Coursework & Projects',
    keyPointsPlaceholder: 'e.g., Junior in Mechanical & CS at Georgia Tech (3.9 GPA); built ROS2 autonomous navigation stack for campus rover',
    achievementsLabel: 'Hackathons, Research or Leadership Highlights',
    achievementsPlaceholder: 'e.g., 1st place at IEEE SoutheastCon Autonomous Challenge',
    datesLabel: 'Internship Availability Dates',
    datesPlaceholder: 'e.g., Available full-time from May 15 to August 20, 2027',
    showJobDescription: true,
    jobDescriptionLabel: 'Internship Posting Details (Optional)',
    jobDescriptionPlaceholder: 'Paste internship requirements or lab focus areas...',
    adaptiveChecklist: [
      'Internship title, term & organization',
      'University, major & relevant projects',
      'Availability window',
      'Specific interest in the team',
    ],
  },
  'Scholarship Application': {
    type: 'Scholarship Application',
    category: 'Career & Academic',
    description: 'Formal scholarship statement aligning academic merit, purpose, and impact.',
    defaultLength: 'Cover Letter (250–450 words)',
    defaultTone: 'Formal',
    purposeLabel: 'Scholarship Name & Academic Program',
    purposePlaceholder: 'e.g., Global Clean Energy Fellowship for MS in Sustainable Systems',
    keyPointsLabel: 'Academic Background, Financial/Research Context & Goals',
    keyPointsPlaceholder: 'e.g., First-generation graduate student researching grid-scale sodium-ion storage; thesis fieldwork in rural microgrids',
    achievementsLabel: 'Academic Honors, Publications & Community Service',
    achievementsPlaceholder: 'e.g., Published co-authored paper in Journal of Power Sources; mentored 30 undergraduate STEM students',
    adaptiveChecklist: [
      'Scholarship name & awarding committee',
      'Academic background & research/career goals',
      'Concrete achievements & community impact',
      'How the scholarship enables your next milestone',
    ],
  },
  'College/University Application': {
    type: 'College/University Application',
    category: 'Career & Academic',
    description: 'Admissions inquiry or formal application correspondence to faculty or admissions offices.',
    defaultLength: 'Cover Letter (250–450 words)',
    defaultTone: 'Formal',
    purposeLabel: 'Degree Program, Term & Purpose',
    purposePlaceholder: 'e.g., Fall 2027 Master of Architecture Admission / Prospective Doctoral Advisor Inquiry',
    keyPointsLabel: 'Academic Preparation, Research Fit & Faculty Alignment',
    keyPointsPlaceholder: 'e.g., Completed undergraduate thesis on timber-hybrid acoustics; keen to contribute to Prof. Lindqvist’s Urban Materiality Lab',
    achievementsLabel: 'Academic & Portfolio Highlights',
    achievementsPlaceholder: 'e.g., Dean’s List all 8 semesters; national finalist in Timber Design Competition',
    adaptiveChecklist: [
      'Program name & university',
      'Academic preparation & research alignment',
      'Specific faculty or lab connection',
      'Clear inquiry or application purpose',
    ],
  },
  'Complaint & Request Letter': {
    type: 'Complaint & Request Letter',
    category: 'Outreach & Business',
    description: 'Firm, factual, and professional resolution request with documented facts.',
    defaultLength: 'Standard Email (100–250 words)',
    defaultTone: 'Direct',
    purposeLabel: 'Issue Summary & Reference / Account / Order Number',
    purposePlaceholder: 'e.g., Delayed enterprise server delivery under Purchase Order #PO-88412',
    keyPointsLabel: 'Chronological Facts & Business Impact',
    keyPointsPlaceholder: 'e.g., Ordered on Sept 10 with guaranteed 10-day SLA; delivery is now 14 days overdue, delaying our Frankfurt data center migration',
    datesLabel: 'Desired Resolution Deadline & Specific Remedy Requested',
    datesPlaceholder: 'e.g., Requesting expedited air freight tracking by Oct 9 or full SLA penalty credit',
    adaptiveChecklist: [
      'Account, invoice, or reference number',
      'Objective timeline of facts',
      'Specific resolution requested',
      'Reasonable deadline for response',
    ],
  },
  'Recommendation/Reference Request': {
    type: 'Recommendation/Reference Request',
    category: 'Career & Academic',
    description: 'Thoughtful request asking a manager, professor, or client for a strong reference.',
    defaultLength: 'Standard Email (100–250 words)',
    defaultTone: 'Warm',
    purposeLabel: 'What the Recommendation Is For (Role / Program)',
    purposePlaceholder: 'e.g., Application for MBA program at INSEAD / Senior Staff Engineer role at Datadog',
    keyPointsLabel: 'Shared Projects or Context to Remind the Recommender',
    keyPointsPlaceholder: 'e.g., Our 2025 cloud cost optimization initiative where we reduced monthly AWS spend by $45k',
    datesLabel: 'Submission Deadline & Format',
    datesPlaceholder: 'e.g., Portal link due by November 1, 2026; happy to share my updated resume and bullet summary',
    adaptiveChecklist: [
      'Target opportunity or program',
      'Shared projects/achievements to jog their memory',
      'Submission deadline & process',
      'Gracious offer to provide supporting materials',
    ],
  },
  'Thank-You Email': {
    type: 'Thank-You Email',
    category: 'Outreach & Business',
    description: 'Post-interview, post-meeting, or mentorship appreciation note.',
    defaultLength: 'Short Message (50–120 words)',
    defaultTone: 'Warm',
    purposeLabel: 'Occasion for Thanking the Recipient',
    purposePlaceholder: 'e.g., Thank you for today’s panel interview for the Lead Product Designer role',
    keyPointsLabel: 'Specific Conversation Highlight & Follow-Through',
    keyPointsPlaceholder: 'e.g., Enjoyed discussing how your team balances design tokens across web and iOS; reinforced my excitement to contribute',
    datesLabel: 'Date of Meeting / Next Steps Mentioned',
    datesPlaceholder: 'e.g., Spoke this morning (Oct 7); looking forward to the design critique round next week',
    adaptiveChecklist: [
      'Specific meeting or interview referenced',
      'One memorable topic discussed',
      'Reiterated enthusiasm or value',
      'Warm professional sign-off',
    ],
  },
  'Networking Message': {
    type: 'Networking Message',
    category: 'Outreach & Business',
    description: 'Authentic professional connection request for alumni, peers, or industry leaders.',
    defaultLength: 'Short Message (50–120 words)',
    defaultTone: 'Warm',
    purposeLabel: 'Shared Connection / Context & Reason for Reaching Out',
    purposePlaceholder: 'e.g., Fellow UW CSE alum transitioning into climate-tech product management; admired your talk at ClimateWeek',
    keyPointsLabel: 'Your Background & Specific Question / Coffee Chat Request',
    keyPointsPlaceholder: 'e.g., Spent 3 years in industrial IoT telemetry; would love a 15-minute virtual coffee to hear how you navigated utility partnerships',
    adaptiveChecklist: [
      'Shared context or genuine point of connection',
      'Concise 1-sentence background',
      'Specific, low-pressure ask (e.g. 15-min chat or 1 question)',
    ],
  },
  'Business Correspondence': {
    type: 'Business Correspondence',
    category: 'Outreach & Business',
    description: 'Executive vendor, partnership, legal, or stakeholder communication.',
    defaultLength: 'Standard Email (100–250 words)',
    defaultTone: 'Formal',
    purposeLabel: 'Business Matter / Contract / Partnership Objective',
    purposePlaceholder: 'e.g., Annual Master Services Agreement renewal and volume tier adjustment for FY2027',
    keyPointsLabel: 'Commercial Terms, Context & Proposed Terms',
    keyPointsPlaceholder: 'e.g., Expanding seat count from 150 to 250 licenses; requesting 15% multi-year lock-in discount',
    datesLabel: 'Effective Date / Renewal Deadline',
    datesPlaceholder: 'e.g., Current term expires November 30, 2026; aiming to execute addendum by November 10',
    adaptiveChecklist: [
      'Recipient & organization details',
      'Commercial or operational objective',
      'Key terms or supporting numbers',
      'Clear next step and timeline',
    ],
  },
  'Formal Application': {
    type: 'Formal Application',
    category: 'Workplace & HR',
    description: 'Official institutional request (transfer, grant, NOC, administrative approval).',
    defaultLength: 'Formal Application (Concise & Complete)',
    defaultTone: 'Formal',
    purposeLabel: 'Exact Formal Request / Subject of Application',
    purposePlaceholder: 'e.g., Request for Internal Department Transfer to Munich R&D Office / No Objection Certificate (NOC)',
    keyPointsLabel: 'Relevant Background, Justification & Supporting Details',
    keyPointsPlaceholder: 'e.g., Completed 2.5 years in current role with Exceeds Expectations ratings; relocating to Munich in January 2027',
    datesLabel: 'Requested Effective Date',
    datesPlaceholder: 'e.g., Effective January 11, 2027',
    adaptiveChecklist: [
      'Formal salutation & recipient title',
      'Unambiguous statement of purpose',
      'Factual justification & supporting details',
      'Specific formal request & respectful closing',
    ],
  },
};

export const TONE_DESCRIPTIONS: Record<ToneOption, string> = {
  Professional: 'Polished, natural, confident, and business-appropriate.',
  Formal: 'Respectful, structured, and traditionally executive.',
  Warm: 'Professional yet personable, approachable, and friendly.',
  Enthusiastic: 'Positive, energetic, and confident without exaggeration.',
  Persuasive: 'Focused on benefits, evidence, and a compelling call to action.',
  Direct: 'Concise, clear, and immediately action-oriented.',
  Apologetic: 'Sincere, respectful, and accountable without excessive self-criticism.',
  Urgent: 'Clear and appropriately time-sensitive without sounding aggressive.',
};

export const SUPPORTED_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Japanese',
  'Portuguese',
  'Italian',
  'Arabic',
  'Mandarin Chinese',
  'Korean',
  'Dutch',
];

export const IMPROVEMENT_GOALS = [
  'Grammar & Flow',
  'Professionalism',
  'Clarity',
  'Conciseness',
  'Persuasive Impact',
  'Natural Human Phrasing',
  'Executive Formality',
  'Warmth & Tact',
];

export interface StarterPreset {
  id: string;
  label: string;
  mode: 'create' | 'improve' | 'quick';
  category: string;
  summary: string;
  formData?: Partial<CommunicationFormData>;
  quickPrompt?: string;
}

export const STARTER_PRESETS: StarterPreset[] = [
  {
    id: 'job-app-sr-eng',
    label: 'Senior Frontend Engineer Application',
    mode: 'create',
    category: 'Job Application Email',
    summary: 'Tailored engineering application highlighting design systems and measurable performance gains.',
    formData: {
      communicationType: 'Job Application Email',
      recipientName: 'Elena Rostova',
      recipientRole: 'VP of Engineering',
      organization: 'Linearity Systems',
      senderName: 'Arjun Mehta',
      senderRole: 'Senior Frontend Engineer',
      senderPhone: '+1 (415) 890-4312',
      senderEmail: 'arjun.mehta@example.com',
      background: '6 years building high-density React & TypeScript workspaces, accessibility architecture (WCAG AA), and WebGL canvas tooling.',
      purpose: 'Applying for the Staff UI Engineer position; excited by Linearity’s focus on local-first collaborative workflows.',
      keyPoints: 'Led core editor performance overhaul at CloudCanvas; architected a zero-runtime design token system adopted by 14 product squads.',
      achievements: 'Reduced keystroke-to-paint latency by 41% and cut main bundle payload by 380KB across 90,000 daily active users.',
      dates: 'Available for technical interviews starting next week; 3-week notice period.',
      tone: 'Professional',
      length: 'Standard Email (100–250 words)',
      language: 'English',
    },
  },
  {
    id: 'leave-request-family',
    label: '3-Day Annual Leave Request with Handover',
    mode: 'create',
    category: 'Leave Request',
    summary: 'Crisp leave request specifying dates, pre-completed deliverables, and colleague coverage.',
    formData: {
      communicationType: 'Leave Request',
      recipientName: 'Marcus Vance',
      recipientRole: 'Engineering Manager',
      organization: 'Vanguard Analytics',
      senderName: 'Arjun Mehta',
      senderRole: 'Senior Frontend Engineer',
      senderPhone: '+1 (415) 890-4312',
      senderEmail: 'arjun.mehta@example.com',
      purpose: 'Requesting 3 days of annual leave to attend a close family wedding out of state.',
      dates: 'Wednesday, October 21 through Friday, October 23, 2026 (returning Monday, October 26).',
      keyPoints: 'All Q4 billing dashboard PRs will be merged by Tuesday afternoon. Clara Chen has agreed to cover any urgent production alerts while I am away.',
      tone: 'Warm',
      length: 'Short Message (50–120 words)',
      language: 'English',
    },
  },
  {
    id: 'cover-letter-pm',
    label: 'B2B Product Manager Cover Letter',
    mode: 'create',
    category: 'Cover Letter',
    summary: 'Evidence-driven cover letter connecting API platform experience with enterprise growth.',
    formData: {
      communicationType: 'Cover Letter',
      recipientName: 'Hiring Committee',
      recipientRole: 'Product Leadership',
      organization: 'Meridian Fintech',
      senderName: 'Sophia Lindqvist',
      senderRole: 'Senior Product Manager',
      senderPhone: '+1 (212) 555-0194',
      senderEmail: 'sophia.l@example.com',
      background: '5+ years leading B2B payments, webhook reliability, and self-serve developer onboarding.',
      purpose: 'Applying for Lead Product Manager, Core Ledger APIs at Meridian Fintech.',
      keyPoints: 'Deeply admire Meridian’s recent launch of real-time multi-currency treasury settlement. Built similar ledger reconciliation workflows for mid-market CFO teams.',
      achievements: 'Grew developer API activation rate from 28% to 64% in 9 months and reduced settlement dispute tickets by 52%.',
      dates: 'Available to start in November 2026.',
      tone: 'Persuasive',
      length: 'Cover Letter (250–450 words)',
      language: 'English',
    },
  },
  {
    id: 'resignation-notice',
    label: 'Executive Resignation & Handover Letter',
    mode: 'create',
    category: 'Resignation Letter',
    summary: 'Gracious formal resignation stating exact final working day and transition roadmap.',
    formData: {
      communicationType: 'Resignation Letter',
      recipientName: 'David Kensington',
      recipientRole: 'Director of Operations',
      organization: 'Apex Global Logistics',
      senderName: 'Arjun Mehta',
      senderRole: 'Operations Systems Lead',
      senderPhone: '+1 (415) 890-4312',
      senderEmail: 'arjun.mehta@example.com',
      purpose: 'Formal notice of resignation from my position as Operations Systems Lead.',
      dates: 'Providing 3 weeks’ notice; my intended last working day is Friday, November 6, 2026.',
      keyPoints: 'Sincerely grateful for the mentorship and opportunity to lead our warehouse automation rollout. I will prepare a complete runbook and train the incoming lead prior to my departure.',
      tone: 'Formal',
      length: 'Standard Email (100–250 words)',
      language: 'English',
    },
  },
  {
    id: 'improve-rough-draft',
    label: 'Polish a Blunt Follow-Up Draft',
    mode: 'improve',
    category: 'Rewrite & Polish',
    summary: 'Transform an informal, rushed follow-up into a crisp, tactful client message.',
    formData: {
      communicationType: 'Follow-up Email',
      existingDraft: `Hi Tom,\n\nI sent you the contract redlines last Tuesday on Oct 1 and still haven't heard back from your legal team. We really need this signed by Friday Oct 16 or we can't hold the Q4 implementation slot for your team. Let me know what's going on and when we can get the signed copy.\n\nThanks,\nArjun`,
      improvementGoals: ['Professionalism', 'Warmth & Tact', 'Clarity', 'Persuasive Impact'],
      tone: 'Professional',
      length: 'Short Message (50–120 words)',
      language: 'English',
    },
  },
  {
    id: 'quick-cold-outreach',
    label: 'Quick Write: Leave Request for Family Function',
    mode: 'quick',
    category: 'Quick Write',
    summary: 'Natural-language prompt where the AI extracts fields and uses clean placeholders.',
    quickPrompt: 'Write a leave request to my manager Sarah Jenkins for 2 days next Thursday and Friday because of a family function. I will finish the Q3 audit report before Wednesday evening and Rahul will handle urgent client emails.',
  },
];

export const INITIAL_SAMPLE_DRAFT: GeneratedDraft = {
  status: 'complete',
  assistantMessage:
    'Tailored your Senior Frontend Engineer application for Elena Rostova at Linearity Systems, highlighting your latency and bundle-size evidence with zero fabricated claims.',
  clarificationQuestions: [
    'Would you like to include a link to your portfolio or GitHub profile in the signature block?',
  ],
  subjectOptions: [
    'Staff UI Engineer Application — Arjun Mehta',
    'Application for Staff UI Engineer: Arjun Mehta (6+ yrs React & Design Systems)',
    'Arjun Mehta — Staff UI Engineer Candidacy at Linearity Systems',
  ],
  salutation: 'Dear Elena,',
  opening:
    'I am writing to apply for the Staff UI Engineer position at Linearity Systems. Having followed your engineering team’s work on local-first collaborative workflows, I am eager to bring my six years of experience architecting high-density React and TypeScript workspaces to your core product team.',
  bodyParagraphs: [
    'In my recent role as Senior Frontend Engineer at CloudCanvas, I led the performance overhaul of our browser-based editor serving 90,000 daily active users. By redesigning our rendering pipeline and eliminating unnecessary state re-computations, we reduced keystroke-to-paint latency by 41% and cut our main JavaScript bundle payload by 380KB.',
    'Additionally, I architected a zero-runtime, WCAG AA–compliant design token system that was adopted across 14 product squads—ensuring visual consistency and strict accessibility without sacrificing runtime speed.',
  ],
  callToAction:
    'I have attached my resume for your review and am available for technical interviews starting next week. Thank you for your time and consideration, and I would welcome the opportunity to discuss how my background aligns with Linearity Systems’ upcoming roadmap.',
  signOff: 'Best regards,',
  signatureBlock:
    'Arjun Mehta\nSenior Frontend Engineer\n+1 (415) 890-4312\narjun.mehta@example.com\n[Portfolio / LinkedIn URL]',
  placeholdersUsed: ['[Portfolio / LinkedIn URL]'],
  qualityVerification: {
    toneApplied: 'Professional',
    structureMode: 'Standard Email + Evidence Value Proposition',
    zeroFabricationVerified: true,
    integrityNote: 'All metrics (41% latency reduction, 380KB payload reduction, 90,000 DAUs) sourced strictly from sender input.',
  },
};
