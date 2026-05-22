import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  AlertTriangle,
  Loader2,
  Check,
  X,
  Play,
  Scissors,
  Bookmark,
  Info
} from "lucide-react";

interface ParsingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalText: string) => void;
  fileName: string;
  sourceText: string;
  isPdf: boolean;
  charCount: number;
  customKeywords?: {
    training: string[];
    om: string[];
    warranty: string[];
    asBuilt: string[];
  };
}

export default function ParsingPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  sourceText,
  isPdf,
  charCount,
  customKeywords,
}: ParsingPreviewModalProps) {
  const [editText, setEditText] = useState("");

  // Initialize editable text when open
  useEffect(() => {
    if (isOpen) {
      setEditText(sourceText || "");
    }
  }, [isOpen, sourceText]);

  // Client side keyword analysis heuristics
  const heuristicMetrics = useMemo(() => {
    const textToCheck = isPdf ? sourceText : editText;
    if (!textToCheck) return { trainingMatches: 0, omMatches: 0, warrantyMatches: 0, total: 0 };

    const lower = textToCheck.toLowerCase();

    const defaultKeywords = {
      training: ["train", "instruction", "personnel", "demonstrate", "classroom", "hands-on"],
      om: ["manual", "o&m", "operation & maintenance", "maintenance manual", "parts list", "schematic"],
      warranty: ["warranty", "guarantee", "correction period", "special warranty", "extended warranty"]
    };

    const tWords = customKeywords?.training || defaultKeywords.training;
    const omWords = customKeywords?.om || defaultKeywords.om;
    const wWords = customKeywords?.warranty || defaultKeywords.warranty;
    
    // Heuristic keyword counts
    const countOccurrences = (words: string[]) => {
      let count = 0;
      words.forEach((word) => {
        const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const matches = lower.match(new RegExp(escaped, "g"));
        if (matches) count += matches.length;
      });
      return count;
    };

    const trainingMatches = countOccurrences(tWords);
    const omMatches = countOccurrences(omWords);
    const warrantyMatches = countOccurrences(wWords);

    return {
      trainingMatches,
      omMatches,
      warrantyMatches,
      total: trainingMatches + omMatches + warrantyMatches,
    };
  }, [editText, isPdf, sourceText, customKeywords]);

  const activeCharCount = isPdf ? charCount : editText.length;
  const activeWordCount = useMemo(() => {
    const text = isPdf ? "" : editText.trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  }, [editText, isPdf]);

  // Approximate Token calculations for Gemini model footprint (standard estimate ~4 char per token average)
  const estimatedTokens = useMemo(() => {
    return Math.max(Math.ceil(activeCharCount / 4), 1);
  }, [activeCharCount]);

  if (!isOpen) return null;

  const handleProceed = () => {
    onConfirm(isPdf ? "" : editText);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="parsing-preview-modal-overlay">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left">
        
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-200/60 flex justify-between items-center shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Smart Pre-parse validation
            </span>
            <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-amber-600" />
              Document Analysis Preparation Workspace
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Workspace Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/20">
          
          {/* File/Snippet Metadata Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* File name indicator */}
            <div className="bg-white border border-slate-250 border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Target Document</span>
              <span className="text-xs font-bold text-slate-700 truncate block font-sans" title={fileName}>
                {fileName}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isPdf ? "Uploaded PDF Document" : "Pasted Specification Text"}
              </span>
            </div>

            {/* Token footprints */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Content Stats</span>
              <span className="text-xs font-bold text-slate-700 font-mono block">
                {activeCharCount.toLocaleString()} Characters
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {!isPdf && `${activeWordCount.toLocaleString()} Words / `}~{estimatedTokens.toLocaleString()} Estimated Tokens
              </span>
            </div>

            {/* Density Matches status */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Heuristic Density</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-sm font-black ${
                  heuristicMetrics.total >= 5 
                    ? "text-emerald-600" 
                    : heuristicMetrics.total >= 1 
                    ? "text-amber-600" 
                    : "text-rose-600"
                }`}>
                  {heuristicMetrics.total} Matches
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {heuristicMetrics.total >= 5 ? "HIGH" : heuristicMetrics.total >= 1 ? "MODERATE" : "ZERO CONTENT?"}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">
                T: {heuristicMetrics.trainingMatches} | OM: {heuristicMetrics.omMatches} | W: {heuristicMetrics.warrantyMatches}
              </span>
            </div>
          </div>

          {/* Warning banner if zero patterns matched */}
          {heuristicMetrics.total === 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl flex items-start gap-3 text-xs text-amber-900 leading-normal">
              <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
              <div className="space-y-1">
                <strong className="font-bold">Caution: Low Keyword Relevance Identified</strong>
                <p className="text-[11px] text-slate-500 font-medium">
                  We scanned this text and found 0 occurrences of standard CSI MasterFormat submittal terms (e.g. instruction hours, warranty, O&M manuals). The AI model can still process it, but ensure this is execution/submittal text.
                </p>
              </div>
            </div>
          )}

          {/* Main content context */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isPdf ? "Uploaded PDF Document Text Preview" : "Specification Text Editor & Boilerplate Cropper"}
              </span>
              {!isPdf && (
                <span className="text-[10px] text-indigo-650 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <Scissors size={10} /> Feel free to crop out boilerplate to save tokens!
                </span>
              )}
            </div>

            {isPdf ? (
              <div className="bg-slate-100 p-5 rounded-2xl text-xs text-slate-500 font-medium border border-slate-200 text-center py-10 font-sans">
                <Info size={28} className="text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">PDF Document Stream Ready</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1">
                  Because this is a binary PDF container, raw text cannot be manipulated directly in the web cache before parsing. The model receives this PDF directly.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 justify-between">
                  <span>Mutable Text Context:</span>
                  <span>Double check for PART 3 - EXECUTION submittals</span>
                </div>
                <textarea
                  id="parsing-edit-area"
                  rows={10}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-4 py-3 text-xs md:text-sm font-mono border-0 focus:ring-0 outline-none leading-relaxed bg-white/40 h-[220px]"
                  placeholder="Paste or write specification lines here..."
                />
              </div>
            )}
          </div>

          {/* Quick-Audit guide */}
          <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Bookmark size={11} className="text-indigo-500" /> Estimators Preflight Audit Heuristics:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">Owner Demonstration</span>
                <span className="text-[10px] text-slate-400 block leading-relaxed">
                  Heuristic scan found {heuristicMetrics.trainingMatches} keywords matching personnel instruction, field demonstration, or instructional hours.
                </span>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-100 md:pt-0 pt-2.5 md:pl-4">
                <span className="text-[10px] font-bold text-slate-500 block">O&M Submittals</span>
                <span className="text-[10px] text-slate-400 block leading-relaxed">
                  Heuristic scan found {heuristicMetrics.omMatches} keywords matching parts listings, manufacturer binders, DDC schematics, or warranties.
                </span>
              </div>
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-100 md:pt-0 pt-2.5 md:pl-4">
                <span className="text-[10px] font-bold text-slate-500 block">Warranties & Guarantees</span>
                <span className="text-[10px] text-slate-400 block leading-relaxed">
                  Heuristic scan found {heuristicMetrics.warrantyMatches} extended terms, guarantees, correction periods, or starting submittal clauses.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-700 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel / Go Back
          </button>
          <button
            id="btn-confirm-and-process-gemini"
            type="button"
            onClick={handleProceed}
            className="px-5 py-2 bg-slate-900 border border-slate-950 font-bold text-white rounded-xl shadow-xs text-xs hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play size={12} /> Confirm & Run AI Extraction
          </button>
        </div>
      </div>
    </div>
  );
}
