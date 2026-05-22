export interface RequirementItem {
  id: string; // Unique UI key
  csiCode: string; // e.g. "26 05 00"
  sectionName: string; // e.g. "Common Work Results for Electrical"
  type: "Training" | "Demonstration" | "Both";
  description: string; // Summary of training or demonstration requirements
  sourceExcerpt: string; // Snippet verification text
  sourceFile: string; // File name source or "Pasted Text"
}

export interface OMRequirementItem {
  id: string; // Unique UI key
  csiCode: string; // e.g. "26 05 00"
  sectionName: string; // e.g. "Common Work Results for Electrical"
  type: string; // e.g. "O&M Manual", "Maintenance Manual", "Operation Manual", "Maintenance Data", "Operation and Maintenance Data"
  description: string; // Summary of O&M manual or maintenance requirements
  sourceExcerpt: string; // Snippet verification text
  sourceFile: string; // File name source or "Pasted Text"
}

export interface WarrantyRequirementItem {
  id: string; // Unique UI key
  csiCode: string; // e.g. "26 05 00"
  sectionName: string; // e.g. "Common Work Results for Electrical"
  type: string; // e.g. "Special Warranty", "Extended Warranty", "Manufacturer Warranty", "Contractor Warranty", "Warranty Correction Period"
  duration: string; // e.g. "5 years", "1 year", "Not Specified"
  description: string; // Detail of warranty requirements, terms, starting date triggers, etc.
  sourceExcerpt: string; // Snippet verification text
  sourceFile: string; // File name source or "Pasted Text"
}

export interface AsBuiltRequirementItem {
  id: string; // Unique UI key
  csiCode: string; // e.g. "26 05 00"
  sectionName: string; // e.g. "Common Work Results for Electrical"
  type: string; // e.g. "As-Built Drawings", "Redline Drawings", "Record Drawings", "Record Specifications"
  description: string; // Detailed record / asbuilt drawing requirement, markup details, CAD/BIM submission format, etc.
  sourceExcerpt: string; // Snippet verification text
  sourceFile: string; // File name source or "Pasted Text"
}

export type FileStatus = "queued" | "parsing" | "completed" | "error";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number; // 0 to 100
  errorMsg?: string;
  requirementCount?: number;
  omCount?: number;
  warrantyCount?: number;
  asBuiltCount?: number;
}

export interface Project {
  id: string;
  projectId?: string; // e.g. "PRJ-904" or similar unique Project Code
  name: string;
  description?: string;
  createdAt: string;
  requirements: RequirementItem[];
  omRequirements: OMRequirementItem[];
  warrantyRequirements: WarrantyRequirementItem[];
  asBuiltRequirements?: AsBuiltRequirementItem[]; // Made optional to be fully backwards-compatible with existing stored projects
  uploadedFiles: UploadedFile[];
  customKeywords?: {
    training: string[];
    om: string[];
    warranty: string[];
    asBuilt: string[];
  };
  showCriticalGaps?: boolean;
  showValueEngineering?: boolean;
}

