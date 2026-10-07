import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  User,
  RotateCcw,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  Wand2,
} from 'lucide-react';
import {
  WorkspaceMode,
  CommunicationType,
  ToneOption,
  LengthOption,
  CommunicationFormData,
  GeneratedDraft,
  SavedDraftItem,
  SenderProfile,
  ADAPTIVE_CONFIGS,
  TONE_DESCRIPTIONS,
  SUPPORTED_LANGUAGES,
  IMPROVEMENT_GOALS,
  STARTER_PRESETS,
  INITIAL_SAMPLE_DRAFT,
} from './types';
import { ManuscriptPane } from './components/ManuscriptPane';
import { SenderProfileModal } from './components/SenderProfileModal';
import {
  composeStructuredDraft,
  refineStructuredDraftLocally,
} from './lib/mailComposerEngine';

const DEFAULT_SENDER: SenderProfile = {
  senderName: 'Arjun Mehta',
  senderRole: 'Senior Frontend Engineer',
  senderPhone: '+1 (415) 890-4312',
  senderEmail: 'arjun.mehta@example.com',
  background:
    '6 years building high-density React & TypeScript workspaces, accessibility architecture (WCAG AA), and WebGL canvas tooling.',
};

const DEFAULT_FORM_DATA: CommunicationFormData = {
  ...DEFAULT_SENDER,
  communicationType: 'Job Application Email',
  recipientName: 'Elena Rostova',
  recipientRole: 'VP of Engineering',
  organization: 'Linearity Systems',
  purpose:
    'Applying for the Staff UI Engineer position; excited by Linearity’s focus on local-first collaborative workflows.',
  keyPoints:
    'Led core editor performance overhaul at CloudCanvas; architected a zero-runtime design token system adopted by 14 product squads.',
  achievements:
    'Reduced keystroke-to-paint latency by 41% and cut main bundle payload by 380KB across 90,000 daily active users.',
  dates: 'Available for technical interviews starting next week; 3-week notice period.',
  tone: 'Professional',
  length: 'Standard Email (100–250 words)',
  language: 'English',
  jobDescription: '',
  existingDraft: '',
  improvementGoals: ['Clarity', 'Professionalism', 'Grammar & Flow'],
  additionalInstructions: '',
};

const COMMUNICATION_TYPES = Object.keys(ADAPTIVE_CONFIGS) as CommunicationType[];
const TONE_OPTIONS = Object.keys(TONE_DESCRIPTIONS) as ToneOption[];
const LENGTH_OPTIONS: LengthOption[] = [
  'Short Message (50–120 words)',
  'Standard Email (100–250 words)',
  'Cover Letter (250–450 words)',
  'Formal Application (Concise & Complete)',
];

