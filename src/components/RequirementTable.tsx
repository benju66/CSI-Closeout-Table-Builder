import { useState, FormEvent } from "react";
import { RequirementItem } from "../types";
import {
  Search,
  Download,
  Trash2,
  Edit3,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  Check,
  X,
  PlusCircle,
  HelpCircle,
  Info
} from "lucide-react";
import * as XLSX from "xlsx";

interface RequirementTableProps {
  requirements: RequirementItem[];
  onDeleteRequirement: (id: string) => void;
  onUpdateRequirement: (updated: RequirementItem) => void;
  onAddRequirement: (newReq: Omit<RequirementItem, "id">) => void;
}

export default function RequirementTable({
  requirements,
  onDeleteRequirement,
  onUpdateRequirement,
  onAddRequirement,
}: RequirementTableProps) {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<RequirementItem | null>(null);

  // Manual entry states
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualType, setManualType] = useState<"Training" | "Demonstration" | "Both">("Training");
  const [manualDesc, setManualDesc] = useState("");
  const [manualExcerpt, setManualExcerpt] = useState("");
  const [manualSourceFile, setManualSourceFile] = useState("Manual Entry");

  // Selection state for viewing excerpt
  const [previewExcerptItem, setPreviewExcerptItem] = useState<RequirementItem | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<keyof RequirementItem>("csiCode");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: keyof RequirementItem) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const clearManualForm = () => {
    setManualCode("");
    setManualName("");
    setManualType("Training");
    setManualDesc("");
    setManualExcerpt("");
    setManualSourceFile("Manual Entry");
    setIsAddingManual(false);
  };

  const handleAddManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || !manualName.trim() || !manualDesc.trim()) {
      alert("Please fill in the CSI Section Code, Name, and Description.");
      return;
    }
    onAddRequirement({
      csiCode: manualCode.trim(),
      sectionName: manualName.trim(),
      type: manualType,
      description: manualDesc.trim(),
      sourceExcerpt: manualExcerpt.trim() || "Manually added by engineer.",
      sourceFile: manualSourceFile.trim() || "Manual Entry",
    });
    clearManualForm();
  };

  // Filter and sort items
  const filteredItems = requirements
    .filter((item) => {
      const matchesSearch =
        item.csiCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceFile.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "All" || item.type === typeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const valA = (a[sortKey] || "").toString().toLowerCase();
      const valB = (b[sortKey] || "").toString().toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  // Export spreadsheet using xlsx SheetJS
  const triggerExcelExport = () => {
    if (requirements.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Convert keys to clean human-readable headers
    const exportData = filteredItems.map((item, index) => ({
      "No.": index + 1,
      "CSI Section Code": item.csiCode,
      "Specification Section Name": item.sectionName,
      "Requirement Type": item.type === "Both" ? "Training & Demonstration" : item.type,
      "Log Requirement Description": item.description,
      "Verification Text Code / Source Excerpt": item.sourceExcerpt,
      "Source Document": item.sourceFile,
    }));

    // Generate grid
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Apply specific column widths for superb Excel layout
    const wscols = [
      { wch: 6 },   // No.
      { wch: 18 },  // CSI Section Code
      { wch: 35 },  // Specification Section Name
      { wch: 18 },  // Requirement Type
      { wch: 65 },  // Log Requirement Description
      { wch: 45 },  // Verification Text Code / Source Excerpt
      { wch: 25 },  // Source Document
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Owner Training Requirements");

    // Excel direct export download
    XLSX.writeFile(workbook, "CSI_Owner_Training_Requirements_Log.xlsx");
  };

  return (
    <div className="space-y-6" id="owner-training-table-container">
      {/* Table header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-amber-600 rounded-sm inline-block"></span>
            Owner Training Log Table
          </h2>
          <p className="text-xs text-slate-500">
            CSI MasterFormat sections matching training, commissioning demonstration, or instructional rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Add Manual Item Button */}
          <button
            id="btn-toggle-add-manual"
            onClick={() => setIsAddingManual(!isAddingManual)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-sky-950 bg-sky-50 hover:bg-sky-100 border border-sky-100/30 rounded-lg transition-colors shadow-xs"
          >
            <Plus size={14} />
            Add Manual Log
          </button>

          {/* Excel Export Button */}
          <button
            id="btn-export-excel"
            onClick={triggerExcelExport}
            disabled={requirements.length === 0}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm ${
              requirements.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Download size={14} />
            Export to Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Manual log add form */}
      {isAddingManual && (
        <form
          onSubmit={handleAddManualSubmit}
          className="bg-sky-50/50 border border-sky-100 p-6 rounded-2xl space-y-4 shadow-xs"
          id="manual-addition-form"
        >
          <div className="flex justify-between items-center pb-2 border-b border-sky-100">
            <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle size={14} /> New Owner Training Log Row
            </h3>
            <button
              type="button"
              onClick={clearManualForm}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="manual-code" className="block text-[11px] font-semibold text-slate-500 mb-1">
                CSI Section Code *
              </label>
              <input
                id="manual-code"
                type="text"
                placeholder="e.g. 26 24 16"
                required
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="manual-name" className="block text-[11px] font-semibold text-slate-500 mb-1">
                Specification Section Name *
              </label>
              <input
                id="manual-name"
                type="text"
                placeholder="e.g. Switchboards"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="manual-type" className="block text-[11px] font-semibold text-slate-500 mb-1">
                Requirement Type *
              </label>
              <select
                id="manual-type"
                value={manualType}
                onChange={(e) => setManualType(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 outline-none"
              >
                <option value="Training">Training</option>
                <option value="Demonstration">Demonstration</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manual-desc" className="block text-[11px] font-semibold text-slate-500 mb-1">
                Requirement Description *
              </label>
              <textarea
                id="manual-desc"
                rows={3}
                required
                placeholder="Provide details about components, required hours, attendees, and general trainer operations."
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="manual-excerpt" className="block text-[11px] font-semibold text-slate-500 mb-1">
                Source Document Excerpt (Verification)
              </label>
              <textarea
                id="manual-excerpt"
                rows={3}
                placeholder="Paste the relevant sentence or paragraph from the PDF/TXT for document verification audits."
                value={manualExcerpt}
                onChange={(e) => setManualExcerpt(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manual-source-file" className="block text-[11px] font-semibold text-slate-500 mb-1">
                Source Document Reference Name
              </label>
              <input
                id="manual-source-file"
                type="text"
                value={manualSourceFile}
                onChange={(e) => setManualSourceFile(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="flex items-end justify-end gap-2.5">
              <button
                type="button"
                onClick={clearManualForm}
                className="px-4 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                id="btn-submit-manual-item"
                type="submit"
                className="px-5 py-1.5 text-xs bg-amber-600 border border-amber-700 text-white font-semibold rounded-lg hover:bg-amber-700 shadow-sm"
              >
                Save Record
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Table filters and table grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="spec-table-container-inner">
        {/* Sorting & Search SubBar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search field */}
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              id="search-table-query"
              type="text"
              placeholder="Filter by Code, Name, Description, or Source File..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Type:</span>
            <select
              id="select-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500 outline-none font-medium text-slate-700 shrink-0"
            >
              <option value="All">All Types</option>
              <option value="Training">Training Only</option>
              <option value="Demonstration">Demonstration Only</option>
              <option value="Both">Both Requirements</option>
            </select>
          </div>
        </div>

        {/* Requirements Data Table */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400" id="table-empty-state">
              <FileSpreadsheet size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">No matching Owner Training requirements logged</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">
                Upload specification files or use the text paste workspace tab above to parse records using Gemini automatically.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-slate-600" id="owner-training-table">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-[12%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("csiCode")}>
                    <div className="flex items-center gap-1">
                      CSI Code
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[22%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("sectionName")}>
                    <div className="flex items-center gap-1">
                      Section Name
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[12%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("type")}>
                    <div className="flex items-center gap-1">
                      Type
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[36%]">Description</th>
                  <th className="py-3 px-4 w-[12%] cursor-pointer select-none hover:text-slate-800" onClick={() => toggleSort("sourceFile")}>
                    <div className="flex items-center gap-1">
                      Source
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[6%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/5 transition-colors align-top" id={`row-req-${item.id}`}>
                    {/* CSI CODE */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {item.csiCode || "—"}
                    </td>

                    {/* SECTION NAME */}
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {item.sectionName}
                    </td>

                    {/* BADGE */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                          item.type === "Training"
                            ? "bg-amber-50 text-amber-800 border border-amber-100"
                            : item.type === "Demonstration"
                            ? "bg-blue-50 text-blue-800 border border-blue-100"
                            : "bg-[#0B1A3F]/5 text-[#0B1A3F] border border-[#0B1A3F]/15"
                        }`}
                      >
                        {item.type === "Both" ? "Training & Demonstration" : item.type}
                      </span>
                    </td>

                    {/* DESCRIPTION */}
                    <td className="py-3 px-4 leading-relaxed text-slate-600">
                      <div className="space-y-1.5">
                        <p>{item.description}</p>
                        {item.sourceExcerpt && (
                          <button
                            id={`btn-open-excerpt-${item.id}`}
                            onClick={() => setPreviewExcerptItem(item)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-[10px] font-mono text-slate-500 hover:text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                          >
                            <Info size={10} /> View Excerpt verification
                          </button>
                        )}
                      </div>
                    </td>

                    {/* SOURCE FILE */}
                    <td className="py-3 px-4 font-medium text-slate-400 truncate max-w-[120px]" title={item.sourceFile}>
                      {item.sourceFile}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-edit-item-${item.id}`}
                          onClick={() => setSelectedItem(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit log row"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          id={`btn-delete-item-${item.id}`}
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this recorded log entry?")) {
                              onDeleteRequirement(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete entry"
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

      {/* Edit Item Modal sheet popup */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-item-modal">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit3 size={16} className="text-amber-600" />
                Modify Logged Training Requirement
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-code" className="block text-xs font-semibold text-slate-500 mb-1">CSI Section Code</label>
                  <input
                    id="edit-code"
                    type="text"
                    value={selectedItem.csiCode}
                    onChange={(e) => setSelectedItem({ ...selectedItem, csiCode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-name" className="block text-xs font-semibold text-slate-500 mb-1">Section Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={selectedItem.sectionName}
                    onChange={(e) => setSelectedItem({ ...selectedItem, sectionName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-type" className="block text-xs font-semibold text-slate-500 mb-1">Requirement Type</label>
                <select
                  id="edit-type"
                  value={selectedItem.type}
                  onChange={(e) => setSelectedItem({ ...selectedItem, type: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Training">Training</option>
                  <option value="Demonstration">Demonstration</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-desc" className="block text-xs font-semibold text-slate-500 mb-1">Requirement Description</label>
                <textarea
                  id="edit-desc"
                  rows={4}
                  value={selectedItem.description}
                  onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              <div>
                <label htmlFor="edit-excerpt" className="block text-xs font-semibold text-slate-500 mb-1 font-mono text-slate-400">
                  Source Excerpt / Reference Audit Text
                </label>
                <textarea
                  id="edit-excerpt"
                  rows={3}
                  value={selectedItem.sourceExcerpt}
                  onChange={(e) => setSelectedItem({ ...selectedItem, sourceExcerpt: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 font-mono text-slate-600 bg-slate-50"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Discard
              </button>
              <button
                id="btn-save-edited-requirement"
                type="button"
                onClick={() => {
                  onUpdateRequirement(selectedItem);
                  setSelectedItem(null);
                }}
                className="px-5 py-2 text-xs bg-amber-600 border border-amber-700 font-semibold text-white rounded-lg hover:bg-amber-700 shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Excerpt Drawer/Overlay popup */}
      {previewExcerptItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="excerpt-preview-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info size={14} className="text-slate-500" />
                Specification Document Audit Verification Excerpt
              </h3>
              <button
                type="button"
                onClick={() => setPreviewExcerptItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="flex gap-2">
                <span className="font-mono text-xs text-amber-950 font-bold bg-amber-100 px-2 py-0.5 rounded-sm">
                  {previewExcerptItem.csiCode}
                </span>
                <span className="font-semibold text-xs text-slate-800">
                  {previewExcerptItem.sectionName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Extracted from file:
                </span>
                <span className="text-xs text-slate-600 font-mono italic">
                  {previewExcerptItem.sourceFile}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Verifying Excerpt clause:
                </span>
                <div className="bg-amber-50/45 border-l-2 border-amber-500 p-3.5 text-xs text-slate-700 leading-relaxed font-mono rounded-r-lg whitespace-pre-line">
                  "{previewExcerptItem.sourceExcerpt || "No excerpt recorded"}"
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewExcerptItem(null)}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 shadow-xs"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
