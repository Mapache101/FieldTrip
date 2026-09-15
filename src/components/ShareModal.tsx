import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  Cloud, 
  Github, 
  Sparkles, 
  FileJson,
  Radio,
  ExternalLink,
  Users
} from 'lucide-react';
import { TripProject } from '../types';
import { encodeProjectToUrlHash, downloadProjectJson } from '../utils/tripHelpers';
import { getLiveCollaborationUrl } from '../services/tripSyncService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TripProject;
  onImportProject: (imported: TripProject) => void;
  tripId?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportProject,
  tripId,
}) => {
  const [copiedLiveLink, setCopiedLiveLink] = useState(false);
  const [copiedSnapshotLink, setCopiedSnapshotLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTripId = tripId || project.id || 'palermo-expedition-2026';
  const liveShareUrl = getLiveCollaborationUrl(currentTripId);

  // Snapshot static fallback
  const hashPart = encodeProjectToUrlHash(project);
  const snapshotUrl = `${window.location.origin}${window.location.pathname}${hashPart}`;

  const handleCopyLiveLink = () => {
    navigator.clipboard.writeText(liveShareUrl);
    setCopiedLiveLink(true);
    setTimeout(() => setCopiedLiveLink(false), 2500);
  };

  const handleCopySnapshotLink = () => {
    navigator.clipboard.writeText(snapshotUrl);
    setCopiedSnapshotLink(true);
    setTimeout(() => setCopiedSnapshotLink(false), 2500);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(project, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as TripProject;
        if (!parsed.tripName || !Array.isArray(parsed.days)) {
          throw new Error('Invalid project file schema');
        }
        onImportProject(parsed);
        alert(`Successfully imported "${parsed.tripName}"!`);
        onClose();
      } catch (err: any) {
        setImportError('Failed to parse JSON file. Please ensure it is a valid CampQuest plan export.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-amber-50 rounded-3xl border-3 border-amber-800/80 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-200" />
            <h2 className="text-lg font-black font-display tracking-tight">
              Real-Time Collaboration & Sharing
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-amber-200 hover:text-white hover:bg-amber-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Live Real-Time Collaboration Link (Primary) */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-5 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <Users className="w-4 h-4 text-emerald-700" />
                Live Real-Time Collaboration Link
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                Firestore Cloud Synced
              </span>
            </div>
            
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              Share this link with other teachers, coordinators, and planning team members. 
              <strong> Anyone with this link can simultaneously view and edit</strong> this plan—moving activity cards, changing trip dates, adding gear, and organizing rosters in real time!
            </p>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={liveShareUrl}
                className="flex-1 px-3 py-2.5 rounded-xl bg-white border-2 border-emerald-300 text-xs font-mono text-emerald-950 select-all outline-none truncate shadow-inner"
              />
              <button
                type="button"
                onClick={handleCopyLiveLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-sm ${
                  copiedLiveLink
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copiedLiveLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLiveLink ? 'Link Copied!' : 'Copy Live Link'}</span>
              </button>
            </div>
            <div className="text-[11px] text-emerald-800/80 font-medium">
              Trip Plan ID: <code className="font-mono font-bold bg-emerald-200/60 px-1.5 py-0.5 rounded text-emerald-950">{currentTripId}</code>
            </div>
          </div>

          {/* Section 2: Static Offline Snapshot Link */}
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                Static Snapshot Link (Read-Only State)
              </span>
              <span className="text-[11px] text-stone-500 font-semibold">
                Offline Snapshot
              </span>
            </div>
            <p className="text-xs text-stone-600 font-medium">
              Creates a standalone snapshot embedded directly inside the URL hash. Ideal for archiving a frozen milestone copy.
            </p>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={snapshotUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-300 text-xs font-mono text-stone-700 select-all outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopySnapshotLink}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-xs ${
                  copiedSnapshotLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-700 hover:bg-amber-800 text-white'
                }`}
              >
                {copiedSnapshotLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSnapshotLink ? 'Copied!' : 'Copy Snapshot'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Backup & Export JSON */}
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <FileJson className="w-4 h-4 text-amber-700" />
              Project File Export & Import (JSON)
            </span>
            <p className="text-xs text-stone-600 font-medium">
              Download your complete plan as a JSON file to keep an offline backup or load updates into another workspace.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadProjectJson(project)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors"
              >
                <Download className="w-4 h-4 text-stone-600" />
                <span>Download .JSON</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors"
              >
                {copiedJson ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
                <span>{copiedJson ? 'Copied JSON!' : 'Copy Raw JSON'}</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-stone-600" />
                <span>Import .JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importError && (
              <p className="text-xs font-bold text-red-600 mt-1">{importError}</p>
            )}
          </div>
        </div>

        <div className="bg-amber-100/80 px-6 py-3 border-t border-amber-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
