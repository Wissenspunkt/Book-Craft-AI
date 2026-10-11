import React, { useState, useEffect } from 'react';
import { 
  BookProject, 
  Chapter 
} from '../types';
import { 
  ListTree, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ArrowRight, 
  RefreshCw, 
  BookOpen, 
  FileText,
  GripVertical,
  Sliders,
  Calculator,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OutlinePhaseProps {
  project: BookProject;
  onUpdateProject: (updated: Partial<BookProject>) => void;
  onNextPhase: () => void;
}

export const OutlinePhase: React.FC<OutlinePhaseProps> = ({
  project,
  onUpdateProject,
  onNextPhase
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateOutlineWithAi = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/gemini/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          subtitle: project.subtitle,
          genre: project.genre,
          targetLength: project.targetLength,
          style: project.style,
          tone: project.tone,
          targetAudience: project.targetAudience,
          coreTopic: project.summary,
          targetChapterCount: project.targetChapterCount
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data?.chapters) {
        const newChapters: Chapter[] = resData.data.chapters.map((c: any, idx: number) => ({
          id: `chap_ai_${Date.now()}_${idx}`,
          chapterNumber: idx + 1,
          title: c.title,
          summary: c.summary,
          estimatedWords: c.estimatedWords || 2500,
          actualWords: 0,
          status: 'draft',
          content: '',
          keyFacts: (c.keyFactsToVerify || []).map((kf: string, kfIdx: number) => ({
            id: `kf_${idx}_${kfIdx}`,
            statement: kf,
            status: 'review_needed',
            explanation: 'Aus automatischer Gliederungs-Planung extrahiert.'
          })),
          proofreadSuggestions: []
        }));

        const newBiblio = (resData.data.suggestedBibliography || []).map((b: any, bIdx: number) => ({
          id: `src_gen_${Date.now()}_${bIdx}`,
          author: b.author || 'Autor',
          title: b.title || 'Publikation',
          year: b.year || '2025',
          publisher: b.publisher || 'Verlag',
          type: b.type || 'Book',
          citationKey: `Ref${bIdx + 1}`
        }));

        onUpdateProject({
          chapters: newChapters,
          bibliography: [...(project.bibliography || []), ...newBiblio],
          summary: resData.data.summary || project.summary
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if ((!project.chapters || project.chapters.length === 0) && project.title) {
      handleGenerateOutlineWithAi();
    }
  }, []);

  const handleAddChapter = () => {
    const nextNum = project.chapters.length + 1;
    const defaultWords = project.targetWordCount > 0 
      ? Math.round(project.targetWordCount / Math.max(1, nextNum)) 
      : 2500;

    const newChap: Chapter = {
      id: `chap_manual_${Date.now()}`,
      chapterNumber: nextNum,
      title: `Kapitel ${nextNum}: Neuer Kapiteltitel`,
      summary: 'Kurze Zusammenfassung des Kapitelziels und der Kernaussagen...',
      estimatedWords: defaultWords,
      actualWords: 0,
      status: 'draft',
      content: '',
      keyFacts: [],
      proofreadSuggestions: []
    };

    onUpdateProject({
      chapters: [...project.chapters, newChap]
    });
  };

  const handleDeleteChapter = (id: string) => {
    const updated = project.chapters
      .filter(c => c.id !== id)
      .map((c, idx) => ({ ...c, chapterNumber: idx + 1 }));

    onUpdateProject({ chapters: updated });
  };

  const handleUpdateChapterInfo = (id: string, updates: Partial<Chapter>) => {
    const updated = project.chapters.map(c => c.id === id ? { ...c, ...updates } : c);
    onUpdateProject({ chapters: updated });
  };

  const handleDistributeWordsEvenly = () => {
    if (project.chapters.length === 0) return;
    const totalTarget = project.targetWordCount || 20000;
    const wordsPerChap = Math.round(totalTarget / project.chapters.length);

    const updated = project.chapters.map(c => ({
      ...c,
      estimatedWords: wordsPerChap
    }));

    onUpdateProject({ chapters: updated });
  };

  const totalEstimatedChapterWords = project.chapters.reduce(
    (sum, c) => sum + (c.estimatedWords || 0), 0
  );

  const targetDiff = totalEstimatedChapterWords - (project.targetWordCount || 20000);

  return (
    <div id="outline-phase-view" className="max-w-5xl mx-auto space-y-8 py-6 px-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ListTree className="w-4 h-4" />
            <span>Schritt 2: Gliederung & Kapitel-Ziellängen</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Gliederungs-Planung für "{project.title || 'Unbenanntes Buch'}"
          </h1>
          <p className="text-xs text-slate-300">
            {project.chapters.length} Kapitel {project.targetChapterCount ? `(Zielvorgabe: ${project.targetChapterCount})` : ''} &bull; Gesamtziel: {project.targetWordCount.toLocaleString('de-DE')} Wörter ({project.targetLength})
          </p>
        </div>

        {/* AI Generator Button */}
        <button
          onClick={handleGenerateOutlineWithAi}
          disabled={isGenerating}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25 shrink-0"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Verfasse Kapiteltitel & Beschreibungen...' : 'Kapiteltitel & Beschreibungen mit KI erstellen'}</span>
        </button>
      </div>

      {/* Chapters Summary & Word Count Budget Bar */}
      {project.chapters.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Wortzahl-Kalkulation & Kapitel-Ziellängen
                </span>
                <span className="text-[11px] text-slate-400">
                  Summe aller Kapitel: <strong className="text-blue-300">{totalEstimatedChapterWords.toLocaleString('de-DE')} Wörter</strong> von <strong className="text-slate-200">{(project.targetWordCount || 20000).toLocaleString('de-DE')} Zielwörtern</strong>
                </span>
              </div>
            </div>

            <button
              onClick={handleDistributeWordsEvenly}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 shrink-0"
              title="Teilt die Gesamtziel-Wortzahl gleichmäßig auf alle bestehenden Kapitel auf"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Gleichmäßig auf Kapitel aufteilen</span>
            </button>
          </div>

          {/* Progress bar comparing chapter targets vs total target */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
              <div
                className={`h-full transition-all duration-300 ${
                  Math.abs(targetDiff) <= 1000 ? 'bg-emerald-500' : targetDiff > 1000 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((totalEstimatedChapterWords / Math.max(1, project.targetWordCount || 20000)) * 100))}%`
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>0 Wörter</span>
              <span className="font-semibold text-slate-300">
                {Math.abs(targetDiff) <= 500 ? (
                  <span className="text-emerald-400 flex items-center space-x-1 inline-flex">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Exakt im Zielbereich ({totalEstimatedChapterWords.toLocaleString('de-DE')} W)</span>
                  </span>
                ) : targetDiff > 0 ? (
                  <span className="text-amber-400">+{targetDiff.toLocaleString('de-DE')} W über Buchziel</span>
                ) : (
                  <span className="text-blue-400">{Math.abs(targetDiff).toLocaleString('de-DE')} W unter Buchziel</span>
                )}
              </span>
              <span>{(project.targetWordCount || 20000).toLocaleString('de-DE')} W</span>
            </div>
          </div>
        </div>
      )}

      {/* Chapters Tree List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-serif font-bold text-slate-100 flex items-center space-x-2">
            <span>Kapitel-Sequenz &amp; Individuelle Ziellängen ({project.chapters.length})</span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateOutlineWithAi}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Kapiteltitel &amp; Beschreibungen mit KI erstellen</span>
            </button>

            <button
              onClick={handleAddChapter}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Kapitel hinzufügen</span>
            </button>
          </div>
        </div>

        {project.chapters.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <ListTree className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 text-base">Noch keine Kapitel gegliedert</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Klicken Sie unten auf den Button, um automatisch alle Kapiteltitel, ausführliche Kapitelbeschreibungen und Wortbudget-Planungen von der KI verfassen zu lassen.
              </p>
            </div>
            <button
              onClick={handleGenerateOutlineWithAi}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition inline-flex items-center space-x-2 shadow-lg shadow-indigo-600/25"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Verfasse Kapiteltitel & Beschreibungen...' : 'Kapiteltitel & Beschreibungen mit KI erstellen'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {project.chapters.map((chap) => (
              <div
                key={chap.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition space-y-4 shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0 mt-0.5">
                      {chap.chapterNumber}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Kapiteltitel</label>
                        <input
                          type="text"
                          value={chap.title}
                          onChange={(e) => handleUpdateChapterInfo(chap.id, { title: e.target.value })}
                          className="w-full bg-slate-950/60 font-bold text-slate-100 text-base focus:outline-none focus:border-blue-500 px-3 py-1.5 rounded-lg border border-slate-800 transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center justify-between">
                          <span>Detaillierte Kapitelbeschreibung &amp; Schreib-Briefing</span>
                          <span className="text-slate-500 font-normal">Dient der KI als Vorlage beim Schreiben</span>
                        </label>
                        <textarea
                          rows={3}
                          value={chap.summary}
                          onChange={(e) => handleUpdateChapterInfo(chap.id, { summary: e.target.value })}
                          placeholder="Detaillierte Beschreibung der Kernthesen, Unterpunkte, Fragestellungen und Praxisbeispiele..."
                          className="w-full bg-slate-950/60 text-xs text-slate-300 focus:outline-none focus:border-blue-500 px-3 py-2 rounded-lg border border-slate-800 transition leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteChapter(chap.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0"
                    title="Kapitel löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Individual Chapter Target Word Count Selector */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ziellänge für Kapitel {chap.chapterNumber}:</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Quick Presets */}
                    <div className="flex items-center space-x-1">
                      {[1500, 2500, 3500, 5000].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleUpdateChapterInfo(chap.id, { estimatedWords: preset })}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                            chap.estimatedWords === preset
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                          }`}
                        >
                          {preset >= 1000 ? `${preset / 1000}k` : preset} W
                        </button>
                      ))}
                    </div>

                    {/* Custom Exact Number Input */}
                    <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                      <input
                        type="number"
                        min={100}
                        max={30000}
                        step={100}
                        value={chap.estimatedWords || 2500}
                        onChange={(e) => handleUpdateChapterInfo(chap.id, { estimatedWords: Math.max(100, Number(e.target.value)) })}
                        className="w-20 bg-transparent text-xs font-bold text-emerald-400 text-center focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400 font-medium">Wörter</span>
                    </div>
                  </div>
                </div>

                {/* Planned Key Facts count */}
                {chap.keyFacts && chap.keyFacts.length > 0 && (
                  <div className="pt-1 flex items-center space-x-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-amber-400">Geforderte Faktenprüfung:</span>
                    <span>{chap.keyFacts.length} Thesen / Fakten zur Verifizierung hinterlegt</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-400">
          Gliederung & Kapitel-Ziellängen konfiguriert? Fahren Sie fort mit dem automatischen KI-Schreibprozess.
        </span>
        <button
          onClick={onNextPhase}
          disabled={project.chapters.length === 0}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25"
        >
          <span>Weiter zum KI-Schreiben (Schritt 3)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