export default function App() {
  const [activeMode, setActiveMode] = useState<WorkspaceMode>('create');
  const [formData, setFormData] = useState<CommunicationFormData>(() => {
    try {
      const savedProfile = localStorage.getItem('ai_mail_writer_sender_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        return { ...DEFAULT_FORM_DATA, ...parsed };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_FORM_DATA;
  });

  const [quickPrompt, setQuickPrompt] = useState(
    'Write a leave request to my manager Sarah Jenkins for 2 days next Thursday and Friday because of a family function. I will finish the Q3 audit report before Wednesday evening and Rahul will handle urgent client emails.'
  );
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; text: string }>
  >([]);

  const [currentDraft, setCurrentDraft] = useState<GeneratedDraft | null>(INITIAL_SAMPLE_DRAFT);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showSenderDetailsInline, setShowSenderDetailsInline] = useState(false);
  const [isSavedToHistory, setIsSavedToHistory] = useState(false);

  const [savedDrafts, setSavedDrafts] = useState<SavedDraftItem[]>(() => {
    try {
      const stored = localStorage.getItem('ai_mail_writer_saved_drafts');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'sample-1',
        title: 'Staff UI Engineer Application — Arjun Mehta',
        communicationType: 'Job Application Email',
        tone: 'Professional',
        createdAt: 'Oct 7, 2026',
        draft: INITIAL_SAMPLE_DRAFT,
        selectedSubjectIndex: 0,
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('ai_mail_writer_saved_drafts', JSON.stringify(savedDrafts));
    } catch {
      // ignore
    }
  }, [savedDrafts]);

  const currentAdaptiveConfig =
    ADAPTIVE_CONFIGS[formData.communicationType] || ADAPTIVE_CONFIGS['Professional Email'];

  const handleCommunicationTypeChange = (nextType: CommunicationType) => {
    const cfg = ADAPTIVE_CONFIGS[nextType];
    setFormData((prev) => ({
      ...prev,
      communicationType: nextType,
      length: cfg?.defaultLength || prev.length,
      tone: (TONE_OPTIONS.includes(cfg?.defaultTone) ? cfg.defaultTone : 'Professional') as ToneOption,
    }));
  };

  const handleSaveSenderProfile = (updated: SenderProfile) => {
    setFormData((prev) => ({
      ...prev,
      ...updated,
    }));
    try {
      localStorage.setItem('ai_mail_writer_sender_profile', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleResetBlank = () => {
    setFormData((prev) => ({
      ...prev,
      recipientName: '',
      recipientRole: '',
      organization: '',
      purpose: '',
      keyPoints: '',
      achievements: '',
      dates: '',
      jobDescription: '',
      existingDraft: '',
      additionalInstructions: '',
    }));
    setQuickPrompt('');
    setConversationHistory([]);
    setError(null);
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = STARTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setError(null);
    if (preset.mode === 'quick') {
      setActiveMode('quick');
      if (preset.quickPrompt) setQuickPrompt(preset.quickPrompt);
    } else if (preset.mode === 'improve') {
      setActiveMode('improve');
      if (preset.formData) {
        setFormData((prev) => ({ ...prev, ...preset.formData }));
      }
    } else {
      setActiveMode('create');
      if (preset.formData) {
        setFormData((prev) => ({ ...prev, ...preset.formData }));
      }
    }
  };

  const handleGenerate = async (clarificationAnswers?: string) => {
    setIsLoading(true);
    setError(null);
    setIsSavedToHistory(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeMode === 'templates' ? 'create' : activeMode,
          formData,
          quickPrompt,
          conversationHistory,
          clarificationAnswers,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate communication draft.');
      }

      setCurrentDraft(data);
      setSelectedSubjectIndex(0);

      // Sync extracted fields when in Quick Write mode
      if (activeMode === 'quick' && data.extractedFields) {
        setFormData((prev) => ({
          ...prev,
          communicationType:
            (COMMUNICATION_TYPES.find(
              (t) =>
                t.toLowerCase() ===
                (data.extractedFields.communicationType || '').toLowerCase()
            ) as CommunicationType) || prev.communicationType,
          recipientName: data.extractedFields.recipientName || prev.recipientName,
          recipientRole: data.extractedFields.recipientRole || prev.recipientRole,
          organization: data.extractedFields.organization || prev.organization,
          purpose: data.extractedFields.purpose || prev.purpose,
          keyPoints: data.extractedFields.keyPoints || prev.keyPoints,
        }));
      }

      if (activeMode === 'quick') {
        const userTurn = clarificationAnswers || quickPrompt;
        setConversationHistory((prev) => [
          ...prev,
          { role: 'user', text: userTurn },
          {
            role: 'assistant',
            text: data.assistantMessage || 'Generated communication draft.',
          },
        ]);
      }
    } catch {
      const fallback = composeStructuredDraft({
        mode: activeMode === 'templates' ? 'create' : activeMode,
        formData,
        quickPrompt,
        clarificationAnswers,
      });
      setCurrentDraft(fallback);
      setSelectedSubjectIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineAction = async (actionKey: string, customInstruction?: string) => {
    if (!currentDraft) return;
    setIsRefining(true);
    setError(null);
    setIsSavedToHistory(false);

    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDraft,
          action: actionKey,
          customInstruction,
          tone: formData.tone,
          length: formData.length,
          language: formData.language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine draft.');
      }

      setCurrentDraft(data);
    } catch {
      const fallback = refineStructuredDraftLocally({
        currentDraft,
        action: actionKey,
        customInstruction,
        tone: formData.tone,
      });
      setCurrentDraft(fallback);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveCurrentDraft = () => {
    if (!currentDraft) return;
    const title =
      currentDraft.subjectOptions?.[selectedSubjectIndex] ||
      currentDraft.subjectOptions?.[0] ||
      `${formData.communicationType} — ${formData.organization || 'Draft'}`;

    const newItem: SavedDraftItem = {
      id: `draft-${Date.now()}`,
      title,
      communicationType: formData.communicationType,
      tone: formData.tone,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      draft: currentDraft,
      selectedSubjectIndex,
    };

    setSavedDrafts((prev) => [newItem, ...prev]);
    setIsSavedToHistory(true);
  };

  const handleDeleteSavedDraft = (id: string) => {
    setSavedDrafts((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleImprovementGoal = (goal: string) => {
    setFormData((prev) => {
      const exists = prev.improvementGoals.includes(goal);
      const next = exists
        ? prev.improvementGoals.filter((g) => g !== goal)
        : [...prev.improvementGoals, goal];
      return { ...prev, improvementGoals: next.length > 0 ? next : [goal] };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: Strictly 1 row, 3 zones (Brand Wordmark — 4 Nav Links — 2 Actions) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark in display face */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveMode('create');
          }}
          className="font-editorial text-2xl tracking-tight text-slate-900 whitespace-nowrap"
        >
          AI Mail & Application Writer
        </a>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveMode('create')}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeMode === 'create'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Create New
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('improve')}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeMode === 'improve'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Improve Existing
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('quick')}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeMode === 'quick'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Quick Write
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('templates')}
            className={`py-1 transition-colors whitespace-nowrap ${
              activeMode === 'templates'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Presets & History ({savedDrafts.length})
          </button>
        </nav>

        {/* Zone 3: 1–2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Sender: {formData.senderName || 'Configure'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetBlank}
            className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Fields</span>
          </button>
        </div>
      </header>

      {/* Main 1440px Studio Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mode Switcher Bar (Mobile + Quick Context Header) */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="font-editorial text-3xl text-slate-900">
              {activeMode === 'create' && 'Guided Correspondence & Application Builder'}
              {activeMode === 'improve' && 'Rewrite, Polish & Translate Existing Draft'}
              {activeMode === 'quick' && 'Quick Write & Adaptive Assistant'}
              {activeMode === 'templates' && 'Starter Scenarios & Saved Correspondence'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {activeMode === 'create' &&
                'Adaptive fields tailored to your communication type · Square-bracket placeholders for any omitted details · Zero fabricated claims'}
              {activeMode === 'improve' &&
                'Preserve your original facts and intent while upgrading clarity, flow, executive tone, or target language'}
              {activeMode === 'quick' &&
                'Describe what you need in natural language — the assistant extracts key fields and drafts or asks concise questions'}
              {activeMode === 'templates' &&
                'Load a realistic scenario to test adaptive drafting or reopen a previously saved communication'}
            </p>
          </div>

          {/* Functional Segmented Mode Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
            {(
              [
                { id: 'create', label: '01. Create New' },
                { id: 'improve', label: '02. Improve Existing' },
                { id: 'quick', label: '03. Quick Write' },
                { id: 'templates', label: `04. Library (${savedDrafts.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeMode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANE: Adaptive Controls & Input (5 Columns on Desktop) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Shared Authoritative Controls: Tone, Length, Language */}
            {activeMode !== 'templates' && (
              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-semibold text-slate-900">
                    Authoritative Tone, Length & Language Controls
                  </h2>
                  <span className="text-xs text-slate-500">Section 11–13 Engine</span>
                </div>

                {/* Tone Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Desired Tone
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TONE_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, tone: t }))}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap truncate ${
                          formData.tone === t
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {TONE_DESCRIPTIONS[formData.tone]}
                  </p>
                </div>

                {/* Length & Language Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Target Length
                    </label>
                    <select
                      value={formData.length}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          length: e.target.value as LengthOption,
                        }))
                      }
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      {LENGTH_OPTIONS.map((len) => (
                        <option key={len} value={len}>
                          {len}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Output Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, language: e.target.value }))
                      }
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* MODE 1: CREATE NEW (Guided Adaptive Form) */}
            {activeMode === 'create' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
                {/* Communication Type Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-800">
                      01. Type of Communication
                    </label>
                    <span className="text-xs text-slate-500">
                      {currentAdaptiveConfig.category}
                    </span>
                  </div>
                  <select
                    value={formData.communicationType}
                    onChange={(e) =>
                      handleCommunicationTypeChange(e.target.value as CommunicationType)
                    }
                    className="w-full text-sm font-medium bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {COMMUNICATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {currentAdaptiveConfig.description}
                  </p>

                  {/* Adaptive Checklist Indicator */}
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                    <p className="text-[11px] font-semibold text-slate-700 mb-1">
                      Adaptive Priority Checklist for {formData.communicationType}:
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {currentAdaptiveConfig.adaptiveChecklist.join(' · ')}
                    </p>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      02. Recipient & Organization Details
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Leave blank to use [Placeholders]
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={formData.recipientName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, recipientName: e.target.value }))
                        }
                        placeholder="[Recipient Name]"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Recipient Role / Title
                      </label>
                      <input
                        type="text"
                        value={formData.recipientRole}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, recipientRole: e.target.value }))
                        }
                        placeholder="e.g., Hiring Manager"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, organization: e.target.value }))
                        }
                        placeholder="[Company Name]"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Adaptive Purpose & Key Points */}
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
                  <span className="block text-xs font-semibold text-slate-800">
                    03. Purpose, Context & Adaptive Details
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {currentAdaptiveConfig.purposeLabel}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.purpose}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, purpose: e.target.value }))
                      }
                      placeholder={currentAdaptiveConfig.purposePlaceholder}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {currentAdaptiveConfig.keyPointsLabel}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.keyPoints}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, keyPoints: e.target.value }))
                      }
                      placeholder={currentAdaptiveConfig.keyPointsPlaceholder}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {currentAdaptiveConfig.achievementsLabel && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {currentAdaptiveConfig.achievementsLabel}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.achievements}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, achievements: e.target.value }))
                        }
                        placeholder={currentAdaptiveConfig.achievementsPlaceholder}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  {currentAdaptiveConfig.datesLabel && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {currentAdaptiveConfig.datesLabel}
                      </label>
                      <input
                        type="text"
                        value={formData.dates}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, dates: e.target.value }))
                        }
                        placeholder={currentAdaptiveConfig.datesPlaceholder}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  {currentAdaptiveConfig.showJobDescription && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {currentAdaptiveConfig.jobDescriptionLabel ||
                          'Job Description / Reference Text'}
                      </label>
                      <textarea
                        rows={3}
                        value={formData.jobDescription}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, jobDescription: e.target.value }))
                        }
                        placeholder={
                          currentAdaptiveConfig.jobDescriptionPlaceholder ||
                          'Paste job description or reference requirements...'
                        }
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}
                </div>

                {/* Collapsible Sender Details Override */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSenderDetailsInline(!showSenderDetailsInline)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 py-1 hover:text-slate-900"
                  >
                    <span>
                      04. Your Details ({formData.senderName || 'Using [Your Name]'})
                    </span>
                    {showSenderDetailsInline ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showSenderDetailsInline && (
                    <div className="mt-3 space-y-3 pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Your Name
                          </label>
                          <input
                            type="text"
                            value={formData.senderName}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, senderName: e.target.value }))
                            }
                            placeholder="[Your Name]"
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Your Role / Qualification
                          </label>
                          <input
                            type="text"
                            value={formData.senderRole}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, senderRole: e.target.value }))
                            }
                            placeholder="e.g., Senior Frontend Engineer"
                            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Relevant Background / Experience
                        </label>
                        <textarea
                          rows={2}
                          value={formData.background}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, background: e.target.value }))
                          }
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Generate CTA */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleGenerate()}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isLoading
                      ? 'Drafting Communication...'
                      : `Generate ${formData.communicationType}`}
                  </span>
                </button>
              </div>
            )}

            {/* MODE 2: IMPROVE EXISTING (Rewrite & Translation Mode - Section 14 & 15) */}
            {activeMode === 'improve' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-800">
                      Paste Your Existing Draft
                    </label>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset('improve-rough-draft')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Load Sample Rough Draft
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={formData.existingDraft}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, existingDraft: e.target.value }))
                    }
                    placeholder="Paste the email, cover letter, or message you want to improve or translate..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3.5 py-3 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    Select Improvement Priorities (Preserves All Facts & Intent)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {IMPROVEMENT_GOALS.map((goal) => {
                      const active = formData.improvementGoals.includes(goal);
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => toggleImprovementGoal(goal)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                            active
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span>{goal}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Additional Rewrite or Translation Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.additionalInstructions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        additionalInstructions: e.target.value,
                      }))
                    }
                    placeholder="e.g., Keep it under 120 words, soften the deadline reminder..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="button"
                  disabled={isLoading || !formData.existingDraft.trim()}
                  onClick={() => handleGenerate()}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>
                    {isLoading ? 'Improving Draft...' : 'Improve & Polish Draft'}
                  </span>
                </button>
              </div>
            )}

            {/* MODE 3: QUICK WRITE (Natural Language Extraction + Adaptive Flow) */}
            {activeMode === 'quick' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Describe What You Need to Write
                  </label>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    Type a natural-language instruction. The assistant will automatically extract
                    the recipient, purpose, and key points, use{' '}
                    <span className="font-mono-tabular text-slate-700">[Placeholders]</span> for
                    unmentioned details, or ask concise clarifying questions if critical context is
                    missing.
                  </p>
                  <textarea
                    rows={6}
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    placeholder="e.g., Write a leave request for 2 days because of a family function..."
                    className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3.5 py-3 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Quick Example Prompts */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-slate-600">
                    Try an Example Prompt:
                  </span>
                  <div className="space-y-1.5">
                    {[
                      'Write a leave request for 2 days next Thursday and Friday because of a family function.',
                      'Write a cold email to Priya Sharma, Head of Design at Figma, proposing a 15-minute chat about accessibility automation.',
                      'Write a polite follow-up email on my Senior Backend Engineer application submitted 10 days ago.',
                      'Write a formal resignation letter with a 3-week notice period and thank my team for their mentorship.',
                    ].map((sample, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setQuickPrompt(sample)}
                        className="w-full text-left text-xs text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 rounded-lg px-3 py-2 transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{sample}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading || !quickPrompt.trim()}
                  onClick={() => handleGenerate()}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isLoading ? 'Analyzing & Drafting...' : 'Quick Write Draft'}
                  </span>
                </button>
              </div>
            )}

            {/* MODE 4: PRESETS & SAVED HISTORY */}
            {activeMode === 'templates' && (
              <div className="space-y-6">
                <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <h2 className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
                    Curated Starter Scenarios
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {STARTER_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-900">
                            {preset.label}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {preset.category} · Mode: {preset.mode}
                          </div>
                          <p className="text-xs text-slate-600 pt-0.5">{preset.summary}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLoadPreset(preset.id)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Load Scenario
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <h2 className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
                    Saved Draft History ({savedDrafts.length})
                  </h2>
                  {savedDrafts.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No saved drafts yet. Click “Save” on any generated manuscript to store it
                      here.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {savedDrafts.map((item) => (
                        <div
                          key={item.id}
                          className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.communicationType} · {item.tone} · {item.createdAt}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentDraft(item.draft);
                                setSelectedSubjectIndex(item.selectedSubjectIndex);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedDraft(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                              title="Delete saved draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>

          {/* RIGHT PANE: Structured Manuscript & Interactive Refinement Studio (7 Columns on Desktop) */}
          <div className="lg:col-span-7">
            <ManuscriptPane
              draft={currentDraft}
              isLoading={isLoading}
              isRefining={isRefining}
              error={error}
              selectedSubjectIndex={selectedSubjectIndex}
              onSelectSubjectIndex={setSelectedSubjectIndex}
              onUpdateDraft={setCurrentDraft}
              onRefineAction={handleRefineAction}
              onAnswerClarification={(answers) => handleGenerate(answers)}
              onSaveDraft={handleSaveCurrentDraft}
              isSaved={isSavedToHistory}
              tone={formData.tone}
              length={formData.length}
              language={formData.language}
            />
          </div>
        </div>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            AI Mail & Application Writer · Clarity, Relevance, Professionalism, Persuasion,
            Authenticity & Accuracy
          </span>
          <span>
            Strict Zero-Fabrication Policy · Missing details preserved as [Square-Bracket
            Placeholders]
          </span>
        </div>
      </footer>

      {/* Persistent Sender Profile Modal */}
      <SenderProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={{
          senderName: formData.senderName,
          senderRole: formData.senderRole,
          senderPhone: formData.senderPhone,
          senderEmail: formData.senderEmail,
          background: formData.background,
        }}
        onSaveProfile={handleSaveSenderProfile}
      />
    </div>
  );
}
