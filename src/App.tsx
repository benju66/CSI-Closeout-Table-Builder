import { useState, useEffect } from "react";
import { UploadedFile, RequirementItem, OMRequirementItem, WarrantyRequirementItem, AsBuiltRequirementItem, Project } from "./types";
import DropZone from "./components/DropZone";
import StatsPanel from "./components/StatsPanel";
import RequirementTable from "./components/RequirementTable";
import OMRequirementTable from "./components/OMRequirementTable";
import WarrantyRequirementTable from "./components/WarrantyRequirementTable";
import AsBuiltRequirementTable from "./components/AsBuiltRequirementTable";
import Dashboard from "./components/Dashboard";
import ProjectSettingsModal from "./components/ProjectSettingsModal";
import UnifiedMasterTable from "./components/UnifiedMasterTable";
import TerminologyMatcher from "./components/TerminologyMatcher";
import ParsingPreviewModal from "./components/ParsingPreviewModal";
import {
  ClipboardList,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Download,
  FileSpreadsheet,
  ShieldAlert,
  ArrowLeft,
  Settings,
  FolderOpen,
  X
} from "lucide-react";
import * as XLSX from "xlsx";

const DEFAULT_PROJECTS: Project[] = [];

export const DEFAULT_KEYWORDS = {
  training: ["train", "instruction", "personnel", "demonstrate", "classroom", "hands-on", "hours of instruction", "classroom hours", "certified", "video"],
  om: ["manual", "o&m", "spare parts", "schematic", "datasheet", "hardcopy", "pdf", "maintenance binder", "operation manual", "maintenance data"],
  warranty: ["warranty", "guarantee", "correction period", "defect", "substantial completion", "years", "extended warranty", "manufacturer warranty"],
  asBuilt: ["as-built", "redline", "record drawings", "cad", "bim", "record specifications", "markups"]
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem("csi_projects_suite_workspace_log_data");
      let parsed = saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
      if (Array.isArray(parsed)) {
        // Enforce removal of mercy health medical center and ensure backwards compatibility with asbuilt
        parsed = parsed.filter(
          (p) => p.id !== "project-mercy-health" && !p.name.toLowerCase().includes("mercy health")
        );
        parsed = parsed.map((p) => ({
          ...p,
          asBuiltRequirements: p.asBuiltRequirements || [],
          customKeywords: p.customKeywords || { ...DEFAULT_KEYWORDS }
        }));
      }
      return parsed;
    } catch (e) {
      console.error("Failed to rehydrate projects database.", e);
      return DEFAULT_PROJECTS;
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem("csi_projects_suite_active_id") || null;
  });

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"training" | "om" | "warranty" | "asbuilt" | "unified">("training");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);

  // State for Smart Parsing Preview Modal
  const [parsingCandidate, setParsingCandidate] = useState<{
    fileName: string;
    sourceText: string;
    isPdf: boolean;
    charCount: number;
    rawFiles?: FileList | File[];
  } | null>(null);

  // Auto-backup to standard client key-value cache
  useEffect(() => {
    localStorage.setItem("csi_projects_suite_workspace_log_data", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem("csi_projects_suite_active_id", activeProjectId);
    } else {
      localStorage.removeItem("csi_projects_suite_active_id");
    }
  }, [activeProjectId]);

  // Derived variables for the loaded workspace
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const requirements = activeProject ? activeProject.requirements : [];
  const omRequirements = activeProject ? activeProject.omRequirements : [];
  const warrantyRequirements = activeProject ? activeProject.warrantyRequirements : [];
  const asBuiltRequirements = activeProject ? (activeProject.asBuiltRequirements || []) : [];
  const uploadedFiles = activeProject ? activeProject.uploadedFiles : [];

  // Helper arrays update router context targeting current project scoping
  const updateActiveProject = (updater: (proj: Project) => Project) => {
    if (!activeProjectId) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === activeProjectId ? updater(p) : p))
    );
  };

  const setRequirements = (
    updater: RequirementItem[] | ((prev: RequirementItem[]) => RequirementItem[])
  ) => {
    updateActiveProject((proj) => ({
      ...proj,
      requirements: typeof updater === "function" ? updater(proj.requirements) : updater,
    }));
  };

  const setOMRequirements = (
    updater: OMRequirementItem[] | ((prev: OMRequirementItem[]) => OMRequirementItem[])
  ) => {
    updateActiveProject((proj) => ({
      ...proj,
      omRequirements: typeof updater === "function" ? updater(proj.omRequirements) : updater,
    }));
  };

  const setWarrantyRequirements = (
    updater: WarrantyRequirementItem[] | ((prev: WarrantyRequirementItem[]) => WarrantyRequirementItem[])
  ) => {
    updateActiveProject((proj) => ({
      ...proj,
      warrantyRequirements: typeof updater === "function" ? updater(proj.warrantyRequirements) : updater,
    }));
  };

  const setAsBuiltRequirements = (
    updater: AsBuiltRequirementItem[] | ((prev: AsBuiltRequirementItem[]) => AsBuiltRequirementItem[])
  ) => {
    updateActiveProject((proj) => ({
      ...proj,
      asBuiltRequirements: typeof updater === "function" ? updater(proj.asBuiltRequirements || []) : updater,
    }));
  };

  const setUploadedFiles = (
    updater: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])
  ) => {
    updateActiveProject((proj) => ({
      ...proj,
      uploadedFiles: typeof updater === "function" ? updater(proj.uploadedFiles) : updater,
    }));
  };

  // Workspace CRUD operations
  const handleCreateProject = (name: string, description: string, projectId: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      projectId,
      createdAt: new Date().toISOString(),
      requirements: [],
      omRequirements: [],
      warrantyRequirements: [],
      asBuiltRequirements: [],
      uploadedFiles: [],
      customKeywords: { ...DEFAULT_KEYWORDS },
      showCriticalGaps: true,
      showValueEngineering: true
    };
    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
    setGlobalError(null);
    setActiveTab("training");
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  const handleSaveSettings = (
    name: string,
    description: string,
    projectId: string,
    showCriticalGaps: boolean,
    showValueEngineering: boolean
  ) => {
    updateActiveProject((proj) => ({
      ...proj,
      name,
      description,
      projectId,
      showCriticalGaps,
      showValueEngineering
    }));
  };

  const handleSaveKeywords = (keywords: { training: string[]; om: string[]; warranty: string[]; asBuilt: string[] }) => {
    updateActiveProject((proj) => ({
      ...proj,
      customKeywords: keywords
    }));
  };

  const handleClearData = (type: "training" | "om" | "warranty" | "files" | "all") => {
    updateActiveProject((proj) => {
      const p = { ...proj };
      if (type === "training" || type === "all") p.requirements = [];
      if (type === "om" || type === "all") p.omRequirements = [];
      if (type === "warranty" || type === "all") p.warrantyRequirements = [];
      if (type === "files" || type === "all") p.uploadedFiles = [];
      return p;
    });
    setGlobalError(null);
    if (type === "all") {
      setActiveTab("training");
    }
  };

  const handleDeleteActiveProject = () => {
    if (!activeProjectId) return;
    setProjects((prev) => prev.filter((p) => p.id !== activeProjectId));
    setActiveProjectId(null);
    setIsSettingsOpen(false);
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setActiveTab("training");
    setGlobalError(null);
  };
  // Generates safe unique ID suitable for client sandboxes
  const generateId = () => `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Intercept multi-file selections to show Smart Preview Modal first
  const handleFilesSelected = async (files: FileList | File[]) => {
    setGlobalError(null);
    const filesArray = Array.from(files);

    const validFiles = filesArray.filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".txt") || file.type === "application/pdf" || file.type === "text/plain";
    });

    if (validFiles.length === 0) {
      setGlobalError("No valid specification files detected. Please drop standard .pdf or .txt documents.");
      return;
    }

    const file = validFiles[0];
    if (validFiles.length === 1 && file.name.toLowerCase().endsWith(".txt")) {
      // Clean-read TXT as local text to allow estimating and mutability
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string || "";
        setParsingCandidate({
          fileName: file.name,
          sourceText: text,
          isPdf: false,
          charCount: text.length,
          rawFiles: validFiles,
        });
      };
      reader.readAsText(file);
    } else {
      // Map PDF or multi-file queue directly
      setParsingCandidate({
        fileName: validFiles.length === 1 ? file.name : `${validFiles.length} Specification Documents`,
        sourceText: "",
        isPdf: true,
        charCount: validFiles.reduce((sum, f) => sum + f.size, 0),
        rawFiles: validFiles,
      });
    }
  };

  // Intercept direct textbox pastes to show Smart Preview Modal first
  const handlePasteTextSubmitted = async (title: string, text: string) => {
    setGlobalError(null);
    setParsingCandidate({
      fileName: title,
      sourceText: text,
      isPdf: false,
      charCount: text.length,
    });
  };

  // Callback to execute after user confirms processing inside parsing modal
  const handleConfirmParsing = async (trimmedText?: string) => {
    if (!parsingCandidate) return;
    const { fileName, isPdf, rawFiles, sourceText } = parsingCandidate;
    setParsingCandidate(null); // Dismiss modal

    if (isPdf && rawFiles && rawFiles.length > 0) {
      await executeFilesParsing(rawFiles);
    } else {
      const textToProcess = trimmedText !== undefined && trimmedText !== "" ? trimmedText : sourceText;
      await executeTextParsing(fileName, textToProcess);
    }
  };

  // High-level files parser executor runs the real Gemini extraction sequentially
  const executeFilesParsing = async (validFiles: File[]) => {
    // Initialize state objects for file logs
    const newUploads: UploadedFile[] = validFiles.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "queued",
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newUploads]);

    for (let i = 0; i < validFiles.length; i++) {
      const rawFile = validFiles[i];
      const trackingObj = newUploads[i];

      updateFileStatus(trackingObj.id, "parsing", 20);

      try {
        const base64Data = await readFileAsBase64(rawFile);
        updateFileStatus(trackingObj.id, "parsing", 50);

        const response = await fetch("/api/parse-spec", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: rawFile.name,
            fileType: rawFile.type,
            base64Data,
            customKeywords: activeProject?.customKeywords,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Server returned error status ${response.status}`);
        }

        const data = await response.json();
        const extractedTraining: Omit<RequirementItem, "id">[] = data.requirements || [];
        const extractedOM: Omit<OMRequirementItem, "id">[] = data.omRequirements || [];
        const extractedWarranty: Omit<WarrantyRequirementItem, "id">[] = data.warrantyRequirements || [];
        const extractedAsBuilt: Omit<AsBuiltRequirementItem, "id">[] = data.asBuiltRequirements || [];

        const mappedTraining: RequirementItem[] = extractedTraining.map((item) => ({
          ...item,
          id: generateId(),
          sourceFile: rawFile.name,
        }));

        const mappedOM: OMRequirementItem[] = extractedOM.map((item) => ({
          ...item,
          id: generateId(),
          sourceFile: rawFile.name,
        }));

        const mappedWarranty: WarrantyRequirementItem[] = extractedWarranty.map((item) => ({
          ...item,
          id: generateId(),
          sourceFile: rawFile.name,
        }));

        const mappedAsBuilt: AsBuiltRequirementItem[] = extractedAsBuilt.map((item) => ({
          ...item,
          id: generateId(),
          sourceFile: rawFile.name,
        }));

        if (mappedTraining.length > 0) {
          setRequirements((prev) => [...prev, ...mappedTraining]);
        }
        if (mappedOM.length > 0) {
          setOMRequirements((prev) => [...prev, ...mappedOM]);
        }
        if (mappedWarranty.length > 0) {
          setWarrantyRequirements((prev) => [...prev, ...mappedWarranty]);
        }
        if (mappedAsBuilt.length > 0) {
          setAsBuiltRequirements((prev) => [...prev, ...mappedAsBuilt]);
        }

        if (mappedAsBuilt.length > 0 && mappedTraining.length === 0 && mappedOM.length === 0 && mappedWarranty.length === 0) {
          setActiveTab("asbuilt");
        } else if (mappedWarranty.length > 0 && mappedTraining.length === 0 && mappedOM.length === 0) {
          setActiveTab("warranty");
        } else if (mappedOM.length > 0 && mappedTraining.length === 0) {
          setActiveTab("om");
        } else if (mappedTraining.length > 0) {
          setActiveTab("training");
        }

        updateFileStatus(
          trackingObj.id,
          "completed",
          100,
          mappedTraining.length,
          mappedOM.length,
          mappedWarranty.length,
          mappedAsBuilt.length
        );
      } catch (err: any) {
        console.error(`Error parsing document '${rawFile.name}':`, err);
        updateFileStatus(trackingObj.id, "error", 100, 0, 0, 0, 0, err.message || "An error occurred during Gemini extraction.");
      }
    }
  };

  // High-level text parser executor runs the direct text API parsing
  const executeTextParsing = async (title: string, text: string) => {
    const virtualId = `virtual-${Date.now()}`;
    const trackingObj: UploadedFile = {
      id: virtualId,
      name: title,
      size: text.length,
      type: "text/plain",
      status: "parsing",
      progress: 30,
    };

    setUploadedFiles((prev) => [...prev, trackingObj]);

    try {
      const response = await fetch("/api/parse-spec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: title,
          textContent: text,
          customKeywords: activeProject?.customKeywords,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Server returned error processing direct text.");
      }

      const data = await response.json();
      const extractedTraining: Omit<RequirementItem, "id">[] = data.requirements || [];
      const extractedOM: Omit<OMRequirementItem, "id">[] = data.omRequirements || [];
      const extractedWarranty: Omit<WarrantyRequirementItem, "id">[] = data.warrantyRequirements || [];
      const extractedAsBuilt: Omit<AsBuiltRequirementItem, "id">[] = data.asBuiltRequirements || [];

      const mappedTraining: RequirementItem[] = extractedTraining.map((item) => ({
        ...item,
        id: generateId(),
        sourceFile: title,
      }));

      const mappedOM: OMRequirementItem[] = extractedOM.map((item) => ({
        ...item,
        id: generateId(),
        sourceFile: title,
      }));

      const mappedWarranty: WarrantyRequirementItem[] = extractedWarranty.map((item) => ({
        ...item,
        id: generateId(),
        sourceFile: title,
      }));

      const mappedAsBuilt: AsBuiltRequirementItem[] = extractedAsBuilt.map((item) => ({
        ...item,
        id: generateId(),
        sourceFile: title,
      }));

      if (mappedTraining.length > 0) {
        setRequirements((prev) => [...prev, ...mappedTraining]);
      }
      if (mappedOM.length > 0) {
        setOMRequirements((prev) => [...prev, ...mappedOM]);
      }
      if (mappedWarranty.length > 0) {
        setWarrantyRequirements((prev) => [...prev, ...mappedWarranty]);
      }
      if (mappedAsBuilt.length > 0) {
        setAsBuiltRequirements((prev) => [...prev, ...mappedAsBuilt]);
      }

      if (mappedAsBuilt.length > 0 && mappedTraining.length === 0 && mappedOM.length === 0 && mappedWarranty.length === 0) {
        setActiveTab("asbuilt");
      } else if (mappedWarranty.length > 0 && mappedTraining.length === 0 && mappedOM.length === 0) {
        setActiveTab("warranty");
      } else if (mappedOM.length > 0 && mappedTraining.length === 0) {
        setActiveTab("om");
      } else if (mappedTraining.length > 0) {
        setActiveTab("training");
      }

      updateFileStatus(
        virtualId,
        "completed",
        100,
        mappedTraining.length,
        mappedOM.length,
        mappedWarranty.length,
        mappedAsBuilt.length
      );
    } catch (err: any) {
      console.error("Error processing pasted text block:", err);
      updateFileStatus(virtualId, "error", 100, 0, 0, 0, 0, err.message || "An error occurred during text extraction.");
    }
  };

  // Convert files to Base64 asynchronously
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Update file processing visual row properties
  const updateFileStatus = (
    id: string,
    status: UploadedFile["status"],
    progress: number,
    requirementCount?: number,
    omCount?: number,
    warrantyCount?: number,
    asBuiltCount?: number,
    errorMsg?: string
  ) => {
    setUploadedFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? {
              ...file,
              status,
              progress,
              requirementCount: requirementCount ?? file.requirementCount,
              omCount: omCount ?? file.omCount,
              warrantyCount: warrantyCount ?? file.warrantyCount,
              asBuiltCount: asBuiltCount ?? file.asBuiltCount,
              errorMsg,
            }
          : file
      )
    );
  };

  // Queue removal
  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Requirements CRUD operator sets
  const handleDeleteRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRequirement = (updated: RequirementItem) => {
    setRequirements((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddRequirement = (newReq: Omit<RequirementItem, "id">) => {
    setRequirements((prev) => [
      ...prev,
      {
        ...newReq,
        id: generateId(),
      },
    ]);
  };

  // O&M Requirements CRUD operator sets
  const handleDeleteOMRequirement = (id: string) => {
    setOMRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateOMRequirement = (updated: OMRequirementItem) => {
    setOMRequirements((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddOMRequirement = (newOM: Omit<OMRequirementItem, "id">) => {
    setOMRequirements((prev) => [
      ...prev,
      {
        ...newOM,
        id: generateId(),
      },
    ]);
  };

  // Warranty Requirements CRUD operator sets
  const handleDeleteWarrantyRequirement = (id: string) => {
    setWarrantyRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateWarrantyRequirement = (updated: WarrantyRequirementItem) => {
    setWarrantyRequirements((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddWarrantyRequirement = (newWarr: Omit<WarrantyRequirementItem, "id">) => {
    setWarrantyRequirements((prev) => [
      ...prev,
      {
        ...newWarr,
        id: generateId(),
      },
    ]);
  };

  // As-Built Requirements CRUD operator sets
  const handleDeleteAsBuiltRequirement = (id: string) => {
    setAsBuiltRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateAsBuiltRequirement = (updated: AsBuiltRequirementItem) => {
    setAsBuiltRequirements((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddAsBuiltRequirement = (newAs: Omit<AsBuiltRequirementItem, "id">) => {
    setAsBuiltRequirements((prev) => [
      ...prev,
      {
        ...newAs,
        id: generateId(),
      },
    ]);
  };

  // Master multi-sheet Excel export
  const triggerMasterExcelExport = () => {
    if (requirements.length === 0 && omRequirements.length === 0 && warrantyRequirements.length === 0 && asBuiltRequirements.length === 0) {
      alert("No data available to export yet. Please upload files first.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Training list
    if (requirements.length > 0) {
      const trainingData = requirements.map((item, index) => ({
        "No.": index + 1,
        "CSI Section Code": item.csiCode,
        "Specification Section Name": item.sectionName,
        "Requirement Type": item.type === "Both" ? "Training & Demonstration" : item.type,
        "Log Requirement Description": item.description,
        "Verification Excerpt": item.sourceExcerpt,
        "Source Document Name": item.sourceFile,
      }));
      const trainingSheet = XLSX.utils.json_to_sheet(trainingData);
      trainingSheet["!cols"] = [
        { wch: 6 }, { wch: 18 }, { wch: 35 }, { wch: 18 }, { wch: 65 }, { wch: 45 }, { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(workbook, trainingSheet, "1. Owner Training Log");
    }

    // Sheet 2: O&M list
    if (omRequirements.length > 0) {
      const omData = omRequirements.map((item, index) => ({
        "No.": index + 1,
        "CSI Section Code": item.csiCode,
        "Specification Section Name": item.sectionName,
        "Document / Manual Type": item.type,
        "Log Requirement Description": item.description,
        "Verification Excerpt": item.sourceExcerpt,
        "Source Document Name": item.sourceFile,
      }));
      const omSheet = XLSX.utils.json_to_sheet(omData);
      omSheet["!cols"] = [
        { wch: 6 }, { wch: 18 }, { wch: 35 }, { wch: 20 }, { wch: 65 }, { wch: 45 }, { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(workbook, omSheet, "2. O&M Manuals Log");
    }

    // Sheet 3: Warranty list
    if (warrantyRequirements.length > 0) {
      const warrantyData = warrantyRequirements.map((item, index) => ({
        "No.": index + 1,
        "CSI Section Code": item.csiCode,
        "Specification Section Name": item.sectionName,
        "Warranty Type": item.type,
        "Duration / Term": item.duration,
        "Log Requirement Description": item.description,
        "Verification Excerpt": item.sourceExcerpt,
        "Source Document Name": item.sourceFile,
      }));
      const warrantySheet = XLSX.utils.json_to_sheet(warrantyData);
      warrantySheet["!cols"] = [
        { wch: 6 }, { wch: 18 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 65 }, { wch: 45 }, { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(workbook, warrantySheet, "3. Warranties Log");
    }

    // Sheet 4: Closeout Record & As-Built list
    if (asBuiltRequirements.length > 0) {
      const asBuiltData = asBuiltRequirements.map((item, index) => ({
        "No.": index + 1,
        "CSI Section Code": item.csiCode,
        "Specification Section Name": item.sectionName,
        "Record Type": item.type,
        "Log Requirement Description": item.description,
        "Verification Excerpt": item.sourceExcerpt,
        "Source Document Name": item.sourceFile,
      }));
      const asBuiltSheet = XLSX.utils.json_to_sheet(asBuiltData);
      asBuiltSheet["!cols"] = [
        { wch: 6 }, { wch: 18 }, { wch: 35 }, { wch: 22 }, { wch: 65 }, { wch: 45 }, { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(workbook, asBuiltSheet, "4. Record - As-Built Log");
    }

    XLSX.writeFile(workbook, "CSI_Complete_Operations_And_Training_Log.xlsx");
  };

  // Clear overall logged specs list
  const resetAllSessions = () => {
    if (confirm("Are you sure you want to reset the current analysis? This will erase all logged entries in both tables.")) {
      setRequirements([]);
      setOMRequirements([]);
      setWarrantyRequirements([]);
      setAsBuiltRequirements([]);
      setUploadedFiles([]);
      setGlobalError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" id="application-layout">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0B1A3F] text-white border-b border-[#0B1A3F]/40 relative shadow-md" id="header">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-[#0B1A3F]/15 via-amber-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-6 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Back Nav info */}
          <div className="flex items-center gap-3">
            {activeProjectId && (
              <button
                id="btn-nav-back-to-dashboard"
                onClick={() => setActiveProjectId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <ArrowLeft size={13} />
                Dashboard
              </button>
            )}
            
            <div className="space-y-0.5 text-left">
              <div className="flex items-center gap-2">
                <span className="bg-[#0B1A3F]/30 border border-[#0B1A3F]/40 p-1 rounded">
                  <ClipboardList size={14} className="text-[#a2b2dc]" />
                </span>
                <span className="text-[9px] font-bold text-[#a2b2dc] tracking-widest uppercase font-sans">
                  AI Construction Spec Suite
                </span>
              </div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-slate-100">
                CSI Closeout Table Builder
              </h1>
            </div>
          </div>

          {/* Center Info Pill */}
          {activeProject && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#0B1A3F]/40 border border-[#0B1A3F]/45 rounded-2xl text-left max-w-sm">
              <span className="text-[#a2b2dc] shrink-0">
                <FolderOpen size={15} />
              </span>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] text-slate-400 block font-bold leading-none uppercase tracking-wider">Current Workspace</span>
                <span className="text-xs font-bold text-slate-100 truncate block font-semibold" title={activeProject.name}>
                  {activeProject.name}
                </span>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0 justify-end">
            {activeProjectId && activeProject && (
              <>
                {/* Unified Export Button */}
                {(requirements.length > 0 || omRequirements.length > 0 || warrantyRequirements.length > 0 || asBuiltRequirements.length > 0) && (
                  <button
                    id="btn-master-excel-export"
                    onClick={triggerMasterExcelExport}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <Download size={13} /> Export Excel
                  </button>
                )}

                {/* Clause Matcher sandbox trigger */}
                <button
                  id="btn-clause-matcher-modal-trigger"
                  onClick={() => setIsMatcherOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0 border border-violet-700/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  title="Open interactive terminology specification clause draft auditor"
                >
                  <Sparkles size={13} className="text-violet-100 animate-pulse" />
                  Clause Auditor Sandbox
                </button>

                {/* Settings menu option */}
                <button
                  id="btn-settings-menu-trigger"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  <Settings size={13} />
                  Settings Menu
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 py-8" id="main-content">
        {!activeProjectId ? (
          <Dashboard
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <div className="space-y-8 animate-fade-in" id="active-project-contents-container">
            {/* Project description card banner */}
            {activeProject && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs text-left">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-[#0B1A3F]/5 border border-[#0B1A3F]/15 text-[#0B1A3F] rounded-2xl shrink-0">
                    <FolderOpen size={20} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#0B1A3F] bg-[#0B1A3F]/5 border border-[#0B1A3F]/15 px-2 py-0.5 rounded-md">ACTIVE WORKSPACE</span>
                      <h2 className="text-base font-extrabold text-slate-900 truncate" title={activeProject.name}>{activeProject.name}</h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {activeProject.description || "No customized workspace description added."}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-bold shrink-0 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl uppercase tracking-wider font-mono">
                  Created: {new Date(activeProject.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* API Global Error Box */}
            {globalError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 shadow-xs animate-fade-in" id="error-alert">
                <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={16} />
                <div>
                  <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide">Document Parsing Suspended</h3>
                  <p className="text-xs text-red-700 mt-1 font-medium">{globalError}</p>
                </div>
              </div>
            )}

            {/* Drop Zone and spec processing row */}
            <section className="grid grid-cols-1 gap-6" id="section-upload-panels">
              <DropZone
                onFilesSelected={handleFilesSelected}
                onPasteTextSubmitted={handlePasteTextSubmitted}
                uploadedFiles={uploadedFiles}
                onRemoveFile={handleRemoveFile}
              />
            </section>

            {/* Divider and statistics list */}
            <section className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#0B1A3F]" /> Catalog Overview & Analytics
                </h3>
              </div>
              <StatsPanel
                requirements={requirements}
                omRequirements={omRequirements}
                warrantyRequirements={warrantyRequirements}
                asBuiltRequirements={asBuiltRequirements}
                fileCount={uploadedFiles.length}
              />
            </section>

            {/* Tables and specification views switcher */}
            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 gap-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    id="tab-select-training-table"
                    onClick={() => setActiveTab("training")}
                    className={`py-3 px-5 text-sm font-bold border-b-2 transition-all relative flex items-center gap-2 ${
                      activeTab === "training"
                        ? "border-amber-600 text-amber-900 bg-white rounded-t-xl border-t border-x border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                        : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                    }`}
                  >
                    Owner Training Requirements
                    <span className={`inline-flex items-center justify-center text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeTab === "training" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"
                    }`}>
                      {requirements.length}
                    </span>
                  </button>
                  <button
                    id="tab-select-om-table"
                    onClick={() => setActiveTab("om")}
                    className={`py-3 px-5 text-sm font-bold border-b-2 transition-all relative flex items-center gap-2 ${
                      activeTab === "om"
                        ? "border-[#0B1A3F] text-[#0B1A3F] bg-white rounded-t-xl border-t border-x border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                        : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                    }`}
                  >
                    O&M Manuals & Data
                    <span className={`inline-flex items-center justify-center text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeTab === "om" ? "bg-[#0B1A3F]/10 text-[#0B1A3F]" : "bg-slate-100 text-slate-600"
                    }`}>
                      {omRequirements.length}
                    </span>
                  </button>
                  <button
                    id="tab-select-warranty-table"
                    onClick={() => setActiveTab("warranty")}
                    className={`py-3 px-5 text-sm font-bold border-b-2 transition-all relative flex items-center gap-2 ${
                      activeTab === "warranty"
                        ? "border-rose-600 text-rose-900 bg-white rounded-t-xl border-t border-x border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                        : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                    }`}
                  >
                    Warranties & Guarantees
                    <span className={`inline-flex items-center justify-center text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      activeTab === "warranty" ? "bg-rose-100 text-rose-900" : "bg-slate-100 text-slate-600"
                    }`}>
                      {warrantyRequirements.length}
                    </span>
                  </button>
                  <button
                    id="tab-select-asbuilt-table"
                    onClick={() => setActiveTab("asbuilt")}
                    className={`py-3 px-5 text-sm font-bold border-b-2 transition-all relative flex items-center gap-2 ${
                      activeTab === "asbuilt"
                        ? "border-teal-650 border-teal-600 text-teal-900 bg-white rounded-t-xl border-t border-x border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                        : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                    }`}
                  >
                    As-Built / Redlines
                    <span className={`inline-flex items-center justify-center text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      activeTab === "asbuilt" ? "bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-600"
                    }`}>
                      {asBuiltRequirements.length}
                    </span>
                  </button>
                  <button
                    id="tab-select-unified-table"
                    onClick={() => setActiveTab("unified")}
                    className={`py-3 px-5 text-sm font-bold border-b-2 transition-all relative flex items-center gap-2 ${
                      activeTab === "unified"
                        ? "border-slate-850 border-slate-900 text-slate-900 bg-white rounded-t-xl border-t border-x border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] mr-1"
                        : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                    }`}
                  >
                    Unified Master Log
                    <span className={`inline-flex items-center justify-center text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeTab === "unified" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {requirements.length + omRequirements.length + warrantyRequirements.length + asBuiltRequirements.length}
                    </span>
                  </button>
                </div>

                {/* Quick Helper tag */}
                <span className="text-[10px] text-slate-400 font-medium italic hidden lg:inline">
                  Double-check excerpts to verify compliance with model findings
                </span>
              </div>

              {/* Render Selected Table list */}
              <div className="mt-6">
                {activeTab === "training" && (
                  <RequirementTable
                    requirements={requirements}
                    onDeleteRequirement={handleDeleteRequirement}
                    onUpdateRequirement={handleUpdateRequirement}
                    onAddRequirement={handleAddRequirement}
                  />
                )}
                {activeTab === "om" && (
                  <OMRequirementTable
                    requirements={omRequirements}
                    onDeleteRequirement={handleDeleteOMRequirement}
                    onUpdateRequirement={handleUpdateOMRequirement}
                    onAddRequirement={handleAddOMRequirement}
                  />
                )}
                {activeTab === "warranty" && (
                  <WarrantyRequirementTable
                    requirements={warrantyRequirements}
                    onDeleteRequirement={handleDeleteWarrantyRequirement}
                    onUpdateRequirement={handleUpdateWarrantyRequirement}
                    onAddRequirement={handleAddWarrantyRequirement}
                  />
                )}
                {activeTab === "asbuilt" && (
                  <AsBuiltRequirementTable
                    requirements={asBuiltRequirements}
                    onDeleteRequirement={handleDeleteAsBuiltRequirement}
                    onUpdateRequirement={handleUpdateAsBuiltRequirement}
                    onAddRequirement={handleAddAsBuiltRequirement}
                  />
                )}
                {activeTab === "unified" && (
                  <UnifiedMasterTable
                    requirements={requirements}
                    omRequirements={omRequirements}
                    warrantyRequirements={warrantyRequirements}
                    asBuiltRequirements={asBuiltRequirements}
                    onDeleteTraining={handleDeleteRequirement}
                    onDeleteOM={handleDeleteOMRequirement}
                    onDeleteWarranty={handleDeleteWarrantyRequirement}
                    onDeleteAsBuilt={handleDeleteAsBuiltRequirement}
                    onUpdateTraining={handleUpdateRequirement}
                    onUpdateOM={handleUpdateOMRequirement}
                    onUpdateWarranty={handleUpdateWarrantyRequirement}
                    onUpdateAsBuilt={handleUpdateAsBuiltRequirement}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal (Overlay context) */}
      {activeProject && (
        <ProjectSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          projectId={activeProject.projectId || ""}
          projectName={activeProject.name}
          projectDescription={activeProject.description || ""}
          showCriticalGaps={activeProject.showCriticalGaps !== false}
          showValueEngineering={activeProject.showValueEngineering !== false}
          customKeywords={activeProject.customKeywords}
          onSaveSettings={handleSaveSettings}
          onSaveKeywords={handleSaveKeywords}
          onClearData={handleClearData}
          onDeleteProject={handleDeleteActiveProject}
        />
      )}

      {/* Smart Parsing Preview Modal Overlay Portal */}
      <ParsingPreviewModal
        isOpen={parsingCandidate !== null}
        onClose={() => setParsingCandidate(null)}
        onConfirm={handleConfirmParsing}
        fileName={parsingCandidate?.fileName || ""}
        sourceText={parsingCandidate?.sourceText || ""}
        isPdf={parsingCandidate?.isPdf || false}
        charCount={parsingCandidate?.charCount || 0}
        customKeywords={activeProject?.customKeywords}
      />

      {/* Interactive Terminology Matcher Overlay Modal */}
      {isMatcherOpen && activeProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="clause-matcher-modal-overlay">
          <div className="bg-slate-50 rounded-3xl max-w-6xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="bg-white px-6 py-4.5 border-b border-slate-200/60 flex justify-between items-center shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                  Interactive Sandbox Tool
                </span>
                <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-violet-600" />
                  CSI Terminology Matcher & Clause Auditor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMatcherOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                id="close-matcher-modal-header-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <TerminologyMatcher 
                customKeywords={activeProject.customKeywords} 
                onUpdateKeywords={handleSaveKeywords}
                showCriticalGaps={activeProject.showCriticalGaps !== false}
                showValueEngineering={activeProject.showValueEngineering !== false}
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsMatcherOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer border border-slate-950"
                id="close-matcher-modal-footer-btn"
              >
                Close Sandbox
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Humble Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-16 text-center text-[11px] text-slate-400 font-medium" id="footer">
        <p className="max-w-2xl mx-auto px-4 leading-relaxed">
          CSI Closeout Table Builder • Powered by server-side Gemini 3.5 Flash & Node.js. Generates compliant Multi-Sheet MasterFormat Excel summaries directly in your browser.
        </p>
      </footer>
    </div>
  );
}
