import { useState, FormEvent, useEffect } from "react";
import {
  X,
  Settings,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Plus,
  Sparkles,
  Sliders,
  Database
} from "lucide-react";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectDescription: string;
  showCriticalGaps?: boolean;
  showValueEngineering?: boolean;
  customKeywords?: {
    training: string[];
    om: string[];
    warranty: string[];
    asBuilt: string[];
  };
  onSaveSettings: (
    name: string,
    description: string,
    projectId: string,
    showCriticalGaps: boolean,
    showValueEngineering: boolean
  ) => void;
  onSaveKeywords?: (keywords: { training: string[]; om: string[]; warranty: string[]; asBuilt: string[] }) => void;
  onClearData: (type: "training" | "om" | "warranty" | "files" | "all") => void;
  onDeleteProject: () => void;
}

export default function ProjectSettingsModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectDescription,
  showCriticalGaps = true,
  showValueEngineering = true,
  customKeywords,
  onSaveSettings,
  onSaveKeywords,
  onClearData,
  onDeleteProject,
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab ] = useState<"general" | "dictionary" | "maintenance">("general");
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectDescription);
  const [localProjectId, setLocalProjectId] = useState(projectId);
  const [localShowCriticalGaps, setLocalShowCriticalGaps] = useState(showCriticalGaps);
  const [localShowValueEngineering, setLocalShowValueEngineering] = useState(showValueEngineering);

  // Keep track of the active editing categories and keywords list
  const [activeKeywordTab, setActiveKeywordTab] = useState<"training" | "om" | "warranty" | "asBuilt">("training");
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [localKeywords, setLocalKeywords] = useState<{
    training: string[];
    om: string[];
    warranty: string[];
    asBuilt: string[];
  }>({
    training: [],
    om: [],
    warranty: [],
    asBuilt: []
  });

  // Sync state with open transitions
  useEffect(() => {
    if (isOpen) {
      setActiveTab("general");
      setName(projectName);
      setDescription(projectDescription);
      setLocalProjectId(projectId);
      setLocalShowCriticalGaps(showCriticalGaps !== false);
      setLocalShowValueEngineering(showValueEngineering !== false);

      const defaultKeywords = {
        training: ["train", "instruction", "personnel", "demonstrate", "classroom", "hands-on", "hours of instruction", "classroom hours", "certified", "video"],
        om: ["manual", "o&m", "spare parts", "schematic", "datasheet", "hardcopy", "pdf", "maintenance binder", "operation manual", "maintenance data"],
        warranty: ["warranty", "guarantee", "correction period", "defect", "substantial completion", "years", "extended warranty", "manufacturer warranty"],
        asBuilt: ["as-built", "redline", "record drawings", "cad", "bim", "record specifications", "markups"]
      };

      setLocalKeywords({
        training: customKeywords?.training || [...defaultKeywords.training],
        om: customKeywords?.om || [...defaultKeywords.om],
        warranty: customKeywords?.warranty || [...defaultKeywords.warranty],
        asBuilt: customKeywords?.asBuilt || [...defaultKeywords.asBuilt]
      });
    }
  }, [isOpen, projectId, projectName, projectDescription, showCriticalGaps, showValueEngineering, customKeywords]);

  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim().toLowerCase();
    if (!trimmed) return;

    setLocalKeywords(prev => {
      const currentList = prev[activeKeywordTab] || [];
      if (currentList.includes(trimmed)) {
        setNewKeywordInput("");
        return prev;
      }
      const updated = {
        ...prev,
        [activeKeywordTab]: [...currentList, trimmed]
      };
      onSaveKeywords?.(updated);
      return updated;
    });
    setNewKeywordInput("");
  };

  const handleRemoveKeyword = (wordToRemove: string) => {
    setLocalKeywords(prev => {
      const updated = {
        ...prev,
        [activeKeywordTab]: (prev[activeKeywordTab] || []).filter(w => w !== wordToRemove)
      };
      onSaveKeywords?.(updated);
      return updated;
    });
  };

  const handleResetKeywordsToDefault = () => {
    const defaultKeywords = {
      training: ["train", "instruction", "personnel", "demonstrate", "classroom", "hands-on", "hours of instruction", "classroom hours", "certified", "video"],
      om: ["manual", "o&m", "spare parts", "schematic", "datasheet", "hardcopy", "pdf", "maintenance binder", "operation manual", "maintenance data"],
      warranty: ["warranty", "guarantee", "correction period", "defect", "substantial completion", "years", "extended warranty", "manufacturer warranty"],
      asBuilt: ["as-built", "redline", "record drawings", "cad", "bim", "record specifications", "markups"]
    };
    if (confirm("Reset all parsing keyword overrides back to industry defaults for this workspace?")) {
      setLocalKeywords(defaultKeywords);
      onSaveKeywords?.(defaultKeywords);
    }
  };

  if (!isOpen) return null;

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveSettings(
      name.trim(),
      description.trim(),
      localProjectId.trim(),
      localShowCriticalGaps,
      localShowValueEngineering
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="project-settings-root-modal">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-205 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Title area */}
        <div className="bg-slate-50 p-5 border-b border-slate-150 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-700">
              <Settings size={16} />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-805 text-slate-900">Workspace Settings</h3>
              <p className="text-[10px] text-slate-500 font-medium font-sans">Configure workspace assets, terminology rules, and operational resets.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-450 hover:text-slate-600 p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Primary Tab Navigation Bar */}
        <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center justify-start gap-1 shrink-0" id="settings-modal-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-indigo-50 text-indigo-950 border border-indigo-150 font-semibold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Sliders size={13} />
            Properties
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dictionary")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "dictionary"
                ? "bg-violet-50 text-violet-950 border border-violet-150 font-semibold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Sparkles size={13} className="text-violet-600 font-bold" />
            AI & Heuristics Dictionary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("maintenance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "maintenance"
                ? "bg-amber-50 text-amber-955 border border-amber-150 font-semibold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Database size={13} />
            Maintenance & Resets
          </button>
        </div>

        {/* Modal scrolling context body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          
          {/* TAB 1: General Info */}
          {activeTab === "general" && (
            <form onSubmit={handleFormSubmit} className="space-y-4" id="form-project-meta">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span className="w-1.5 h-3.5 bg-indigo-600 rounded-xs"></span>
                <h4 className="text-[11px] font-black text-slate-705 text-slate-700 uppercase tracking-widest leading-none">Workspace Properties</h4>
              </div>

              <div className="space-y-4 font-sans">
                <div>
                  <label htmlFor="settings-project-name" className="block text-[11px] font-bold text-slate-550 mb-1">
                    Project Name *
                  </label>
                  <input
                    id="settings-project-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-900 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This name labels exported Excel logs and internal specification lists.</p>
                </div>

                <div>
                  <label htmlFor="settings-project-id" className="block text-[11px] font-bold text-slate-550 mb-1">
                    Project Code / ID
                  </label>
                  <input
                    id="settings-project-id"
                    type="text"
                    placeholder="e.g. PRJ-2026A"
                    value={localProjectId}
                    onChange={(e) => setLocalProjectId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-900 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unique numeric or alphanumeric reference code representing this contract.</p>
                </div>

                <div>
                  <label htmlFor="settings-project-desc" className="block text-[11px] font-bold text-slate-550 mb-1">
                    Workspace Description
                  </label>
                  <textarea
                    id="settings-project-desc"
                    rows={3}
                    maxLength={180}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-600 bg-white leading-relaxed placeholder:text-slate-300"
                    placeholder="Provide spec revision details, facility codes, or project scope milestones..."
                  />
                </div>

                <div className="border-t border-slate-150 pt-4 space-y-3">
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Heuristics & Audits Feature Flags</h5>
                  
                  <div className="flex items-start gap-2.5">
                    <input
                      id="toggle-critical-gaps"
                      type="checkbox"
                      checked={localShowCriticalGaps}
                      onChange={(e) => setLocalShowCriticalGaps(e.target.checked)}
                      className="w-3.5 h-3.5 mt-0.5 accent-indigo-600 rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <label htmlFor="toggle-critical-gaps" className="text-xs font-bold text-slate-900 block cursor-pointer">
                        Enable Critical Gaps & Contract Risks Analysis
                      </label>
                      <span className="text-[10px] text-slate-500 block font-normal">Scans clauses for indefinite terms, missing legal triggers, and severe risks.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      id="toggle-value-engineering"
                      type="checkbox"
                      checked={localShowValueEngineering}
                      onChange={(e) => setLocalShowValueEngineering(e.target.checked)}
                      className="w-3.5 h-3.5 mt-0.5 accent-indigo-600 rounded cursor-pointer"
                    />
                    <div className="text-left">
                      <label htmlFor="toggle-value-engineering" className="text-xs font-bold text-slate-900 block cursor-pointer">
                        Enable Value Engineering Recommendations
                      </label>
                      <span className="text-[10px] text-slate-500 block font-normal">Generates proactive advice regarding recording submittals and certified technician hours.</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed font-semibold">
                  <strong>Applying properties:</strong> Adjusting these fields updates the metadata globally. Be sure to click <em>Apply Workspace Changes</em> below to confirm descriptors.
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    id="btn-save-project-meta"
                    type="submit"
                    disabled={!name.trim()}
                    className="px-4.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
                  >
                    Apply Workspace Changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: AI & Heuristics Tuning */}
          {activeTab === "dictionary" && (
            <div className="space-y-4 animate-fade-in" id="settings-parser-tuning-section">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 p-0">
                  <span className="w-1.5 h-3.5 bg-violet-600 rounded-xs"></span>
                  <h4 className="text-[11px] font-black text-slate-705 text-slate-700 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <Sparkles size={11} className="text-violet-600" />
                    Custom Spec Terminology Dictionary
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleResetKeywordsToDefault}
                  className="text-[10px] text-violet-750 hover:text-violet-900 font-bold bg-violet-50 hover:bg-violet-100/60 px-2.5 py-1 rounded-lg border border-violet-100 transition-colors flex items-center gap-1 cursor-pointer"
                  id="reset-keywords-btn"
                >
                  <RefreshCw size={10} /> Reset Defaults
                </button>
              </div>

              <p className="text-[11px] text-slate-450 font-medium leading-relaxed font-sans">
                Configure custom contract keywords for the <strong>{projectName}</strong> workspace. Terms added here dynamically steer the interactive highlighter, technical compliance score calculation, and custom specification models!
              </p>

              {/* Keyword Columns selector pills */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold" id="keyword-cats-selector-row">
                {(["training", "om", "warranty", "asBuilt"] as const).map((tab) => {
                  const labels = {
                    training: "Training",
                    om: "O&M Manual",
                    warranty: "Warranty",
                    asBuilt: "Record / As-Built"
                  };
                  const isActive = activeKeywordTab === tab;
                  const kwArray = localKeywords[tab] || [];
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveKeywordTab(tab);
                        setNewKeywordInput("");
                      }}
                      className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all text-[10px] font-bold truncate cursor-pointer ${
                        isActive
                          ? "bg-white text-slate-900 border border-slate-200/50 shadow-2xs font-semibold"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                      }`}
                    >
                      {labels[tab]} ({kwArray.length})
                    </button>
                  );
                })}
              </div>

              {/* Input rule */}
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={40}
                  placeholder={`Add custom "${activeKeywordTab}" phrase (e.g. "certify", "hands-on checkout", "spare load")...`}
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  className="flex-1 px-3.5 py-1.8 text-xs border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none placeholder:text-slate-400 bg-white"
                  id="input-new-keyword-rule"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  disabled={!newKeywordInput.trim()}
                  className="px-4 py-1.8 text-xs font-bold bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-1 shrink-0 shadow-3xs cursor-pointer"
                  id="add-keyword-rule-btn"
                >
                  <Plus size={11} /> Add
                </button>
              </div>

              {/* Keyword tag badges container */}
              <div className="flex flex-wrap gap-1.5 max-h-[170px] overflow-y-auto p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl" id="keywords-tags-container">
                {(!localKeywords[activeKeywordTab] || localKeywords[activeKeywordTab].length === 0) ? (
                  <span className="text-[10px] text-slate-400 italic py-1 px-2 font-semibold">No custom keywords specified for this category. Add overrides above.</span>
                ) : (
                  localKeywords[activeKeywordTab].map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-lg bg-white border border-slate-205 text-[10px] font-bold text-slate-700 font-mono shadow-3xs"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(word)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl text-[10px] text-violet-900 leading-normal font-semibold font-sans">
                <strong>Why customize?</strong> Construction specifications often feature unique localized jargon like &quot;hands-on checkout&quot; or &quot;bonded guarantee&quot;. Synchronizing these terms ensures immediate structural highlights during drag-and-drop processing.
              </div>
            </div>
          )}

          {/* TAB 3: Maintenance & Resets */}
          {activeTab === "maintenance" && (
            <div className="space-y-6 animate-fade-in" id="settings-maintenance-tab">
              
              {/* Surgical Clearance section */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <span className="w-1.5 h-3.5 bg-amber-500 rounded-xs"></span>
                  <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider leading-none">Surgical Data Clearance</h4>
                </div>
                <p className="text-[11px] text-slate-450 font-medium leading-relaxed font-sans">
                  Clear individual data logs to clean up parsed documents or adjust requirements without recreating the entire custom workspace.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="clearance-ops-grid">
                  {/* Reset Owner Training log */}
                  <button
                    id="btn-clear-training-data"
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all Owner Training logs from this project? This is irreversible.")) {
                        onClearData("training");
                      }
                    }}
                    className="flex flex-col items-start p-3.5 text-left border border-amber-200 bg-amber-50/15 hover:bg-amber-50/40 rounded-xl transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">Owner Training</span>
                    <span className="text-[9px] text-slate-450 mb-2 leading-snug">Wipe all classroom instructions & demonstration items.</span>
                    <span className="text-[10px] text-amber-700 font-bold mt-auto flex items-center gap-1 group-hover:text-amber-900">
                      <RefreshCw size={10} className="animate-spin-slow" /> Clear Training Logs
                    </span>
                  </button>

                  {/* Reset O&M data logs */}
                  <button
                    id="btn-clear-om-data"
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all O&M Manual items from this project? This is irreversible.")) {
                        onClearData("om");
                      }
                    }}
                    className="flex flex-col items-start p-3.5 text-left border border-indigo-200 bg-indigo-50/15 hover:bg-indigo-50/40 rounded-xl transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-extrabold text-indigo-805 text-indigo-800 uppercase tracking-wider mb-1">O&M Manuals</span>
                    <span className="text-[9px] text-slate-450 mb-2 leading-snug">Wipe all operation & maintenance submittal specifications.</span>
                    <span className="text-[10px] text-indigo-700 font-bold mt-auto flex items-center gap-1 group-hover:text-indigo-900">
                      <RefreshCw size={10} className="animate-spin-slow" /> Clear O&M Logs
                    </span>
                  </button>

                  {/* Reset Warranties logs */}
                  <button
                    id="btn-clear-warranty-data"
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all Warranties and Guarantees from this project? This is irreversible.")) {
                        onClearData("warranty");
                      }
                    }}
                    className="flex flex-col items-start p-3.5 text-left border border-rose-200 bg-rose-50/15 hover:bg-rose-50/40 rounded-xl transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider mb-1 font-sans">Warranties</span>
                    <span className="text-[9px] text-slate-450 mb-2 leading-snug">Wipe special/manufacturer warranty guarantees only.</span>
                    <span className="text-[10px] text-rose-700 font-bold mt-auto flex items-center gap-1 group-hover:text-rose-950">
                      <RefreshCw size={10} className="animate-spin-slow" /> Clear Warranties Logs
                    </span>
                  </button>

                  {/* Reset Uploaded files tracking logs */}
                  <button
                    id="btn-clear-files-data"
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear the uploaded file processing history? This won't wipe the logged requirements.")) {
                        onClearData("files");
                      }
                    }}
                    className="flex flex-col items-start p-3.5 text-left border border-slate-205 bg-slate-50/40 hover:bg-slate-100/40 rounded-xl transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">File Queue</span>
                    <span className="text-[9px] text-slate-450 mb-2 leading-snug">Reset PDF/TXT processing records and upload counters.</span>
                    <span className="text-[10px] text-slate-600 font-bold mt-auto flex items-center gap-1 group-hover:text-slate-800">
                      <RefreshCw size={10} className="animate-spin-slow" /> Reset File Queue
                    </span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5 border-b border-red-100 pb-1.5">
                  <span className="w-1.5 h-3.5 bg-red-600 rounded-xs"></span>
                  <h4 className="text-[11px] font-black text-red-750 text-red-700 uppercase tracking-wider leading-none">Absolute Workspace Danger Zone</h4>
                </div>

                <div className="p-4 bg-red-50/35 border border-red-100/80 rounded-2xl space-y-4">
                  <div className="flex items-start gap-2.5 text-left">
                    <AlertTriangle className="text-red-600 shrink-0 mt-0.5 animate-pulse" size={16} />
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-red-950">Irreversible Administration Boundaries</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold font-sans">
                        These procedures delete elements permanently. Backup custom tables or spreadsheets before executing critical actions.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-red-100/50">
                    {/* Reset entire project */}
                    <button
                      id="btn-settings-reset-all-data"
                      type="button"
                      onClick={() => {
                        if (confirm("Are you majorly sure? This will wipe ALL sheets (Training, O&M, Warranties, Record Documents) AND files in this project immediately!")) {
                          onClearData("all");
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 text-red-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RefreshCw size={12} /> Clear All Project Data
                    </button>

                    {/* Delete workspace completely */}
                    <button
                      id="btn-settings-delete-project-absolute"
                      type="button"
                      onClick={() => {
                        if (confirm(`CRITICAL: Are you absolutely sure you want to permanently DELETE the "${projectName}" workspace? This removes everything.`)) {
                          onDeleteProject();
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 border border-red-750 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      <Trash2 size={12} /> Delete Workspace
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-end shrink-0">
          <button
            id="btn-close-settings-modal"
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 shadow-xs transition-colors cursor-pointer border border-slate-950"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
