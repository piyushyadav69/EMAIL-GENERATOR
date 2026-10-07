import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { SenderProfile } from '../types';

interface SenderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SenderProfile;
  onSaveProfile: (updated: SenderProfile) => void;
}

export const SenderProfileModal: React.FC<SenderProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [localProfile, setLocalProfile] = useState<SenderProfile>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(localProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-xl text-slate-900">Sender Profile & Signature</h2>
            <p className="text-xs text-slate-500">
              Saved locally to pre-fill your signature block and relevant background.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                value={localProfile.senderName}
                onChange={(e) =>
                  setLocalProfile({ ...localProfile, senderName: e.target.value })
                }
                placeholder="e.g., Arjun Mehta"
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Role / Qualification
              </label>
              <input
                type="text"
                value={localProfile.senderRole}
                onChange={(e) =>
                  setLocalProfile({ ...localProfile, senderRole: e.target.value })
                }
                placeholder="e.g., Senior Frontend Engineer"
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={localProfile.senderEmail}
                onChange={(e) =>
                  setLocalProfile({ ...localProfile, senderEmail: e.target.value })
                }
                placeholder="e.g., arjun.mehta@example.com"
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={localProfile.senderPhone}
                onChange={(e) =>
                  setLocalProfile({ ...localProfile, senderPhone: e.target.value })
                }
                placeholder="e.g., +1 (415) 890-4312"
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Core Experience, Education & Background Summary
            </label>
            <textarea
              rows={3}
              value={localProfile.background}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, background: e.target.value })
              }
              placeholder="e.g., 6 years in React/TypeScript, led design systems and accessibility engineering..."
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used only when relevant to personalize applications, cover letters, and outreach.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Sender Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
