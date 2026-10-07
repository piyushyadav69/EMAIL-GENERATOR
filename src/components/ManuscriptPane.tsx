import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  Bookmark,
  Sparkles,
  CornerDownLeft,
  Edit3,
  Eye,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { GeneratedDraft, ToneOption, LengthOption } from '../types';

interface ManuscriptPaneProps {
  draft: GeneratedDraft | null;
  isLoading: boolean;
  isRefining: boolean;
  error: string | null;
  selectedSubjectIndex: number;
  onSelectSubjectIndex: (index: number) => void;
  onUpdateDraft: (updated: GeneratedDraft) => void;
  onRefineAction: (actionKey: string, customInstruction?: string) => void;
  onAnswerClarification: (answers: string) => void;
  onSaveDraft: () => void;
  isSaved: boolean;
  tone: ToneOption;
  length: LengthOption;
  language: string;
}

export const ManuscriptPane: React.FC<ManuscriptPaneProps> = ({
  draft,
  isLoading,
  isRefining,
  error,
  selectedSubjectIndex,
  onSelectSubjectIndex,
  onUpdateDraft,
  onRefineAction,
  onAnswerClarification,
  onSaveDraft,
  isSaved,
}) => {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [isEditingDirect, setIsEditingDirect] = useState(false);
  const [customRevision, setCustomRevision] = useState('');
  const [clarificationInput, setClarificationInput] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

  // Compute live placeholders present in the current draft
  const activePlaceholders = useMemo(() => {
    if (!draft) return [];
    const fullText = [
      ...(draft.subjectOptions || []),
      draft.salutation,
      draft.opening,
      ...(draft.bodyParagraphs || []),
      draft.callToAction,
      draft.signOff,
      draft.signatureBlock,
    ].join('\n');

    const matches = fullText.match(/\[[^\[\]\n]{2,45}\]/g) || [];
    return Array.from(new Set(matches));
  }, [draft]);

  // Helper to replace a placeholder across the entire draft
  const handleApplyPlaceholder = (placeholder: string, replacement: string) => {
    if (!draft || !replacement.trim()) return;
    const replaceInStr = (str: string) => str.split(placeholder).join(replacement.trim());

    const updated: GeneratedDraft = {
      ...draft,
      subjectOptions: draft.subjectOptions.map(replaceInStr),
      salutation: replaceInStr(draft.salutation),
      opening: replaceInStr(draft.opening),
      bodyParagraphs: draft.bodyParagraphs.map(replaceInStr),
      callToAction: replaceInStr(draft.callToAction),
      signOff: replaceInStr(draft.signOff),
      signatureBlock: replaceInStr(draft.signatureBlock),
      placeholdersUsed: (draft.placeholdersUsed || []).filter((p) => p !== placeholder),
    };

    onUpdateDraft(updated);
    setPlaceholderValues((prev) => {
      const next = { ...prev };
      delete next[placeholder];
      return next;
    });
  };

  // Assemble full formatted email string
  const selectedSubject =
    draft?.subjectOptions?.[selectedSubjectIndex] || draft?.subjectOptions?.[0] || '';

  const fullEmailBody = useMemo(() => {
    if (!draft) return '';
    const parts = [
      draft.salutation,
      draft.opening,
      ...(draft.bodyParagraphs || []),
      draft.callToAction,
      `${draft.signOff}\n${draft.signatureBlock}`,
    ].filter((p) => p && p.trim().length > 0);
    return parts.join('\n\n');
  }, [draft]);

  const fullCopyText = useMemo(() => {
    if (!draft) return '';
    return selectedSubject
      ? `Subject: ${selectedSubject}\n\n${fullEmailBody}`
      : fullEmailBody;
  }, [draft, selectedSubject, fullEmailBody]);

  // Word & character counts
  const metrics = useMemo(() => {
    const words = fullEmailBody
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const chars = fullEmailBody.length;
    const readSeconds = Math.max(10, Math.round((words / 200) * 60));
    return { words, chars, readSeconds };
  }, [fullEmailBody]);

  const handleCopyFull = async () => {
    if (!fullCopyText) return;
    await navigator.clipboard.writeText(fullCopyText);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleCopySubject = async () => {
    if (!selectedSubject) return;
    await navigator.clipboard.writeText(selectedSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    if (!draft) return;
    let content = '';
    if (format === 'md') {
      content = `# ${selectedSubject || 'Professional Communication'}\n\n**Subject Options:**\n${(
        draft.subjectOptions || []
      )
        .map((s) => `- ${s}`)
        .join('\n')}\n\n---\n\n${fullEmailBody}\n`;
    } else {
      content = fullCopyText;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeFilename = (selectedSubject || 'communication-draft')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 45);
    a.href = url;
    a.download = `${safeFilename || 'draft'}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitCustomRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRevision.trim() || isRefining) return;
    onRefineAction('custom', customRevision.trim());
    setCustomRevision('');
  };

  const handleSubmitClarification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationInput.trim() || isLoading) return;
    onAnswerClarification(clarificationInput.trim());
    setClarificationInput('');
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 min-h-[680px] flex flex-col justify-between">
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2.5">
            <div className="h-3.5 w-28 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
            <div className="h-10 w-11/12 bg-slate-100 rounded-lg" />
          </div>
          <div className="pt-4 space-y-4">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-20 w-full bg-slate-100 rounded-lg" />
            <div className="h-28 w-full bg-slate-100 rounded-lg" />
            <div className="h-20 w-5/6 bg-slate-100 rounded-lg" />
            <div className="h-16 w-48 bg-slate-100 rounded-lg" />
          </div>
        </div>
        <p className="text-xs text-slate-500 pt-6 border-t border-slate-100">
          Structuring communication · Verifying tone, clarity, and zero-fabrication constraints...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 min-h-[420px] flex flex-col justify-center items-start gap-4">
        <div className="flex items-center gap-2.5 text-red-700 font-semibold text-base">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Unable to generate communication draft</span>
        </div>
        <p className="text-sm text-slate-600 max-w-xl leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 min-h-[600px] flex flex-col justify-center items-center text-center">
        <h3 className="font-editorial text-2xl text-slate-900 mb-2">
          Ready to Draft Your Correspondence
        </h3>
        <p className="text-sm text-slate-600 max-w-md leading-relaxed">
          Complete the adaptive fields on the left or enter a Quick Write instruction to generate a
          ready-to-send email, cover letter, or formal application.
        </p>
      </div>
    );
  }

  // If status is needs_clarification and no body was drafted yet
  const isClarificationOnly =
    draft.status === 'needs_clarification' &&
    !draft.opening?.trim() &&
    (!draft.bodyParagraphs || draft.bodyParagraphs.length === 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
      {/* Top Manuscript Action Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Correspondence Manuscript</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{metrics.words} words</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{metrics.chars} chars</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">~{metrics.readSeconds}s read</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingDirect(!isEditingDirect)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isEditingDirect
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isEditingDirect ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Mode</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Inline</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload('txt')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Download as plain text (.txt)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.TXT</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload('md')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Download as Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>

          <button
            type="button"
            onClick={handleCopyFull}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            {copiedFull ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied Email</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Assistant Context Note & Adaptive Clarification Section */}
      {(draft.assistantMessage ||
        (draft.clarificationQuestions && draft.clarificationQuestions.length > 0)) && (
        <div
          className={`px-6 py-4 border-b ${
            draft.status === 'needs_clarification'
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-slate-50/40 border-slate-200'
          }`}
        >
          {draft.assistantMessage && (
            <p className="text-xs text-slate-700 leading-relaxed">{draft.assistantMessage}</p>
          )}

          {draft.clarificationQuestions && draft.clarificationQuestions.length > 0 && (
            <div className="mt-3 space-y-2.5">
              <p className="text-xs font-semibold text-slate-800">
                {draft.status === 'needs_clarification'
                  ? 'Please share a few key details so I can write an accurate draft:'
                  : 'Optional details to further personalize this draft:'}
              </p>
              <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                {draft.clarificationQuestions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
              <form onSubmit={handleSubmitClarification} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={clarificationInput}
                  onChange={(e) => setClarificationInput(e.target.value)}
                  placeholder="Type your answer or missing details here..."
                  className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={!clarificationInput.trim() || isLoading}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  Apply Details
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Interactive Placeholder Quick-Fill Bar (Section 4 & 18 Policy) */}
      {activePlaceholders.length > 0 && (
        <div className="px-6 py-3.5 bg-blue-50/40 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800">
              Unfilled Placeholders ({activePlaceholders.length}) — Fill below to replace inline
            </span>
            <span className="text-xs text-slate-500">Zero-fabrication policy active</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activePlaceholders.map((ph) => (
              <div key={ph} className="flex items-center gap-1.5">
                <span className="font-mono-tabular text-xs text-blue-800 bg-white border border-blue-200 px-2 py-1.5 rounded-md shrink-0 truncate max-w-[160px]">
                  {ph}
                </span>
                <input
                  type="text"
                  value={placeholderValues[ph] || ''}
                  onChange={(e) =>
                    setPlaceholderValues((prev) => ({ ...prev, [ph]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyPlaceholder(ph, placeholderValues[ph] || '');
                    }
                  }}
                  placeholder={`Enter ${ph.replace(/[\[\]]/g, '')}...`}
                  className="flex-1 min-w-0 text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPlaceholder(ph, placeholderValues[ph] || '')}
                  disabled={!placeholderValues[ph]?.trim()}
                  className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  Fill
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isClarificationOnly && (
        <>
          {/* Subject Line Options Section (Section 8 & 17) */}
          {draft.subjectOptions && draft.subjectOptions.length > 0 && (
            <div className="px-6 py-4 border-b border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Subject Line Options (Select Preferred)
                </span>
                <button
                  type="button"
                  onClick={handleCopySubject}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  {copiedSubject ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Subject</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Selected Subject</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                {draft.subjectOptions.map((subject, idx) => {
                  const isSelected = idx === selectedSubjectIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectSubjectIndex(idx)}
                      className={`group flex items-center gap-3 px-3.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-600 text-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-mono-tabular shrink-0 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      {isEditingDirect ? (
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => {
                            const nextSubjects = [...draft.subjectOptions];
                            nextSubjects[idx] = e.target.value;
                            onUpdateDraft({ ...draft, subjectOptions: nextSubjects });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-sm font-medium bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      ) : (
                        <span className="text-sm font-medium flex-1 leading-snug">{subject}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Manuscript Body (Salutation, Opening, Core Message, CTA, Sign-off) */}
          <div className="px-8 py-7 flex-1 space-y-5 bg-white">
            {isEditingDirect ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Salutation
                  </label>
                  <input
                    type="text"
                    value={draft.salutation}
                    onChange={(e) => onUpdateDraft({ ...draft, salutation: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Opening Paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={draft.opening}
                    onChange={(e) => onUpdateDraft({ ...draft, opening: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Core Message / Value Proposition Paragraphs
                  </label>
                  <div className="space-y-2.5">
                    {draft.bodyParagraphs.map((para, pIdx) => (
                      <textarea
                        key={pIdx}
                        rows={4}
                        value={para}
                        onChange={(e) => {
                          const nextParas = [...draft.bodyParagraphs];
                          nextParas[pIdx] = e.target.value;
                          onUpdateDraft({ ...draft, bodyParagraphs: nextParas });
                        }}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Call to Action / Closing Paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={draft.callToAction}
                    onChange={(e) => onUpdateDraft({ ...draft, callToAction: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Sign-Off
                    </label>
                    <input
                      type="text"
                      value={draft.signOff}
                      onChange={(e) => onUpdateDraft({ ...draft, signOff: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Signature Block
                    </label>
                    <textarea
                      rows={4}
                      value={draft.signatureBlock}
                      onChange={(e) => onUpdateDraft({ ...draft, signatureBlock: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono-tabular focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <article className="space-y-4 text-[15px] text-slate-800 leading-[1.7] max-w-[68ch]">
                {draft.salutation && (
                  <p className="font-medium text-slate-900">{draft.salutation}</p>
                )}

                {draft.opening && <p>{ renderHighlightedPlaceholders(draft.opening) }</p>}

                {draft.bodyParagraphs &&
                  draft.bodyParagraphs.map((para, idx) => (
                    <p key={idx}>{ renderHighlightedPlaceholders(para) }</p>
                  ))}

                {draft.callToAction && (
                  <p>{ renderHighlightedPlaceholders(draft.callToAction) }</p>
                )}

                <div className="pt-2 space-y-1">
                  {draft.signOff && <p className="text-slate-900">{draft.signOff}</p>}
                  {draft.signatureBlock && (
                    <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed pt-1">
                      {renderHighlightedPlaceholders(draft.signatureBlock)}
                    </div>
                  )}
                </div>
              </article>
            )}
          </div>

          {/* User Controls & 1-Click Refinement Bar (Section 13) */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Instant Refinements</span>
              </div>
              {isRefining && (
                <span className="text-xs text-blue-600 font-medium animate-pulse">
                  Applying revision...
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'shorten', label: 'Make It Shorter' },
                { key: 'formal', label: 'More Formal' },
                { key: 'persuasive', label: 'Make Stronger' },
                { key: 'warmer', label: 'Make Warmer' },
                { key: 'confident', label: 'More Confident' },
                { key: 'simpler', label: 'Make Simpler' },
                { key: 'human', label: 'Make More Human' },
                { key: 'grammar', label: 'Polish Grammar Only' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  disabled={isRefining}
                  onClick={() => onRefineAction(btn.key)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitCustomRevision} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customRevision}
                onChange={(e) => setCustomRevision(e.target.value)}
                disabled={isRefining}
                placeholder="Custom revision (e.g., 'Translate to German', 'Add a bullet list of key points', 'Mention we met on Tuesday')..."
                className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={!customRevision.trim() || isRefining}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Revise Draft</span>
                <CornerDownLeft className="w-3 h-3 opacity-75" />
              </button>
            </form>
          </div>

          {/* Quality Verification Footer (Section 16 & 19 - Clean Unboxed Metadata) */}
          {draft.qualityVerification && (
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero-Fabrication Verified</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>Tone: {draft.qualityVerification.toneApplied || 'Professional'}</span>
                <span aria-hidden="true">·</span>
                <span>Structure: {draft.qualityVerification.structureMode || 'Standard Email'}</span>
              </div>
              {draft.qualityVerification.integrityNote && (
                <span className="text-slate-500 truncate max-w-md" title={draft.qualityVerification.integrityNote}>
                  {draft.qualityVerification.integrityNote}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Helper to visually highlight square-bracket placeholders inside the manuscript
function renderHighlightedPlaceholders(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\[[^\[\]\n]{2,45}\])/g);
  return parts.map((part, index) => {
    if (/^\[[^\[\]\n]{2,45}\]$/.test(part)) {
      return (
        <span
          key={index}
          className="font-mono-tabular text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded mx-0.5"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
