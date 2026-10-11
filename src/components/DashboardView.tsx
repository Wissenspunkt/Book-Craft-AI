import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BookOpen, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Cloud, 
  History, 
  RefreshCw, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { BookProject } from '../types';

interface DashboardViewProps {
  project: BookProject;
  onClose: () => void;
  onRestoreSnapshot?: (snapshotData: BookProject) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  onClose,
  onRestoreSnapshot
}) => {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);

  // Calculate metrics
  const totalActualWords = project.chapters.reduce((sum, c) => sum + (c.actualWords || 0), 0);
  const targetWords = project.targetWordCount || 20000;
  const wordProgressPercent = Math.min(100, Math.round((totalActualWords / targetWords) * 100));

  // Chapter status counts
  const chapterCounts = {
    draft: project.chapters.filter(c => c.status === 'draft').length,
    writing: project.chapters.filter(c => c.status === 'writing').length,
    factchecked: project.chapters.filter(c => c.status === 'factchecked').length,
    proofread: project.chapters.filter(c => c.status === 'proofread').length,
    completed: project.chapters.filter(c => c.status === 'completed').length
  };

  // Facts metrics
  const allClaims = project.chapters.flatMap(c => c.keyFacts || []);
  const verifiedClaims = allClaims.filter(f => f.status === 'verified').length;
  const reviewClaims = allClaims.filter(f => f.status === 'review_needed').length;
  const missingClaims = allClaims.filter(f => f.status === 'source_missing').length;
  const factVerificationRate = allClaims.length > 0 ? Math.round((verifiedClaims / allClaims.length) * 100) : 100;

  // Readability
  const fleschScores = project.chapters.map(c => c.fleschScore).filter(Boolean) as number[];
  const avgFlesch = fleschScores.length > 0 ? Math.round(fleschScores.reduce((a, b) => a + b, 0) / fleschScores.length) : 65;

  // Est Reading Time (approx 200 words per min)
  const estReadingMins = Math.round(totalActualWords / 200);

  useEffect(() => {
    fetchSnapshots();
  }, [project.id]);

  const fetchSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const res = await fetch(`/api/cloud/snapshots/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  return (
    <div id="dashboard-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div id="dashboard-modal-card" className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 text-slate-100 shadow-2xl space-y-6 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-white">Fortschritts- & Qualitätsanalyse</h2>
              <p className="text-xs text-slate-400">Detaillierte Metriken für "{project.title}"</p>
            </div>
          </div>
          <button
            id="btn-close-dashboard"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Word Count Metric */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Wortanzahl & Ziel</span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {totalActualWords.toLocaleString('de-DE')} <span className="text-xs font-normal text-slate-400">/ {targetWords.toLocaleString('de-DE')}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${wordProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Fortschritt</span>
              <span className="font-semibold text-blue-400">{wordProgressPercent}%</span>
            </div>
          </div>

          {/* Fact Check Accuracy Metric */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Fakten-Kontrollrate</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {factVerificationRate}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {verifiedClaims} verifiziert, {reviewClaims + missingClaims} zu prüfen
            </div>
            <div className="flex space-x-1 mt-3">
              <div className="h-1.5 rounded bg-emerald-500" style={{ flex: verifiedClaims || 1 }} />
              <div className="h-1.5 rounded bg-amber-500" style={{ flex: reviewClaims || 1 }} />
              <div className="h-1.5 rounded bg-rose-500" style={{ flex: missingClaims || 1 }} />
            </div>
          </div>

          {/* Readability Score Metric */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Flesch-Leserindex</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-300">
              {avgFlesch} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {avgFlesch >= 65 ? 'Sehr gut verständlich' : 'Gehobener Fachstil'}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Ziel-Schreibstil: {project.style}
            </div>
          </div>

          {/* Reading Time & Bibliography */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Geschätzte Lesezeit</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              ~{estReadingMins} <span className="text-xs font-normal text-slate-400">Min. ({Math.round(estReadingMins/60*10)/10} Std.)</span>
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Quellen im Verzeichnis:</span>
              <span className="font-bold text-purple-300">{project.bibliography?.length || 0}</span>
            </div>
          </div>

        </div>

        {/* Chapter Breakdown Table & Cloud Sync History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chapter Progress Breakdown */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>Kapitel-Fortschritt & Qualitäts-Status</span>
            </h3>

            <div className="space-y-3">
              {project.chapters.map((chap) => {
                const words = chap.actualWords || 0;
                const percent = Math.min(100, Math.round((words / (chap.estimatedWords || 2000)) * 100));

                return (
                  <div key={chap.id} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400">Kapitel {chap.chapterNumber}</span>
                        <span className="text-xs font-semibold text-white">{chap.title}</span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        chap.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        chap.status === 'factchecked' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        chap.status === 'writing' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {chap.status === 'completed' ? 'Final gelektoriert' :
                         chap.status === 'factchecked' ? 'Fakten verifiziert' :
                         chap.status === 'writing' ? 'In Bearbeitung' : 'Entwurf'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span>{words} / {chap.estimatedWords || 2000} Wörter</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cloud Synchronization & Snapshots */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Cloud-Synchronisierung</span>
              </h3>
              <button 
                onClick={fetchSnapshots}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSnapshots ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Nahtloser Zugriff aktiv. Letzte Synchronisierung: {project.lastSyncedAt ? new Date(project.lastSyncedAt).toLocaleTimeString('de-DE') : 'Gerade eben'}</span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <History className="w-3.5 h-3.5" />
                <span>Wiederherstellbare Cloud-Snapshots</span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {snapshots.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Keine früheren Revisions-Snapshots vorhanden.</p>
                ) : (
                  snapshots.map((snap) => (
                    <div key={snap.id} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-200">{snap.title}</div>
                        <div className="text-[10px] text-slate-500">{snap.timestamp}</div>
                      </div>
                      {onRestoreSnapshot && (
                        <button
                          onClick={() => onRestoreSnapshot(snap.data)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 font-medium text-[11px] transition"
                        >
                          Wiederherstellen
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
