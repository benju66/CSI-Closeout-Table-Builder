import { useState, useMemo } from "react";
import { 
  FileSearch, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Copy,
  Check,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  Sliders
} from "lucide-react";

interface PredefinedTemplate {
  name: string;
  category: "Training" | "O&M" | "Warranty";
  text: string;
}

const SPEC_TEMPLATES: PredefinedTemplate[] = [
  {
    name: "HVAC Training (Excellent)",
    category: "Training",
    text: "Provide a minimum of 16 classroom hours and 8 hands-on hours of instruction to the Owner's maintenance team. The instruction shall be led by a factory-certified technician and cover complete system troubleshooting, filter replacements, and Direct Digital Control (DDC) thermostat scheduling. Provide structural DVDs and digital video records of all training sessions."
  },
  {
    name: "Electrical Switchgear O&M (Good)",
    category: "O&M",
    text: "Submit three (3) color-coded operation and maintenance manuals in hardcopy format and one digitized PDF copy on a USB drive. Binders must include complete manufacturer datasheets, circuit breaker trip settings, step-by-step startup instructions, and factory test reports of current transformers."
  },
  {
    name: "Roofing Extended Guarantee (At Risk)",
    category: "Warranty",
    text: "The roofing contractor shall guarantee the membrane to be free from defects for a standard period of years. If water leaks occur during subsequent operations, the installer shall return to reconstruct the insulation boundaries. Standard manufacturer exclusions apply."
  }
];

interface TerminologyMatcherProps {
  customKeywords?: {
    training: string[];
    om: string[];
    warranty: string[];
    asBuilt: string[];
  };
  onUpdateKeywords?: (keywords: { training: string[]; om: string[]; warranty: string[]; asBuilt: string[] }) => void;
  showCriticalGaps?: boolean;
  showValueEngineering?: boolean;
}

