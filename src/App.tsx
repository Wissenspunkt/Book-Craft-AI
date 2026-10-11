import React, { useState, useEffect } from 'react';
import { 
  BookProject, 
  WorkflowPhase 
} from './types';
import { INITIAL_SAMPLE_PROJECTS } from './data/sampleData';
import { BOOK_TEMPLATES } from './data/templates';
import { Navbar } from './components/Navbar';
import { WorkflowStepper } from './components/WorkflowStepper';
import { ConceptPhase } from './components/ConceptPhase';
import { OutlinePhase } from './components/OutlinePhase';
import { WritingPhase } from './components/WritingPhase';
import { FactCheckPhase } from './components/FactCheckPhase';
import { ProofreadPhase } from './components/ProofreadPhase';
import { IllustrationsPhase } from './components/IllustrationsPhase';
import { ExportSyncPhase } from './components/ExportSyncPhase';
import { DashboardView } from './components/DashboardView';
import { Plus, BookOpen, X, Sparkles } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<BookProject[]>(() => {
    const local = localStorage.getItem('bookcraft_projects');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SAMPLE_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(
    () => projects[0]?.id || 'proj_ai_revolution_2026'
  );

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Project Form state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectAuthor, setNewProjectAuthor] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(BOOK_TEMPLATES[0].id);

  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;

  // Persist to localStorage & Trigger Cloud Sync
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('bookcraft_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Auto Cloud-Sync when current project changes
  useEffect(() => {
    if (currentProject) {
      syncProjectToCloud(currentProject);
    }
  }, [currentProject?.id, currentProject?.lastModified]);

  const syncProjectToCloud = async (proj: BookProject) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: proj.id,
          projectData: proj
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, cloudSynced: true, lastSyncedAt: data.lastSynced } : p));
        }
      }
    } catch (e) {
      console.error('Cloud Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProject = (updated: Partial<BookProject>) => {
    if (!currentProject) return;

    const modifiedProj = {
      ...currentProject,
      ...updated,
      lastModified: new Date().toISOString()
    };

    setProjects(prev => prev.map(p => p.id === currentProject.id ? modifiedProj : p));
  };

  const handlePhaseChange = (phase: WorkflowPhase) => {
    handleUpdateProject({ currentPhase: phase });
  };

  const handleCreateNewProject = () => {
    if (!newProjectTitle.trim()) return;

    const tmpl = BOOK_TEMPLATES.find(t => t.id === selectedTemplateId) || BOOK_TEMPLATES[0];

    const newProj: BookProject = {
      id: `proj_${Date.now()}`,
      title: newProjectTitle,
      subtitle: '',
      author: newProjectAuthor || 'Unbekannter Autor',
      genre: tmpl.genre,
      templateId: tmpl.id,
      targetLength: tmpl.recommendedWordCount,
      targetWordCount: 20000,
      style: tmpl.defaultStyle,
      tone: tmpl.defaultTone,
      targetAudience: 'Allgemeines Publikum',
      citationStyle: 'APA',
      summary: '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      currentPhase: 'concept',
      cloudSynced: false,
      bibliography: [],
      chapters: tmpl.sampleOutline.map((title, idx) => ({
        id: `chap_init_${Date.now()}_${idx}`,
        chapterNumber: idx + 1,
        title,
        summary: 'Kapitelbeschreibung...',
        estimatedWords: 2500,
        actualWords: 0,
        status: 'draft',
        content: '',
        keyFacts: [],
        proofreadSuggestions: []
      }))
    };

    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setShowCreateModal(false);
    setNewProjectTitle('');
    setNewProjectAuthor('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentProject={currentProject}
        projects={projects}
        onSelectProject={(id) => setActiveProjectId(id)}
        onNewProject={() => setShowCreateModal(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        isDashboardOpen={isDashboardOpen}
        onManualSync={() => currentProject && syncProjectToCloud(currentProject)}
        isSyncing={isSyncing}
      />

      {currentProject ? (
        <>
          {/* Workflow Stepper Bar */}
          <WorkflowStepper
            currentPhase={currentProject.currentPhase || 'concept'}
            onPhaseChange={handlePhaseChange}
          />

          {/* Main Phase Workspace */}
          <main className="flex-1 pb-16">
            {currentProject.currentPhase === 'concept' && (
              <ConceptPhase
                project={currentProject}
                onUpdateProject={handleUpdateProject}
                onNextPhase={() => handlePhaseChange('outline')}
              />
            )}

            {currentProject.currentPhase === 'outline' && (
              <OutlinePhase
                project={currentProject}
                onUpdateProject={handleUpdateProject}
                onNextPhase={() => handlePhaseChange('writing')}
              />
            )}

            {currentProject.currentPhase === 'writing' && (
              <WritingPhase
                project={currentProject}
                onUpdateProject={handleUpdateProject}
                onNextPhase={() => handlePhaseChange('factcheck')}
                onNavigateToIllustrations={(chapId) => handlePhaseChange('illustrations')}
              />
            )}

            {currentProject.currentPhase === 'factcheck' && (
              <FactCheckPhase
                project={currentProject}
                onUpdateProject={handleUpdateProject}
                onNextPhase={() => handlePhaseChange('proofread')}
              />
            )}

            {currentProject.currentPhase === 'proofread' && (
              <ProofreadPhase
                project={currentProject}
                onUpdateProject={handleUpdateProject}
                onNextPhase={() => handlePhaseChange('illustrations')}
              />
            )}

            {currentProject.currentPhase === 'illustrations' && (
              <IllustrationsPhase
                project={currentProject}
                onUpdateProject={handleUpdateProject}
                onNextPhase={() => handlePhaseChange('export')}
              />
            )}

            {currentProject.currentPhase === 'export' && (
              <ExportSyncPhase
                project={currentProject}
                onUpdateProject={handleUpdateProject}
                onManualSync={() => syncProjectToCloud(currentProject)}
                isSyncing={isSyncing}
              />
            )}
          </main>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600" />
          <h2 className="text-xl font-bold text-white">Kein Buchprojekt ausgewählt</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
          >
            Neues Buchprojekt anlegen
          </button>
        </div>
      )}

      {/* Dashboard Modal View */}
      {isDashboardOpen && currentProject && (
        <DashboardView
          project={currentProject}
          onClose={() => setIsDashboardOpen(false)}
          onRestoreSnapshot={(data) => {
            handleUpdateProject(data);
            setIsDashboardOpen(false);
          }}
        />
      )}

      {/* Create New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif font-bold text-lg text-white">Neues Buchprojekt erstellen</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Buchtitel *</label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="z.B. Quantensprünge der Biotechnologie"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Autor Name</label>
                <input
                  type="text"
                  value={newProjectAuthor}
                  onChange={(e) => setNewProjectAuthor(e.target.value)}
                  placeholder="z.B. Prof. Dr. Elena Frank"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Vorlage auswählen</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {BOOK_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                        selectedTemplateId === tmpl.id
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{tmpl.name}</div>
                        <div className="text-[11px] text-slate-400">{tmpl.genre}</div>
                      </div>
                      <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                        {tmpl.recommendedWordCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateNewProject}
                disabled={!newProjectTitle.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-600/20"
              >
                Projekt erstellen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
