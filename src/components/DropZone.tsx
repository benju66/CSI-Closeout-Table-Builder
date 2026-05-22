import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, AlertCircle, Loader2, Play, FileUp } from "lucide-react";
import { UploadedFile } from "../types";
import { SAMPLE_SPECS, SampleSpec } from "../utils/sampleData";

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onPasteTextSubmitted: (title: string, text: string) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

export default function DropZone({
  onFilesSelected,
  onPasteTextSubmitted,
  uploadedFiles,
  onRemoveFile,
}: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [pastedTitle, setPastedTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    const title = pastedTitle.trim() || `Pasted Spec Section (${new Date().toLocaleTimeString()})`;
    onPasteTextSubmitted(title, pastedText);
    setPastedText("");
    setPastedTitle("");
    setIsPasting(false);
  };

  const handleLoadSample = (sample: SampleSpec) => {
    setPastedTitle(sample.title);
    setPastedText(sample.textContent);
    setIsPasting(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="dropzone-container">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          id="tab-upload-files"
          onClick={() => setIsPasting(false)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
            !isPasting
              ? "border-amber-600 text-amber-900 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileUp size={16} />
          Upload Specification Documents
        </button>
        <button
          id="tab-paste-text"
          onClick={() => setIsPasting(true)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
            isPasting
              ? "border-amber-600 text-amber-900 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={16} />
          Paste Specification Text
        </button>
      </div>

      <div className="p-6">
        {!isPasting ? (
          <div>
            {/* Drag and Drop Zone */}
            <div
              id="file-drop-area"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-amber-500 bg-amber-50/30"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/30 hover:bg-slate-50/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.txt,text/plain,application/pdf"
                onChange={handleFileChange}
              />
              <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400 mb-4 transition-transform group-hover:scale-110">
                <UploadCloud size={28} className="text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                Drag & drop specification sections here
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Supports PDF format and raw TXT files. Individual files up to 15MB are processed securely.
              </p>
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border border-amber-200/50 shadow-sm"
              >
                Browse Files
              </button>
            </div>
          </div>
        ) : (
          /* Paste text container */
          <div className="space-y-4">
            <div>
              <label htmlFor="pasted-title" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Specification Section Title / Standard Name
              </label>
              <input
                id="pasted-title"
                type="text"
                placeholder="e.g. Section 23 09 23 - Direct Digital Control"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder:text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="pasted-body" className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Paragraph or Entire Specification Text
              </label>
              <textarea
                id="pasted-body"
                rows={8}
                placeholder="Paste the relevant execution context, field instruction, or complete section text from your clipboard..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono placeholder:text-slate-400 bg-slate-50/30"
              />
            </div>
            <div className="flex justify-end gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPastedText("");
                  setPastedTitle("");
                }}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
              <button
                id="btn-submit-pasted-text"
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim()}
                className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-200/50 ${
                  !pastedText.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Analyze Extracted Text
              </button>
            </div>
          </div>
        )}

        {/* Uploaded / Parsing file queue list */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5 space-y-3" id="file-queue-list">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Document Processing History / Status:
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 shadow-sm shrink-0">
                      <FileText size={18} className="text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>

                      {/* Progress bar or status messages */}
                      <div className="mt-1 flex items-center gap-3">
                        {file.status === "queued" && (
                          <span className="text-amber-800 font-medium text-[10px]">Queued for analysis...</span>
                        )}
                        {file.status === "parsing" && (
                          <div className="flex items-center gap-2 flex-1 max-w-xs">
                            <span className="text-amber-800 font-medium text-[10px] flex items-center gap-1 shrink-0">
                              <Loader2 className="animate-spin" size={12} />
                              Extracting with Gemini...
                            </span>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {file.status === "completed" && (
                          <span className="text-emerald-700 font-medium text-[10px] flex flex-wrap items-center gap-1.5">
                            Analyzed successfully. Found <span className="text-amber-800 font-bold">{file.requirementCount || 0} Training</span>, <span className="text-indigo-800 font-bold">{file.omCount || 0} O&M</span>, and <span className="text-rose-800 font-bold">{file.warrantyCount || 0} Warranty</span> requirements.
                          </span>
                        )}
                        {file.status === "error" && (
                          <span className="text-red-700 font-medium text-[10px] flex items-center gap-1">
                            <AlertCircle size={12} className="shrink-0" />
                            {file.errorMsg || "Analysis aborted"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remove queue button */}
                  {file.status !== "parsing" && (
                    <button
                      type="button"
                      id={`btn-remove-file-${file.id}`}
                      onClick={() => onRemoveFile(file.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="Clear from queue"
                    >
                      <XIcon size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline fallback for mini-X to avoid extra imports
function XIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