export default function TerminologyMatcher({ 
  customKeywords, 
  onUpdateKeywords,
  showCriticalGaps = true,
  showValueEngineering = true
}: TerminologyMatcherProps) {
  const [testText, setTestText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // States for inline dictionary slider manager
  const [isDictOpen, setIsDictOpen] = useState(false);
  const [activeDictTab, setActiveDictTab] = useState<"training" | "om" | "warranty" | "asBuilt">("training");
  const [newWordInput, setNewWordInput] = useState("");

  const defaultKeywords = {
    training: ["train", "instruction", "personnel", "demonstrate", "classroom", "hands-on", "hours of instruction", "classroom hours", "certified", "video"],
    om: ["manual", "o&m", "spare parts", "schematic", "datasheet", "hardcopy", "pdf", "maintenance binder", "operation manual", "maintenance data"],
    warranty: ["warranty", "guarantee", "correction period", "defect", "substantial completion", "years", "extended warranty", "manufacturer warranty"],
    asBuilt: ["as-built", "redline", "record drawings", "cad", "bim", "record specifications", "markups"]
  };

  const currentKeywords = useMemo(() => {
    return {
      training: customKeywords?.training || defaultKeywords.training,
      om: customKeywords?.om || defaultKeywords.om,
      warranty: customKeywords?.warranty || defaultKeywords.warranty,
      asBuilt: customKeywords?.asBuilt || defaultKeywords.asBuilt
    };
  }, [customKeywords]);

  const handleAddInlineWord = () => {
    if (!onUpdateKeywords) return;
    const word = newWordInput.trim().toLowerCase();
    if (!word) return;
    
    const existingList = currentKeywords[activeDictTab] || [];
    if (existingList.includes(word)) {
      setNewWordInput("");
      return;
    }
    
    const updated = {
      ...currentKeywords,
      [activeDictTab]: [...existingList, word]
    };
    onUpdateKeywords(updated);
    setNewWordInput("");
  };

  const handleRemoveInlineWord = (wordToRemove: string) => {
    if (!onUpdateKeywords) return;
    const updated = {
      ...currentKeywords,
      [activeDictTab]: (currentKeywords[activeDictTab] || []).filter(w => w !== wordToRemove)
    };
    onUpdateKeywords(updated);
  };

  const handleResetInlineWords = () => {
    if (!onUpdateKeywords) return;
    if (confirm("Reset current terminology rules back to closeout industry defaults?")) {
      onUpdateKeywords(defaultKeywords);
    }
  };

  // Analyze the pasted specification clause
  const evaluation = useMemo(() => {
    if (!testText.trim()) return null;

    const trimmed = testText.toLowerCase();

    const tWords = currentKeywords.training;
    const omWords = currentKeywords.om;
    const wWords = currentKeywords.warranty;

    // Convert terms to phrase objects with score
    const trainingPhrases = tWords.map((word) => ({
      key: word.toLowerCase(),
      label: word.length > 20 ? word : `Clause: "${word}"`,
      score: Math.max(Math.floor(100 / Math.max(tWords.length, 1)), 10)
    }));

    const omPhrases = omWords.map((word) => ({
      key: word.toLowerCase(),
      label: word.length > 20 ? word : `Clause: "${word}"`,
      score: Math.max(Math.floor(100 / Math.max(omWords.length, 1)), 10)
    }));

    const warrantyPhrases = wWords.map((word) => ({
      key: word.toLowerCase(),
      label: word.length > 20 ? word : `Clause: "${word}"`,
      score: Math.max(Math.floor(100 / Math.max(wWords.length, 1)), 10)
    }));

    const matchedTraining = trainingPhrases.filter(p => trimmed.includes(p.key));
    const matchedOM = omPhrases.filter(p => trimmed.includes(p.key));
    const matchedWarranty = warrantyPhrases.filter(p => trimmed.includes(p.key));

    // Determine primary category
    let primaryCategory: "Training" | "O&M" | "Warranty" = "Training";
    const tLen = matchedTraining.length;
    const oLen = matchedOM.length;
    const wLen = matchedWarranty.length;

    if (oLen > tLen && oLen > wLen) primaryCategory = "O&M";
    else if (wLen > tLen && wLen > oLen) primaryCategory = "Warranty";

    // Calculate score based on selected category matches
    let score = 0;
    let requiredMatches: typeof trainingPhrases = [];

    if (primaryCategory === "Training") {
      requiredMatches = trainingPhrases;
      matchedTraining.forEach(m => score += m.score);
    } else if (primaryCategory === "O&M") {
      requiredMatches = omPhrases;
      matchedOM.forEach(m => score += m.score);
    } else {
      requiredMatches = warrantyPhrases;
      matchedWarranty.forEach(m => score += m.score);
    }

    // Caps score at 100
    score = Math.min(score, 100);
    if (score === 0) score = 15; // baseline if there's text

    // Formulate warnings & advice
    const advice: string[] = [];
    const gaps: string[] = [];

    if (primaryCategory === "Training") {
      if (!trimmed.includes("hours")) {
        gaps.push("Ambiguous Classroom/Hands-on Hours: Specify actual duration (e.g., 'minimum 8 hours of training').");
      }
      if (!trimmed.includes("video") && !trimmed.includes("record")) {
        advice.push("Consider demanding video/audio recording of all instructional cycles for future hires.");
      }
      if (!trimmed.includes("certified")) {
        advice.push("Mandate that instruction is delivered by 'factory-authorized representative' for compliance safety.");
      }
    } else if (primaryCategory === "O&M") {
      if (!trimmed.includes("pdf") && !trimmed.includes("digital")) {
        gaps.push("Missing Digitization Clause: Clearly state requirements for searchable, bookmarked multi-page PDFs.");
      }
      if (!trimmed.includes("binder") && !trimmed.includes("hardcopy")) {
        advice.push("Double-check if the facility team requires traditional hardcopy binders or has transitioned to client cloud.");
      }
    } else {
      if (!trimmed.includes("substantial completion")) {
        gaps.push("Unsecured Warranty Trigger Date: Always anchor warranty start date exactly on 'Substantial Completion' to protect the owner.");
      }
      if (!trimmed.includes("year") && !trimmed.includes("duration")) {
        gaps.push("Indefinite Term length: Clearly write years/duration (e.g., '10-Year Extended Warranty').");
      }
    }

    return {
      primaryCategory,
      score,
      matchedTraining,
      matchedOM,
      matchedWarranty,
      gaps,
      advice,
      matchedPhrases: primaryCategory === "Training" ? matchedTraining : primaryCategory === "O&M" ? matchedOM : matchedWarranty
    };
  }, [testText, customKeywords]);

  // Color text highlighter helper
  const highlightedText = useMemo(() => {
    if (!testText) return "";

    let text = testText;

    const tWords = currentKeywords.training;
    const omWords = currentKeywords.om;
    const wWords = currentKeywords.warranty;
    const abWords = currentKeywords.asBuilt;

    // Build matching dictionary array
    const highlightWords: { word: RegExp; class: string; key: string }[] = [];

    tWords.forEach((word) => {
      const esc = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      highlightWords.push({
        word: new RegExp(`\\b${esc}\\w*\\b`, "gi"),
        class: "bg-amber-100/95 font-bold border-b-2 border-amber-400 text-amber-950 px-0.5 rounded-xs",
        key: word
      });
    });

    omWords.forEach((word) => {
      const esc = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      highlightWords.push({
        word: new RegExp(`\\b${esc}\\w*\\b|o&m`, "gi"),
        class: "bg-violet-100/95 font-bold border-b-2 border-violet-400 text-violet-950 px-0.5 rounded-xs",
        key: word
      });
    });

    wWords.forEach((word) => {
      const esc = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      highlightWords.push({
        word: new RegExp(`\\b${esc}\\w*\\b`, "gi"),
        class: "bg-rose-100/95 font-bold border-b-2 border-rose-400 text-rose-950 px-0.5 rounded-xs",
        key: word
      });
    });

    abWords.forEach((word) => {
      const esc = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      highlightWords.push({
        word: new RegExp(`\\b${esc}\\w*\\b`, "gi"),
        class: "bg-emerald-100/95 font-bold border-b-2 border-emerald-400 text-emerald-950 px-0.5 rounded-xs",
        key: word
      });
    });

    // Sort to highlight longer multi-word phrases first to avoid nested markup collision
    highlightWords.sort((a, b) => b.key.length - a.key.length);

    highlightWords.forEach(({ word, class: cls }) => {
      text = text.replace(word, (match) => `<span class="${cls}">${match}</span>`);
    });

    return text;
  }, [testText, currentKeywords]);

  const keywordCount = useMemo(() => {
    return currentKeywords.training.length + 
           currentKeywords.om.length + 
           currentKeywords.warranty.length + 
           currentKeywords.asBuilt.length;
  }, [currentKeywords]);

  const handleCopy = () => {
    navigator.clipboard.writeText(testText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="terminology-matcher-root">
      {/* Overview header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-205 shadow-sm text-left">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-slate-900 rounded-sm inline-block"></span>
            Spec-Specific Terminology Matcher
            <button
              onClick={() => setShowInstructions(true)}
              className="p-1 text-slate-400 hover:text-[#0B1A3F] hover:bg-[#0B1A3F]/5 border border-slate-100/60 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center tooltip"
              title="Click to view tool guide and instructions"
              id="matcher-info-icon-btn"
            >
              <Info size={16} />
            </button>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time compliance validation and clause scoring. Check individual paragraphs for contract risks and essential submittal triggers.
          </p>
          <div className="flex items-center gap-4 flex-wrap mt-1">
            <div className="flex items-center gap-1.5 text-[10px] text-violet-700 bg-violet-50/60 border border-violet-100/50 px-2.5 py-1 rounded-md font-bold font-sans">
              <Sparkles size={11} className="text-violet-600 shrink-0" />
              <span>Workspace Sync:</span>
              <span className="text-slate-500 font-medium">Using {keywordCount} terminology/heuristic overrides.</span>
            </div>
            {onUpdateKeywords && (
              <button
                type="button"
                onClick={() => setIsDictOpen(!isDictOpen)}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100/60 border border-violet-150 px-2.5 py-1 rounded-md transition-all cursor-pointer"
              >
                <Sliders size={11} />
                {isDictOpen ? "Close Dictionary Manager" : "Manage Dictionary Inline ✎"}
              </button>
            )}
          </div>
        </div>

        {/* Quick select templates dropdown */}
        <div className="relative inline-block text-left" id="preset-selector-dropdown">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0 font-sans">
              <BookOpen size={11} /> Presets:
            </span>
            <select
              id="template-preset-dropdown-select"
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const found = SPEC_TEMPLATES.find(t => t.name === val);
                  if (found) setTestText(found.text);
                }
              }}
              className="px-2.5 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-205 rounded-xl font-bold transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer text-left"
            >
              <option value="" disabled>-- Load Template Preset --</option>
              {SPEC_TEMPLATES.map((tpl, i) => (
                <option key={i} value={tpl.name}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inline Dictionary Manager Panel */}
      {isDictOpen && onUpdateKeywords && (
        <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-xs space-y-4 text-left animate-fade-in" id="inline-dictionary-manager">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-violet-600 rounded-xs"></span>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Dynamic Spec Terminology Dictionary
              </h4>
            </div>
            <button
              type="button"
              onClick={handleResetInlineWords}
              className="text-[10px] text-violet-750 hover:text-violet-900 font-bold bg-violet-50 hover:bg-violet-100/60 px-2.5 py-1 rounded border border-violet-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={10} /> Reset Defaults
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal font-sans">
            Customize closeout terminology keywords below. Modifying words dynamic-binds the spec highlighter, compliance checklists, and risk scoring calculators.
          </p>

          {/* Dictionary Category Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold" id="inline-dict-tabs-row">
            {(["training", "om", "warranty", "asBuilt"] as const).map((tab) => {
              const tabLabels = {
                training: "Training",
                om: "O&M Manual",
                warranty: "Warranty",
                asBuilt: "Record Drawings / As-Built"
              };
              const isActive = activeDictTab === tab;
              const count = currentKeywords[tab]?.length || 0;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveDictTab(tab);
                    setNewWordInput("");
                  }}
                  className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all text-[10px] font-bold truncate cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 border border-slate-205 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 font-semibold"
                  }`}
                >
                  {tabLabels[tab]} ({count})
                </button>
              );
            })}
          </div>

          {/* Quick inline insert */}
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={40}
              placeholder={`Add custom phrase for "${activeDictTab}" (e.g. 'certified', 'substantialCompletion')...`}
              value={newWordInput}
              onChange={(e) => setNewWordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddInlineWord();
                }
              }}
              className="flex-1 px-3.5 py-1.8 text-xs border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none placeholder:text-slate-400 bg-white"
            />
            <button
              type="button"
              onClick={handleAddInlineWord}
              disabled={!newWordInput.trim()}
              className="px-4 py-1.8 text-xs font-bold bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-3xs"
            >
              <Plus size={11} /> Add
            </button>
          </div>

          {/* tags wrap */}
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
            {(!currentKeywords[activeDictTab] || currentKeywords[activeDictTab].length === 0) ? (
              <span className="text-[10px] text-slate-400 italic py-1 px-1">No keywords defined for this category.</span>
            ) : (
              currentKeywords[activeDictTab].map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-lg bg-white border border-slate-205 text-[10px] font-bold text-slate-700 font-mono shadow-3xs"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => handleRemoveInlineWord(word)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Input box section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <label htmlFor="matcher-text" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Draft Specification Clause or Paragraph
            </label>
            {testText && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1 px-2 text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 rounded border border-slate-200 flex items-center gap-1"
                >
                  {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                  {copied ? "Copied" : "Copy Raw"}
                </button>
                <button
                  type="button"
                  onClick={() => setTestText("")}
                  className="text-xs text-slate-400 hover:text-red-500 font-medium"
                >
                  Reset Clause
                </button>
              </div>
            )}
          </div>

          <textarea
            id="matcher-text"
            rows={10}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Type or paste any specification paragraph here (e.g. instruction requirements, O&M directives, or warranty periods) to instantly score its coverage and structural health..."
            className="w-full h-full min-h-[220px] px-3.5 py-3 text-xs md:text-sm border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0B1A3F] bg-slate-50/20 font-mono outline-none leading-relaxed placeholder:text-slate-400"
          />

          <div className="p-3 bg-[#0B1A3F]/5 border border-[#0B1A3F]/15 rounded-xl flex items-start gap-2 text-[11px] text-[#0B1A3F] font-medium leading-relaxed">
            <HelpCircle size={14} className="text-[#0B1A3F] shrink-0 mt-0.5" />
            <p>
              <strong>Heuristic Highlighter:</strong> Typographical entities referring to times, manuals, deliverables, and start-up triggers are highlighted above in real-time as you write. Use this to audit for specific submittal clauses.
            </p>
          </div>
        </div>

        {/* Results Analysis Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          {!testText.trim() ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
              <FileSearch size={40} className="text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Awaiting Clause Context</p>
              <p className="text-[10px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                Paste a technical specification paragraph or select one of the templates above to see keyword match diagnostics, compliance scores, and risk advice.
              </p>
            </div>
          ) : (
            <div className="space-y-5 flex-1">
              {/* Category and Score */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Identified Focus Space</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                    evaluation?.primaryCategory === "Training" 
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : evaluation?.primaryCategory === "O&M"
                      ? "bg-[#0B1A3F]/10 text-[#0B1A3F] border border-[#0B1A3F]/20"
                      : "bg-rose-100 text-rose-900 border border-rose-200"
                  }`}>
                    {evaluation?.primaryCategory === "Training" ? "Owner Demonstration & Training" : evaluation?.primaryCategory === "O&M" ? "Operation & Maintenance Manuals" : "System Warranties & Commitments"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Index</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xl font-black ${
                      (evaluation?.score ?? 0) >= 80 
                        ? "text-emerald-600" 
                        : (evaluation?.score ?? 0) >= 40 
                        ? "text-amber-600" 
                        : "text-rose-600"
                    }`}>
                      {evaluation?.score}%
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {(evaluation?.score ?? 0) >= 80 ? "STRONG" : (evaluation?.score ?? 0) >= 40 ? "MODERATE" : "RISK STATE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Highlight Copy */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Keyword Match Highlighter</span>
                <div 
                  className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-xs font-normal text-slate-700 leading-relaxed max-h-[120px] overflow-y-auto font-sans text-left"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              </div>

              {/* Matched Keywords Grid */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Matched Criteria Indicators ({evaluation?.matchedPhrases.length})</span>
                {evaluation?.matchedPhrases.length === 0 ? (
                  <span className="text-[10px] text-slate-400 italic block">No exact specialized match triggers identified in the paragraph.</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation?.matchedPhrases.map((phrase, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium leading-none">
                        <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                        {phrase.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Critical Gaps (Severe Warnings) */}
              {showCriticalGaps && evaluation?.gaps && evaluation.gaps.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block font-sans">Critical Gaps / Contract Risks ({evaluation.gaps.length})</span>
                  <div className="space-y-1.5">
                    {evaluation.gaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] bg-red-50/45 border border-red-100 p-2 rounded-lg text-red-800 leading-normal">
                        <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
                        <span className="font-medium">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Operational Best Practices (Advice) */}
              {showValueEngineering && evaluation?.advice && evaluation.advice.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-[#0B1A3F] uppercase tracking-wider block font-sans">Value Engineering Best Practices ({evaluation.advice.length})</span>
                  <div className="space-y-1">
                    {evaluation.advice.map((adv, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600 leading-normal font-sans">
                        <ArrowRight size={10} className="text-[#0B1A3F] shrink-0 mt-1" />
                        <span>{adv}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Perfect State confirmation */}
              {showCriticalGaps && evaluation?.gaps.length === 0 && (
                <div className="p-3 bg-emerald-50/55 border border-emerald-100 rounded-xl flex items-center gap-2 text-[10px] text-emerald-900 font-medium">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  No system/contract risks detected! This specification clause is structurally secure.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Informative Step-by-Step Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="matcher-instructions-modal">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-200/60 flex justify-between items-center shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#0B1A3F] bg-[#0B1A3F]/5 border border-[#0B1A3F]/15 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Interactive Guide
                </span>
                <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
                  <Info size={16} className="text-[#0B1A3F] animate-pulse" />
                  CSI Terminology Matcher Instructions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Introduction Card */}
              <div className="p-4 bg-[#0B1A3F]/5 border border-[#0B1A3F]/15 rounded-2xl flex items-start gap-3 text-xs text-[#0B1A3F] leading-normal">
                <Sparkles className="text-[#0B1A3F] mt-0.5 shrink-0" size={16} />
                <div className="space-y-1">
                  <strong className="font-bold flex items-center gap-1">What is the CSI Terminology Matcher?</strong>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    This tool operates as an instant heuristic quality-auditing assistant. It checks drafted specification clauses against standard CSI MasterFormat submittal terms. It scores text sections, flags missing legal anchors, highlights key parameters, and serves as a first-line defense before final contract issuance.
                  </p>
                </div>
              </div>

              {/* Three Core Closeout Segments */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Key Columns & Categories Checked:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Category 1 */}
                  <div className="bg-amber-50/20 border border-amber-200 p-4 rounded-xl text-left">
                    <span className="inline-block px-1.5 py-0.5 bg-amber-100/80 text-amber-950 text-[9px] font-black uppercase tracking-wider rounded mb-2">
                      1. Owner Training
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                      Scans for classroom & hands-on durations, video recording deliverables, and certified instructing credentials to guarantee hands-on technician proficiency.
                    </p>
                  </div>

                  {/* Category 2 */}
                  <div className="bg-[#0B1A3F]/5 border border-[#0B1A3F]/15 p-4 rounded-xl text-left">
                    <span className="inline-block px-1.5 py-0.5 bg-[#0B1A3F]/10 text-[#0B1A3F] text-[9px] font-black uppercase tracking-wider rounded mb-2">
                      2. O&M Manuals
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                      Checks for physical hardcopy requirements, flow schematics, spare parts checklists, and multi-page digitized, searchable PDF formats.
                    </p>
                  </div>

                  {/* Category 3 */}
                  <div className="bg-rose-50/20 border border-rose-200 p-4 rounded-xl text-left">
                    <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-950 text-[9px] font-black uppercase tracking-wider rounded mb-2">
                      3. Warranty Terms
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                      Verifies concrete term durations, defect warranties, and alerts if the start date isn't anchored on <em>Substantial Completion</em>.
                    </p>
                  </div>

                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-3 font-sans">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  How to Use the Tool:
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex gap-2 items-start bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="w-5 h-5 bg-[#0B1A3F] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    <div>
                      <strong>Input Clause Text:</strong> Paste or type any specification clause in the left textarea, OR click one of the loadable template buttons at the top right to instantly populate compliant or risky examples.
                    </div>
                  </li>
                  <li className="flex gap-2 items-start bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="w-5 h-5 bg-[#0B1A3F] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <div>
                      <strong>Live Highlighting:</strong> The Heuristic Highlighter instantly emphasizes recognized phrases representing durations, submittals, or triggers in appropriate thematic colors.
                    </div>
                  </li>
                  <li className="flex gap-2 items-start bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="w-5 h-5 bg-[#0B1A3F] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <div>
                      <strong>Audit Score & Gaps:</strong> Review the calculated Compliance Index on the right. Key in on &quot;Critical Gaps&quot; (red alerts) to fix missing milestones and apply our &quot;Value Engineering Best Practices&quot; to secure operations.
                    </div>
                  </li>
                </ul>
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="px-5 py-1.8 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Got It, Let's Go
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
