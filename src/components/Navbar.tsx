import React from 'react';
import { 
  BookOpen, 
  Cloud, 
  CloudCheck, 
  Download, 
  PlusCircle, 
  LayoutDashboard, 
  FolderKanban,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { BookProject } from '../types';

interface NavbarProps {
  currentProject: BookProject | null;
  projects: BookProject[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onOpenDashboard: () => void;
  isDashboardOpen: boolean;
  onManualSync: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onOpenDashboard,
  isDashboardOpen,
  onManualSync,
  isSyncing
}) => {
  return (
    <header id="main-header" className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                BookCraft AI
              </span>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                Pro Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Automatisierte Bucherstellung & Faktenkontrolle</p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Project Switcher */}
          {projects.length > 0 && (
            <div className="relative flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 text-xs">
              <FolderKanban className="w-4 h-4 text-slate-400 ml-2 mr-1" />
              <select
                id="project-select-dropdown"
                value={currentProject?.id || ''}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-transparent text-slate-200 py-1 pr-6 pl-1 font-medium focus:outline-none cursor-pointer border-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.title.length > 28 ? p.title.substring(0, 28) + '...' : p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* New Project Button */}
          <button
            id="btn-new-project"
            onClick={onNewProject}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">Neues Projekt</span>
          </button>

          {/* Cloud Sync Status Indicator */}
          {currentProject && (
            <button
              id="btn-cloud-sync"
              onClick={onManualSync}
              disabled={isSyncing}
              title="Klicken für manuelle Cloud-Synchronisierung"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 text-xs transition"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span className="hidden lg:inline text-blue-400">Sync...</span>
                </>
              ) : (
                <>
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline text-emerald-400">In Cloud</span>
                </>
              )}
            </button>
          )}

          {/* Dashboard Toggle Button */}
          <button
            id="btn-toggle-dashboard"
            onClick={onOpenDashboard}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs transition ${
              isDashboardOpen 
                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' 
                : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Fortschritts-Dashboard</span>
          </button>

        </div>
      </div>
    </header>
  );
};
