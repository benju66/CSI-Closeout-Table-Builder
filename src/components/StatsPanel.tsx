import { RequirementItem, OMRequirementItem, WarrantyRequirementItem, AsBuiltRequirementItem } from "../types";
import { BookOpen, CheckSquare, Target, BarChart3 } from "lucide-react";

interface StatsPanelProps {
  requirements: RequirementItem[];
  omRequirements: OMRequirementItem[];
  warrantyRequirements: WarrantyRequirementItem[];
  asBuiltRequirements?: AsBuiltRequirementItem[];
  fileCount: number;
}

export default function StatsPanel({
  requirements,
  omRequirements,
  warrantyRequirements,
  asBuiltRequirements = [],
  fileCount,
}: StatsPanelProps) {
  // Count types
  const trainingCount = requirements.length;
  const omCount = omRequirements.length;
  const warrantyCount = warrantyRequirements.length;
  const asBuiltCount = asBuiltRequirements.length;

  // Find most common CSI division across all four datasets
  const getTopCsiDivisions = () => {
    const counts: Record<string, number> = {};
    const allItems = [
      ...requirements,
      ...omRequirements,
      ...warrantyRequirements,
      ...asBuiltRequirements
    ];
    
    allItems.forEach((r) => {
      const cleaned = (r.csiCode || "").replace(/[^0-9]/g, "").trim();
      const division = cleaned.slice(0, 2);
      if (division && division.length === 2) {
        counts[division] = (counts[division] || 0) + 1;
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return "N/A";
    const divName = (div: string) => {
      switch (div) {
        case "01": return "Div 01 General";
        case "08": return "Div 08 Door / Security";
        case "11": return "Div 11 Equipment";
        case "14": return "Div 14 Conveying";
        case "21": return "Div 21 Fire Suppression";
        case "22": return "Div 22 Plumbing";
        case "23": return "Div 23 HVAC / Mech";
         case "25": return "Div 25 Control Automation";
        case "26": return "Div 26 Electrical";
        case "27": return "Div 27 Comm Lines";
        case "28": return "Div 28 Electronic Safety";
        default: return `Division ${div}`;
      }
    };
    return `${divName(sorted[0][0])} (${sorted[0][1]} items)`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-panel">
      {/* Total Sections Analyzed Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4" id="stat-card-sections">
        <div className="p-3 bg-amber-50 rounded-lg text-amber-700">
          <BookOpen size={20} />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Specs Analyzed
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">
            {fileCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Documents or pasted text inputs
          </span>
        </div>
      </div>

      {/* Total Items Formatted Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4" id="stat-card-requirements">
        <div className="p-3 bg-[#0B1A3F]/5 rounded-lg text-[#0B1A3F]">
          <CheckSquare size={20} />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Logged Items
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">
            {requirements.length + omRequirements.length + warrantyRequirements.length + asBuiltRequirements.length}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block leading-relaxed">
            <span className="text-amber-700 font-semibold">{requirements.length} Trn</span> &bull; <span className="text-[#0B1A3F] font-semibold">{omRequirements.length} O&M</span> &bull; <span className="text-rose-700 font-semibold">{warrantyRequirements.length} War</span> &bull; <span className="text-teal-700 font-semibold">{asBuiltRequirements.length} Rec</span>
          </span>
        </div>
      </div>

      {/* Target Breakdown Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4" id="stat-card-breakdown">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-700">
          <Target size={20} />
        </div>
        <div className="flex-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Log Breakdown
          </span>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-500">Training:</span>
              <span className="font-semibold text-slate-800">{trainingCount}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-500">O&M Manuals:</span>
              <span className="font-semibold text-slate-800">{omCount}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-500">Warranties:</span>
              <span className="font-semibold text-slate-800">{warrantyCount}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-500">As-Built / Redline:</span>
              <span className="font-semibold text-slate-800">{asBuiltCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Common Division Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4" id="stat-card-division">
        <div className="p-3 bg-[#0B1A3F]/5 rounded-lg text-[#0B1A3F]">
          <BarChart3 size={20} />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Highest Division Frequency
          </span>
          <span className="text-lg font-bold text-slate-800 mt-1.5 block truncate max-w-[180px]">
            {getTopCsiDivisions()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Across all logged CSI lists
          </span>
        </div>
      </div>
    </div>
  );
}
