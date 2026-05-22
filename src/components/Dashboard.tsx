import { useState, FormEvent } from "react";
import { Project } from "../types";
import {
  Folder,
  Plus,
  Trash2,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
  Shield,
  FileText,
  Search,
  CheckSquare,
  X,
  LayoutGrid,
  LayoutList
} from "lucide-react";

interface DashboardProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description: string, projectId: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function Dashboard({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    return (localStorage.getItem("csi_projects_suite_dashboard_view_mode") as "grid" | "table") || "table";
  });

  const [isBannerVisible, setIsBannerVisible] = useState(() => {
    return localStorage.getItem("csi_projects_suite_banner_dismissed") !== "true";
  });

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("csi_projects_suite_dashboard_view_mode", mode);
  };

  const handleDismissBanner = () => {
    setIsBannerVisible(false);
    localStorage.setItem("csi_projects_suite_banner_dismissed", "true");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectDesc.trim(), newProjectId.trim());
    setNewProjectName("");
    setNewProjectDesc("");
    setNewProjectId("");
    setIsCreateOpen(false);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* Upper Hero Panel */}
      {isBannerVisible && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0B1A3F] text-white rounded-2xl p-5 md:p-6 relative overflow-hidden border border-[#0B1A3F]/40 shadow-md transition-all duration-300 animate-fade-in">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-[#0B1A3F]/15 via-amber-500/5 to-transparent pointer-events-none" />
          
          {/* Dismiss button */}
          <button
            id="btn-dismiss-hero-banner"
            type="button"
            onClick={handleDismissBanner}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X size={16} />
          </button>

          <div className="max-w-3xl space-y-2.5 pr-8">
            <div className="inline-flex items-center gap-1.2 px-2.5 py-0.5 rounded-full bg-[#0B1A3F]/40 border border-[#0B1A3F]/50 text-[10px] font-bold text-[#a2b2dc] uppercase tracking-wider">
              <Sparkles size={10} />
              AI-Powered Document Submittals Suite
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-100">
              CSI Specifications Classification Manager
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Create separate project workspaces to parse construction specification documents. Cleanly extract, organize, and export required <strong>Owner Training</strong>, <strong>O&M Manuals</strong>, and <strong>Warranties</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main dashboard content list and actions */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Active Projects</h2>
            <p className="text-xs text-slate-500">
              Select or manage projects holding specification analysis data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sliding Pill View Mode Selector switch */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0 select-none">
              <button
                id="view-mode-grid"
                type="button"
                onClick={() => handleSetViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-slate-950 shadow-xs border-b border-slate-200/30 font-bold text-slate-900"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
                title="Card View"
              >
                <LayoutGrid size={13} />
                Cards
              </button>
              <button
                id="view-mode-table"
                type="button"
                onClick={() => handleSetViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-slate-950 shadow-xs border-b border-slate-200/30 font-bold text-slate-900"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
                title="Table View"
              >
                <LayoutList size={13} />
                Table
              </button>
            </div>

            {/* Search filter for workspaces */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                id="workspace-search-query"
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-250 focus:border-[#0B1A3F] rounded-xl bg-white focus:ring-1 focus:ring-[#0B1A3F] outline-none text-slate-700 shadow-xs animate-none"
              />
            </div>

            {/* Sub header creation button */}
            {projects.length > 0 && (
              <button
                id="btn-create-project-sub"
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm shrink-0 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                New Workspace
              </button>
            )}
          </div>
        </div>

        {/* Project workspace grid or table presentation view */}
        {filteredProjects.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-3xl bg-white py-16 px-6 text-center shadow-xs" id="dashboard-empty-state">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Folder size={28} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">No active specification spaces found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {searchQuery
                ? "No workspaces matched your current filtered keywords. Try typing another code or term."
                : "Begin by creating a new CSI specification project space. You can then drop PDFs or paste clauses directly inside."}
            </p>
            <div className="mt-5">
              <button
                id="btn-create-project-empty"
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1A3F] hover:bg-[#122656] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} /> Create Your First Space
              </button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" id="dashboard-projects-grid">
            {filteredProjects.map((project) => {
              const totalItems =
                project.requirements.length +
                project.omRequirements.length +
                project.warrantyRequirements.length;

              return (
                <div
                  key={project.id}
                  id={`project-card-${project.id}`}
                  className="bg-white border border-slate-200 hover:border-slate-300/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group h-full relative"
                >
                  <div className="space-y-4">
                    {/* Upper title */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {project.projectId && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 text-[9px] font-extrabold text-slate-705 font-mono tracking-wide uppercase border border-slate-205">
                              {project.projectId}
                            </span>
                          )}
                          <h3 className="font-extrabold text-slate-900 group-hover:text-[#0B1A3F] transition-colors text-sm truncate max-w-[155px]" title={project.name}>
                            {project.name}
                          </h3>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={10} />
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-500 group-hover:bg-slate-100 group-hover:text-[#0B1A3F] transition-all shrink-0">
                        <Folder size={18} />
                      </div>
                    </div>

                    {/* Brief description */}
                    <p className="text-xs text-slate-500 line-clamp-2 h-8 font-medium">
                      {project.description || "No customized workspace description added."}
                    </p>

                    {/* Simple Counter Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Training</span>
                        <span className="text-xs font-extrabold text-amber-700 block">
                          {project.requirements.length}
                        </span>
                      </div>
                      <div className="space-y-0.5 border-x border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">O&M Docs</span>
                        <span className="text-xs font-extrabold text-[#0B1A3F] block">
                          {project.omRequirements.length}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Warranties</span>
                        <span className="text-xs font-extrabold text-rose-700 block">
                          {project.warrantyRequirements.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    {/* Delete button */}
                    <button
                      id={`btn-delete-project-${project.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"
                      title="Delete Space"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Open Area Trigger */}
                    <button
                      id={`btn-open-project-${project.id}`}
                      type="button"
                      onClick={() => onSelectProject(project.id)}
                      className="inline-flex items-center gap-1 py-1.5 px-3 bg-slate-900 group-hover:bg-[#0B1A3F] text-white hover:bg-slate-850 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Open Workspace
                      <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-fade-in" id="dashboard-projects-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200">
                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace Name</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Created Date</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Training</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">O&M Manuals</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center font-sans">Warranties</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Total Specs</th>
                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((project) => {
                    const totalItems =
                      project.requirements.length +
                      project.omRequirements.length +
                      project.warrantyRequirements.length;
                    return (
                      <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Name & Desc */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {project.projectId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-800 uppercase font-extrabold border border-slate-205 font-mono">
                                {project.projectId}
                              </span>
                            )}
                            <div
                              className="font-extrabold text-slate-900 group-hover:text-[#0B1A3F] transition-colors text-sm cursor-pointer hover:underline inline-block"
                              onClick={() => onSelectProject(project.id)}
                              id={`table-link-project-${project.id}`}
                            >
                              {project.name}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-[280px] md:max-w-md mt-0.5 font-medium" title={project.description}>
                            {project.description || "No customized workspace description added."}
                          </div>
                        </td>
                        {/* Created Date */}
                        <td className="py-4 px-5 text-slate-500 hidden md:table-cell text-xs font-medium">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        {/* Training Counts */}
                        <td className="py-3 px-5 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-amber-50 rounded-full border border-amber-100/70 text-xs font-semibold text-amber-850">
                            {project.requirements.length}
                          </span>
                        </td>
                        {/* O&M Counts */}
                        <td className="py-3 px-5 text-center font-sans">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-[#0B1A3F]/5 rounded-full border border-[#0B1A3F]/15 text-[#0B1A3F] text-xs font-semibold">
                            {project.omRequirements.length}
                          </span>
                        </td>
                        {/* Warranties Counts */}
                        <td className="py-3 px-5 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-rose-50 rounded-full border border-rose-100/70 text-xs font-semibold text-rose-850">
                            {project.warrantyRequirements.length}
                          </span>
                        </td>
                        {/* Total Specs */}
                        <td className="py-3 px-5 text-center font-bold text-slate-700 text-xs">
                          {totalItems}
                        </td>
                        {/* Actions */}
                        <td className="py-3 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            id={`table-btn-delete-project-${project.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all inline-flex items-center justify-center cursor-pointer"
                            title="Delete Space"
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            id={`table-btn-open-project-${project.id}`}
                            type="button"
                            onClick={() => onSelectProject(project.id)}
                            className="inline-flex items-center gap-1 py-1.5 px-3 bg-slate-900 group-hover:bg-[#0B1A3F] text-white hover:bg-slate-850 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Open Workspace
                            <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Creation workspace overlay Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="project-create-modal">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Folder size={16} className="text-[#0B1A3F]" />
                Create Project Workspace
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4 text-left">
                <div>
                  <label htmlFor="create-project-name" className="block text-xs font-bold text-slate-500 mb-1">
                     Project Workspace Name *
                  </label>
                  <input
                    id="create-project-name"
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. Terminal 2 Airport Expansion"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0B1A3F] font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="create-project-id" className="block text-xs font-bold text-slate-500 mb-1">
                     Project Code / ID (Optional)
                  </label>
                  <input
                    id="create-project-id"
                    type="text"
                    maxLength={30}
                    placeholder="e.g. PRJ-2026A"
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0B1A3F] font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="create-project-desc" className="block text-xs font-bold text-slate-500 mb-1">
                     Workspace Description
                  </label>
                  <textarea
                    id="create-project-desc"
                    rows={3}
                    maxLength={200}
                    placeholder="Brief scope summary, location, or prime contractor name..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0B1A3F] text-slate-600 bg-white"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-create-project"
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-5 py-2 text-xs bg-[#0B1A3F] border border-[#0B1A3F] font-bold text-white rounded-lg hover:bg-[#122656] shadow-sm transition-colors disabled:opacity-50"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="project-delete-confirmation-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <Trash2 size={20} className="stroke-[2]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Delete "{projectToDelete.name}"?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will permanently delete this project workspace and all its parsed specifications, O&M manuals, and training logs. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="flex-1 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-project"
                type="button"
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="flex-1 py-2 text-xs bg-rose-600 hover:bg-rose-700 border border-rose-700 font-bold text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
