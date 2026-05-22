import React, { useState, useMemo } from "react";
import { RequirementItem, OMRequirementItem, WarrantyRequirementItem, AsBuiltRequirementItem } from "../types";
import {
  Search,
  Download,
  Trash2,
  Edit3,
  ArrowUpDown,
  FileSpreadsheet,
  Info,
  Layers,
  X,
  BookOpen
} from "lucide-react";
import * as XLSX from "xlsx";

// Unified row projection type
interface UnifiedRow {
  rowId: string; // Unique key for the unified view
  originalId: string;
  category: "training" | "om" | "warranty" | "asbuilt"; // record type
  csiCode: string;
  sectionName: string;
  type: string; // Type specific label
  description: string;
  duration?: string; // only for warranties
  sourceExcerpt: string;
  sourceFile: string;
}

interface UnifiedMasterTableProps {
  requirements: RequirementItem[];
  omRequirements: OMRequirementItem[];
  warrantyRequirements: WarrantyRequirementItem[];
  asBuiltRequirements?: AsBuiltRequirementItem[];
  onDeleteTraining: (id: string) => void;
  onDeleteOM: (id: string) => void;
  onDeleteWarranty: (id: string) => void;
  onDeleteAsBuilt: (id: string) => void;
  onUpdateTraining: (updated: RequirementItem) => void;
  onUpdateOM: (updated: OMRequirementItem) => void;
  onUpdateWarranty: (updated: WarrantyRequirementItem) => void;
  onUpdateAsBuilt: (updated: AsBuiltRequirementItem) => void;
}

