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
  ExternalLink
} from 'lucide-react';
import { TripProject } from '../types';
import { encodeProjectToUrlHash, downloadProjectJson } from '../utils/tripHelpers';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TripProject;
  onImportProject: (imported: TripProject) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportProject,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate shareable URL
  const hashPart = encodeProjectToUrlHash(project);
  const shareableUrl = `${window.location.origin}${window.location.pathname}${hashPart}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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
              Share & Deploy Project
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
          {/* Section 1: Live Real-Time Share Link */}
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                Live Instant Share Link
              </span>
              <span className="text-[11px] text-stone-500 font-semibold">
                No server needed
              </span>
            </div>
            <p className="text-xs text-stone-600 font-medium">
              Copy this link and send it to other teachers, school administrators, or chaperones. When they open it, their browser will immediately load your exact timeline, cards, and gear list!
            </p>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-300 text-xs font-mono text-stone-700 select-all outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-700 hover:bg-amber-800 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Backup & Export JSON */}
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <FileJson className="w-4 h-4 text-amber-700" />
              Project File Export & Import (JSON)
            </span>
            <p className="text-xs text-stone-600 font-medium">
              Download your full project file to commit to your GitHub repository or load updates from a colleague.
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

          {/* Section 3: GitHub Pages & Cloudflare Pages Static Hosting Guide */}
          <div className="bg-amber-100/60 p-4 rounded-2xl border border-amber-300 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <Github className="w-4 h-4 text-stone-800" />
              <span>Hosting on GitHub Pages or Cloudflare Pages</span>
            </span>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              This app is engineered as a 100% static client-side single page application (SPA). That means you can deploy it to <strong>GitHub Pages</strong> or <strong>Cloudflare Pages</strong> in seconds for free:
            </p>

            <div className="bg-stone-900 text-amber-100 p-3 rounded-xl font-mono text-[11px] space-y-1 overflow-x-auto">
              <div># 1. Build the static bundle:</div>
              <div className="text-emerald-400 font-bold">npm run build</div>
              <div># 2. Output directory is ready inside /dist</div>
              <div># 3. In Cloudflare Pages: Connect repo &gt; Build command: npm run build &gt; Output: dist</div>
              <div># 4. In GitHub Pages: Push dist/ to gh-pages branch or use GitHub Actions Vite workflow!</div>
            </div>

            <p className="text-[11px] text-stone-500 font-semibold italic">
              💡 All edits auto-save to browser storage and can be shared via the link above or exported JSON.
            </p>
          </div>
        </div>

        <div className="bg-amber-100/80 px-6 py-3 border-t border-amber-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