export default function UnifiedMasterTable({
  requirements,
  omRequirements,
  warrantyRequirements,
  asBuiltRequirements = [],
  onDeleteTraining,
  onDeleteOM,
  onDeleteWarranty,
  onDeleteAsBuilt,
  onUpdateTraining,
  onUpdateOM,
  onUpdateWarranty,
  onUpdateAsBuilt,
}: UnifiedMasterTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "training" | "om" | "warranty" | "asbuilt">("all");
  
  // Excerpt preview tracking
  const [previewExcerptItem, setPreviewExcerptItem] = useState<UnifiedRow | null>(null);
  
  // Editor modal tracking
  const [editingRow, setEditingRow] = useState<UnifiedRow | null>(null);

  // Sorting tracking
  const [sortKey, setSortKey] = useState<keyof UnifiedRow>("csiCode");
  const [sortAsc, setSortAsc] = useState(true);

  // Projection list combining all four datasets
  const unifiedRows = useMemo(() => {
    const rows: UnifiedRow[] = [];

    // Map Training
    requirements.forEach((item) => {
      rows.push({
        rowId: `training-${item.id}`,
        originalId: item.id,
        category: "training",
        csiCode: item.csiCode,
        sectionName: item.sectionName,
        type: item.type,
        description: item.description,
        sourceExcerpt: item.sourceExcerpt,
        sourceFile: item.sourceFile,
      });
    });

    // Map O&M
    omRequirements.forEach((item) => {
      rows.push({
        rowId: `om-${item.id}`,
        originalId: item.id,
        category: "om",
        csiCode: item.csiCode,
        sectionName: item.sectionName,
        type: item.type,
        description: item.description,
        sourceExcerpt: item.sourceExcerpt,
        sourceFile: item.sourceFile,
      });
    });

    // Map Warranties
    warrantyRequirements.forEach((item) => {
      rows.push({
        rowId: `warranty-${item.id}`,
        originalId: item.id,
        category: "warranty",
        csiCode: item.csiCode,
        sectionName: item.sectionName,
        type: item.type,
        description: item.description,
        duration: item.duration,
        sourceExcerpt: item.sourceExcerpt,
        sourceFile: item.sourceFile,
      });
    });

    // Map As-Builts
    asBuiltRequirements.forEach((item) => {
      rows.push({
        rowId: `asbuilt-${item.id}`,
        originalId: item.id,
        category: "asbuilt",
        csiCode: item.csiCode,
        sectionName: item.sectionName,
        type: item.type,
        description: item.description,
        sourceExcerpt: item.sourceExcerpt,
        sourceFile: item.sourceFile,
      });
    });

    return rows;
  }, [requirements, omRequirements, warrantyRequirements, asBuiltRequirements]);

  // Handle item deletions
  const handleDeleteRow = (row: UnifiedRow) => {
    if (confirm("Are you sure you want to delete this recorded schedule item?")) {
      if (row.category === "training") {
        onDeleteTraining(row.originalId);
      } else if (row.category === "om") {
        onDeleteOM(row.originalId);
      } else if (row.category === "warranty") {
        onDeleteWarranty(row.originalId);
      } else if (row.category === "asbuilt") {
        onDeleteAsBuilt(row.originalId);
      }
    }
  };

  // Handle item updates
  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    if (editingRow.category === "training") {
      onUpdateTraining({
        id: editingRow.originalId,
        csiCode: editingRow.csiCode.trim(),
        sectionName: editingRow.sectionName.trim(),
        type: editingRow.type as any,
        description: editingRow.description.trim(),
        sourceExcerpt: editingRow.sourceExcerpt.trim(),
        sourceFile: editingRow.sourceFile.trim(),
      });
    } else if (editingRow.category === "om") {
      onUpdateOM({
        id: editingRow.originalId,
        csiCode: editingRow.csiCode.trim(),
        sectionName: editingRow.sectionName.trim(),
        type: editingRow.type.trim(),
        description: editingRow.description.trim(),
        sourceExcerpt: editingRow.sourceExcerpt.trim(),
        sourceFile: editingRow.sourceFile.trim(),
      });
    } else if (editingRow.category === "warranty") {
      onUpdateWarranty({
        id: editingRow.originalId,
        csiCode: editingRow.csiCode.trim(),
        sectionName: editingRow.sectionName.trim(),
        type: editingRow.type.trim(),
        duration: editingRow.duration?.trim() || "Not Specified",
        description: editingRow.description.trim(),
        sourceExcerpt: editingRow.sourceExcerpt.trim(),
        sourceFile: editingRow.sourceFile.trim(),
      });
    } else if (editingRow.category === "asbuilt") {
      onUpdateAsBuilt({
        id: editingRow.originalId,
        csiCode: editingRow.csiCode.trim(),
        sectionName: editingRow.sectionName.trim(),
        type: editingRow.type.trim(),
        description: editingRow.description.trim(),
        sourceExcerpt: editingRow.sourceExcerpt.trim(),
        sourceFile: editingRow.sourceFile.trim(),
      });
    }

    setEditingRow(null);
  };

  // Filtering and Sorting logic
  const filteredAndSorted = useMemo(() => {
    return unifiedRows
      .filter((row) => {
        // Category filters
        if (categoryFilter !== "all" && row.category !== categoryFilter) {
          return false;
        }

        // Search term filter
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        return (
          row.csiCode.toLowerCase().includes(query) ||
          row.sectionName.toLowerCase().includes(query) ||
          row.description.toLowerCase().includes(query) ||
          row.type.toLowerCase().includes(query) ||
          (row.duration && row.duration.toLowerCase().includes(query)) ||
          row.sourceFile.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const valA = (a[sortKey] || "").toString().toLowerCase();
        const valB = (b[sortKey] || "").toString().toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [unifiedRows, categoryFilter, searchQuery, sortKey, sortAsc]);

  const toggleSort = (key: keyof UnifiedRow) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Single unified sheet generator excel download
  const triggerUnifiedExcel = () => {
    if (unifiedRows.length === 0) {
      alert("No logged items are available in the current workspace.");
      return;
    }

    const exportData = filteredAndSorted.map((item, index) => ({
      "No.": index + 1,
      "CSI Section Code": item.csiCode,
      "Specification Section Name": item.sectionName,
      "Workspace Category": item.category === "asbuilt" ? "RECORD / AS-BUILT" : item.category.toUpperCase(),
      "Requirement Type": item.type === "Both" ? "Training & Demonstration" : item.type,
      "Duration (Warranties only)": item.category === "warranty" ? item.duration : "N/A",
      "Log Material Description": item.description,
      "CSI Verification Excerpt": item.sourceExcerpt,
      "Source Document": item.sourceFile,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const wscols = [
      { wch: 6 },   // No.
      { wch: 18 },  // CSI Section Code
      { wch: 35 },  // Specification Section Name
      { wch: 20 },  // Workspace Category
      { wch: 22 },  // Requirement Type
      { wch: 25 },  // Duration
      { wch: 65 },  // Log Material Description
      { wch: 45 },  // CSI Verification Excerpt
      { wch: 25 },  // Source Document
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unified Master Log");
    XLSX.writeFile(workbook, "CSI_Unified_Master_Log_Schedules.xlsx");
  };

  return (
    <div className="space-y-6" id="unified-master-schedule">
      {/* Search and export toolbar controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-slate-900 rounded-sm inline-block"></span>
            Unified Workspace Master Schedule
          </h2>
          <p className="text-xs text-slate-500">
            A combined view aggregate mapping multi-disciplinary fields (Training, O&M submittals, System warranties, and AsBuilt drawings) together.
          </p>
        </div>

        <div>
          {/* Combined excel Export */}
          <button
            id="btn-unified-excel-export-log-tab"
            onClick={triggerUnifiedExcel}
            disabled={unifiedRows.length === 0}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs hover:shadow ${
              unifiedRows.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <Download size={14} />
            Export Combined Schedule (.xlsx)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left" id="unified-grid-container">
        {/* Filter sub bar search and filter tags */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Query Filter input */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              id="search-unified-grid-input"
              type="text"
              placeholder="Search CSI, section name, descriptions, durations, or file names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.8 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Quick interactive category selector tags */}
          <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-start md:justify-end">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Layers size={11} className="text-slate-400" /> Filter Logs:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
                  categoryFilter === "all"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All ({unifiedRows.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("training")}
                className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
                  categoryFilter === "training"
                    ? "bg-amber-600 border-amber-600 text-white"
                    : "bg-white border-slate-200 text-amber-800 hover:bg-amber-50"
                }`}
              >
                Training Only ({requirements.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("om")}
                className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
                  categoryFilter === "om"
                    ? "bg-indigo-650 border-indigo-650 bg-indigo-600 text-white"
                    : "bg-white border-slate-200 text-indigo-850 hover:bg-indigo-50"
                }`}
              >
                O&M Directives ({omRequirements.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("warranty")}
                className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
                  categoryFilter === "warranty"
                    ? "bg-rose-600 border-rose-600 text-white"
                    : "bg-white border-slate-200 text-rose-850 hover:bg-rose-50"
                }`}
              >
                Warranties ({warrantyRequirements.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("asbuilt")}
                className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
                  categoryFilter === "asbuilt"
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "bg-white border-slate-200 text-teal-850 hover:bg-teal-50"
                }`}
              >
                As-Built / Redline ({asBuiltRequirements.length})
              </button>
            </div>
          </div>
        </div>

        {/* Combined Grid List View */}
        <div className="overflow-x-auto">
          {filteredAndSorted.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileSpreadsheet size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">No items detected or matched filter criteria</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Refine the spelling or drop spec texts on the Dashboard to populate workspace logs.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-slate-600" id="unified-master-table">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-450 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-[11%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("csiCode")}>
                    <div className="flex items-center gap-1">
                      CSI Code
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[18%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("sectionName")}>
                    <div className="flex items-center gap-1">
                      Section Name
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[14%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("category")}>
                    <div className="flex items-center gap-1">
                      Schedule Category
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[12%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("type")}>
                    <div className="flex items-center gap-1">
                      Specific Type
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[33%]">Requirement Scope Detail</th>
                  <th className="py-3 px-4 w-[7%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("sourceFile")}>
                    <div className="flex items-center gap-1">
                      Source
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[5%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSorted.map((item) => (
                  <tr key={item.rowId} className="hover:bg-slate-50/30 transition-colors align-top" id={`row-unified-${item.rowId}`}>
                    {/* CSI Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {item.csiCode || "—"}
                    </td>

                    {/* Section Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-750 text-slate-700">
                      {item.sectionName}
                    </td>

                    {/* Category Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        item.category === "training"
                          ? "bg-amber-100 text-amber-900 border-amber-200"
                          : item.category === "om"
                          ? "bg-indigo-100 text-indigo-900 border-indigo-200"
                          : item.category === "warranty"
                          ? "bg-rose-100 text-rose-900 border-rose-200"
                          : "bg-teal-100 text-teal-900 border-teal-200"
                      }`}>
                        {item.category === "training" ? "Owner Training" : item.category === "om" ? "O&M Documents" : item.category === "warranty" ? "Warranty" : "Record / As-Built"}
                      </span>
                    </td>

                    {/* Specific Item Type Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-semibold text-[11px]">
                      {item.type === "Both" ? "Training & Demonstration" : item.type}
                    </td>

                    {/* Details scope */}
                    <td className="py-3.5 px-4 leading-relaxed text-slate-600">
                      <div className="space-y-1.5 text-left">
                        <p>{item.description}</p>
                        
                        {/* Render Warranty-specific Duration tag */}
                        {item.category === "warranty" && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-100/60 rounded text-[10px] text-rose-800 font-bold font-sans">
                            Term length: <strong className="text-rose-950 font-black">{item.duration || "Not Specified"}</strong>
                          </div>
                        )}

                        {item.sourceExcerpt && (
                          <button
                            id={`btn-open-excerpt-unified-${item.rowId}`}
                            onClick={() => setPreviewExcerptItem(item)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-[10px] font-mono text-slate-450 text-slate-500 hover:text-slate-700 px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Info size={10} /> View Source Excerpt Verify
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Source file reference */}
                    <td className="py-3.5 px-4 font-medium text-slate-400 truncate max-w-[110px]" title={item.sourceFile}>
                      {item.sourceFile}
                    </td>

                    {/* Actions column */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`btn-edit-unified-${item.rowId}`}
                          onClick={() => setEditingRow(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-650 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modify schedule metadata"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          id={`btn-delete-unified-${item.rowId}`}
                          onClick={() => handleDeleteRow(item)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete from schedule"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Excerpt Verification pop over Modal */}
      {previewExcerptItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="excerpt-verification-unified-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5 text-left text-slate-800">
                <Info size={14} className="text-slate-500" />
                CSI Verification Excerpt ({previewExcerptItem.category.toUpperCase()})
              </h3>
              <button
                type="button"
                onClick={() => setPreviewExcerptItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-left">
              <div className="flex gap-2">
                <span className="font-mono text-xs text-slate-900 font-black bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm">
                  {previewExcerptItem.csiCode}
                </span>
                <span className="font-bold text-xs text-slate-850 text-slate-800">
                  {previewExcerptItem.sectionName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Reference Source Document:
                </span>
                <span className="text-xs text-slate-700 font-mono italic">
                  {previewExcerptItem.sourceFile}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Verification Clause matched:
                </span>
                <div className="bg-slate-50 border-l-2 border-indigo-500 p-3.5 text-xs text-slate-705 leading-relaxed font-mono rounded-r-lg whitespace-pre-line text-left">
                  "{previewExcerptItem.sourceExcerpt || "No verification clause was recorded."}"
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewExcerptItem(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                Dismiss Excerpt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor dialog modal sheet for category edits */}
      {editingRow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="unified-item-edit-modal">
          <form onSubmit={handleSaveEditSubmit} className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden text-left">
            <div className="bg-slate-50 p-4 border-b border-slate-150 flex justify-between items-center mr-1">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Edit3 size={16} className="text-indigo-600" />
                Modify Logged {editingRow.category.toUpperCase()} Record
              </h3>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-unified-code" className="block text-xs font-semibold text-slate-500 mb-1">CSI Section Code</label>
                  <input
                    id="edit-unified-code"
                    type="text"
                    required
                    value={editingRow.csiCode}
                    onChange={(e) => setEditingRow({ ...editingRow, csiCode: e.target.value })}
                    className="w-full px-3 py-1.8 text-xs border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg outline-none font-medium"
                  />
                </div>
                <div>
                  <label htmlFor="edit-unified-name" className="block text-xs font-semibold text-slate-500 mb-1">Section Name</label>
                  <input
                    id="edit-unified-name"
                    type="text"
                    required
                    value={editingRow.sectionName}
                    onChange={(e) => setEditingRow({ ...editingRow, sectionName: e.target.value })}
                    className="w-full px-3 py-1.8 text-xs border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Specific requirement/doc type */}
                <div>
                  <label htmlFor="edit-unified-type" className="block text-xs font-semibold text-slate-500 mb-1">Specific Item Type</label>
                  {editingRow.category === "training" ? (
                    <select
                      id="edit-unified-type"
                      value={editingRow.type}
                      onChange={(e) => setEditingRow({ ...editingRow, type: e.target.value })}
                      className="w-full px-3 py-1.8 text-xs border border-slate-200 rounded-lg bg-white outline-none font-medium"
                    >
                      <option value="Training">Training</option>
                      <option value="Demonstration">Demonstration</option>
                      <option value="Both">Both</option>
                    </select>
                  ) : editingRow.category === "asbuilt" ? (
                    <select
                      id="edit-unified-type"
                      value={editingRow.type}
                      onChange={(e) => setEditingRow({ ...editingRow, type: e.target.value })}
                      className="w-full px-3 py-1.8 text-xs border border-slate-200 rounded-lg bg-white outline-none font-medium"
                    >
                      <option value="As-Built Drawings">As-Built Drawings</option>
                      <option value="Redline Drawings">Redline Drawings</option>
                      <option value="Record Drawings">Record Drawings</option>
                      <option value="Record Specifications">Record Specifications</option>
                    </select>
                  ) : (
                    <input
                      id="edit-unified-type"
                      type="text"
                      required
                      value={editingRow.type}
                      onChange={(e) => setEditingRow({ ...editingRow, type: e.target.value })}
                      className="w-full px-3 py-1.8 text-xs border border-slate-200 rounded-lg outline-none font-medium"
                    />
                  )}
                </div>

                {/* Duration term specifically for warranties */}
                {editingRow.category === "warranty" && (
                  <div>
                    <label htmlFor="edit-unified-duration" className="block text-xs font-semibold text-rose-700/85 mb-1 font-bold">Warranty Term Duration</label>
                    <input
                      id="edit-unified-duration"
                      type="text"
                      placeholder="e.g. 5 Years or Lifetime"
                      value={editingRow.duration || ""}
                      onChange={(e) => setEditingRow({ ...editingRow, duration: e.target.value })}
                      className="w-full px-3 py-1.8 text-xs border border-rose-200 bg-rose-50/15 focus:ring-1 focus:ring-rose-500 rounded-lg outline-none font-medium"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="edit-unified-desc" className="block text-xs font-semibold text-slate-500 mb-1">Schedule Log Description</label>
                <textarea
                  id="edit-unified-desc"
                  rows={3}
                  required
                  value={editingRow.description}
                  onChange={(e) => setEditingRow({ ...editingRow, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg outline-none leading-relaxed font-normal"
                />
              </div>

              <div>
                <label htmlFor="edit-unified-excerpt" className="block text-xs font-semibold text-slate-400 font-mono mb-1">Source Excerpt verification Text</label>
                <textarea
                  id="edit-unified-excerpt"
                  rows={3}
                  value={editingRow.sourceExcerpt}
                  onChange={(e) => setEditingRow({ ...editingRow, sourceExcerpt: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs text-slate-650 bg-slate-50 font-mono border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg outline-none leading-relaxed animate-fade-in font-normal"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Discard Edits
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-slate-900 border border-slate-950 font-semibold text-white rounded-lg hover:bg-slate-850 shadow-sm cursor-pointer"
              >
                Confirm Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
