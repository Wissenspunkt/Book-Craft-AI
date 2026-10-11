import React, { useState, useRef } from 'react';
import { 
  BookProject, 
  ProofreadSuggestion 
} from '../types';
import { 
  CheckCheck, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Wand2, 
  FileText, 
  AlertCircle,
  ThumbsUp,
  RefreshCw,
  Square,
  Zap
} from 'lucide-react';

interface ProofreadPhaseProps {
  project: BookProject;
  onUpdateProject: (updated: Partial<BookProject>) => void;
  onNextPhase: () => void;
}

export const ProofreadPhase: React.FC<ProofreadPhaseProps> = ({
  project,
  onUpdateProject,
  onNextPhase
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    project.chapters[0]?.id || ''
  );
  const [isProofreadingSingle, setIsProofreadingSingle] = useState(false);
  const [proofreadResult, setProofreadResult] = useState<{
    fleschIndex?: number;
    readabilityGrade?: string;
    overallAssessment?: string;
    polishedText?: string;
  } | null>(null);

  // Batch Proofread State
  const [isBatchProofreading, setIsBatchProofreading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    currentIndex: number;
    total: number;
    currentChapterTitle: string;
  }>({
    currentIndex: 0,
    total: 0,
    currentChapterTitle: ''
  });

  const stopBatchRef = useRef(false);

  const activeChapter = project.chapters.find(c => c.id === selectedChapterId) || project.chapters[0];

  // Helper to proofread a single chapter and return result
  const runProofreadForChapter = async (chap: typeof project.chapters[0]) => {
    if (!chap.content || chap.content.trim().length < 50) {
      return null;
    }

    const response = await fetch('/api/gemini/proofread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chap.content,
        desiredTone: project.tone,
        desiredStyle: project.style
      })
    });

    const resData = await response.json();
    if (resData.success && resData.data) {
      const suggestions: ProofreadSuggestion[] = (resData.data.suggestions || []).map((s: any, idx: number) => ({
        id: `ps_${Date.now()}_${idx}`,
        type: s.type || 'style',
        originalText: s.originalText,
        suggestedText: s.suggestedText,
        reason: s.reason
      }));

      return {
        fleschIndex: resData.data.fleschIndex || 68,
        readabilityGrade: resData.data.readabilityGrade || 'Gut verständlich',
        overallAssessment: resData.data.overallAssessment || 'Text ist sprachlich präzise aufgebaut.',
        polishedText: resData.data.polishedText || chap.content,
        suggestions
      };
    }

    return null;
  };

  // 1. Single Chapter Proofread
  const handleRunProofreadWithAi = async () => {
    if (!activeChapter || !activeChapter.content || isProofreadingSingle || isBatchProofreading) return;
    setIsProofreadingSingle(true);

    try {
      const res = await runProofreadForChapter(activeChapter);
      if (res) {
        setProofreadResult({
          fleschIndex: res.fleschIndex,
          readabilityGrade: res.readabilityGrade,
          overallAssessment: res.overallAssessment,
          polishedText: res.polishedText
        });

        const updatedChapters = project.chapters.map(c => 
          c.id === activeChapter.id ? { 
            ...c, 
            proofreadSuggestions: res.suggestions, 
            fleschScore: res.fleschIndex,
            status: 'proofread' as const
          } : c
        );

        onUpdateProject({ chapters: updatedChapters });
      }
    } catch (e) {
      console.error("Single proofread error:", e);
    } finally {
      setIsProofreadingSingle(false);
    }
  };

  // 2. BATCH PROOFREAD ALL CHAPTERS AT ONCE
  const handleBatchProofreadAllChapters = async () => {
    if (isBatchProofreading || isProofreadingSingle) return;

    const chaptersWithContent = project.chapters.filter(c => c.content && c.content.trim().length >= 50);

    if (chaptersWithContent.length === 0) {
      alert("Es wurde noch kein Kapiteltext verfasst, der lektoriert werden könnte.");
      return;
    }

    stopBatchRef.current = false;
    setIsBatchProofreading(true);

    setBatchProgress({
      currentIndex: 0,
      total: chaptersWithContent.length,
      currentChapterTitle: chaptersWithContent[0].title
    });

    let currentChaptersState = [...project.chapters];

    for (let i = 0; i < chaptersWithContent.length; i++) {
      if (stopBatchRef.current) break;

      const chap = chaptersWithContent[i];
      setSelectedChapterId(chap.id);

      setBatchProgress({
        currentIndex: i + 1,
        total: chaptersWithContent.length,
        currentChapterTitle: chap.title
      });

      try {
        const res = await runProofreadForChapter(chap);
        if (res) {
          // Update content directly with polished text if available, or keep suggestions
          const finalContent = res.polishedText || chap.content;
          
          currentChaptersState = currentChaptersState.map(c => 
            c.id === chap.id ? { 
              ...c, 
              content: finalContent,
              actualWords: finalContent.trim().split(/\s+/).length,
              proofreadSuggestions: res.suggestions, 
              fleschScore: res.fleschIndex,
              status: 'proofread' as const
            } : c
          );

          onUpdateProject({ chapters: currentChaptersState });
        }
      } catch (err) {
        console.error(`Batch proofread error on Chapter ${chap.chapterNumber}:`, err);
      }
    }

    setIsBatchProofreading(false);
  };

  const handleStopBatch = () => {
    stopBatchRef.current = true;
  };

  const handleApplySingleSuggestion = (sug: ProofreadSuggestion) => {
    if (!activeChapter || !activeChapter.content) return;
    const newContent = activeChapter.content.replace(sug.originalText, sug.suggestedText);

    const updatedSuggestions = activeChapter.proofreadSuggestions.filter(s => s.id !== sug.id);
    const updatedChapters = project.chapters.map(c => 
      c.id === activeChapter.id ? { ...c, content: newContent, proofreadSuggestions: updatedSuggestions } : c
    );

    onUpdateProject({ chapters: updatedChapters });
  };

  // Apply all suggestions of the active chapter at once
  const handleApplyAllSuggestions = () => {
    if (!activeChapter || !activeChapter.content || !activeChapter.proofreadSuggestions?.length) return;

    let updatedContent = activeChapter.content;
    activeChapter.proofreadSuggestions.forEach((sug) => {
      if (sug.originalText && updatedContent.includes(sug.originalText)) {
        updatedContent = updatedContent.replace(sug.originalText, sug.suggestedText);
      }
    });

    const finalContent = updatedContent;
    const updatedChapters = project.chapters.map((c) =>
      c.id === activeChapter.id
        ? {
            ...c,
            content: finalContent,
            actualWords: finalContent.trim().split(/\s+/).length,
            proofreadSuggestions: [],
            status: 'proofread' as const,
          }
        : c
    );

    onUpdateProject({ chapters: updatedChapters });
  };

  // Apply all suggestions across the entire book
  const handleApplyAllSuggestionsInAllChapters = () => {
    const updatedChapters = project.chapters.map((chap) => {
      if (!chap.proofreadSuggestions || chap.proofreadSuggestions.length === 0) return chap;
      let newContent = chap.content || '';
      chap.proofreadSuggestions.forEach((sug) => {
        if (sug.originalText && newContent.includes(sug.originalText)) {
          newContent = newContent.replace(sug.originalText, sug.suggestedText);
        }
      });
      return {
        ...chap,
        content: newContent,
        actualWords: newContent.trim().split(/\s+/).length,
        proofreadSuggestions: [],
        status: 'proofread' as const,
      };
    });

    onUpdateProject({ chapters: updatedChapters });
  };

  const handleApplyPolishedText = () => {
    if (!activeChapter || !proofreadResult?.polishedText) return;

    const updatedChapters = project.chapters.map(c => 
      c.id === activeChapter.id ? { 
        ...c, 
        content: proofreadResult.polishedText!, 
        proofreadSuggestions: [], 
        status: 'completed' as const 
      } : c
    );

    onUpdateProject({ chapters: updatedChapters });
  };

  const proofreadChaptersCount = project.chapters.filter(c => c.status === 'proofread' || c.status === 'completed' || (c.fleschScore && c.fleschScore > 0)).length;
  const totalSuggestionsCount = project.chapters.reduce(
    (acc, chap) => acc + (chap.proofreadSuggestions?.length || 0),
    0
  );

  return (
    <div id="proofread-phase-view" className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <CheckCheck className="w-4 h-4" />
            <span>Schritt 5: KI-gestütztes Korrektorat & Lektorat</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white">
            Sprachliche Feinabstimmung & Lesbarkeits-Optimierung
          </h1>
          <p className="text-xs text-slate-300">
            {proofreadChaptersCount} von {project.chapters.length} Kapiteln lektoriert &bull; Tonalität: "{project.tone}"
            {totalSuggestionsCount > 0 && ` • ${totalSuggestionsCount} offene Korrekturen im Buch`}
          </p>
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {totalSuggestionsCount > 0 && (
            <button
              onClick={handleApplyAllSuggestionsInAllChapters}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition border border-emerald-500/40"
              title="Bestätigt alle Korrekturen in allen Kapiteln auf einmal"
            >
              <CheckCheck className="w-4 h-4 text-emerald-200" />
              <span>Alle Korrekturen im Buch bestätigen ({totalSuggestionsCount})</span>
            </button>
          )}

          {!isBatchProofreading ? (
            <button
              onClick={handleBatchProofreadAllChapters}
              disabled={isProofreadingSingle}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition border border-purple-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Alle Kapitel am Stück lektorieren</span>
            </button>
          ) : (
            <button
              onClick={handleStopBatch}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Lektorat abbrechen</span>
            </button>
          )}

          <button
            onClick={onNextPhase}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20"
          >
            <span>Weiter zu Illustrationen</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Batch Proofreading Live Progress Banner Overlay */}
      {isBatchProofreading && (
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-500/50 rounded-2xl p-5 space-y-3 shadow-2xl animate-pulse">
          <div className="flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span className="font-bold text-white text-sm">
                Lektoriere Kapitel {batchProgress.currentIndex} von {batchProgress.total}:
              </span>
              <span className="text-purple-300 font-medium italic">
                "{batchProgress.currentChapterTitle}"
              </span>
            </div>
            <span className="font-bold text-purple-400 font-mono">
              {Math.round((batchProgress.currentIndex / batchProgress.total) * 100)}%
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 h-full transition-all duration-500"
              style={{ width: `${(batchProgress.currentIndex / batchProgress.total) * 100}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
            <span>Stil, Grammatik, Lesbarkeit und Satzbau werden automatisch optimiert...</span>
            <button
              onClick={handleStopBatch}
              className="text-rose-400 hover:underline font-semibold"
            >
              Prozess stoppen
            </button>
          </div>
        </div>
      )}

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Chapter Selector & Trigger Controls (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kapitel wählen & Lektorieren
          </h2>

          <select
            value={selectedChapterId}
            onChange={(e) => {
              setSelectedChapterId(e.target.value);
              setProofreadResult(null);
            }}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none cursor-pointer"
          >
            {project.chapters.map(c => (
              <option key={c.id} value={c.id}>
                Kapitel {c.chapterNumber}: {c.title} {c.fleschScore ? `(Flesch: ${c.fleschScore})` : ''}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            <button
              onClick={handleBatchProofreadAllChapters}
              disabled={isBatchProofreading || isProofreadingSingle}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>Alle Kapitel am Stück lektorieren</span>
            </button>

            <button
              onClick={handleRunProofreadWithAi}
              disabled={isProofreadingSingle || isBatchProofreading || !activeChapter?.content}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isProofreadingSingle ? 'animate-spin' : ''}`} />
              <span>Nur Kapitel {activeChapter?.chapterNumber || 1} einzeln prüfen</span>
            </button>
          </div>

          {/* Assessment Summary Box */}
          {proofreadResult && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-medium">Flesch-Leserindex:</span>
                <span className="font-bold text-indigo-400 text-sm">{proofreadResult.fleschIndex} / 100</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Einstufung:</span>
                <span className="text-slate-200 font-semibold">{proofreadResult.readabilityGrade}</span>
              </div>
              <div className="text-slate-300 italic pt-1 border-t border-slate-800/60">
                "{proofreadResult.overallAssessment}"
              </div>

              {proofreadResult.polishedText && (
                <button
                  onClick={handleApplyPolishedText}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition mt-2 flex items-center justify-center space-x-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Gesamtoptimierten Text übernehmen</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Suggestions & Chapter Content Comparison (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-serif font-bold text-slate-100 text-base">
                Lektorats-Vorschläge & Korrekturen
              </h2>
              <span className="text-xs text-purple-400 font-semibold">
                {activeChapter?.proofreadSuggestions?.length || 0} Optimierungen für Kapitel {activeChapter?.chapterNumber || 1}
              </span>
            </div>

            {/* BUTTON: Alle Korrekturvorschläge bestätigen */}
            {activeChapter?.proofreadSuggestions && activeChapter.proofreadSuggestions.length > 0 && (
              <button
                onClick={handleApplyAllSuggestions}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition border border-emerald-400/30 cursor-pointer"
                title="Wendet alle Korrekturvorschläge dieses Kapitels automatisch auf den Text an"
              >
                <CheckCheck className="w-4 h-4 text-emerald-200" />
                <span>Alle Korrekturvorschläge bestätigen ({activeChapter.proofreadSuggestions.length})</span>
              </button>
            )}
          </div>

          {/* Suggestions List */}
          <div className="space-y-3">
            {(!activeChapter?.proofreadSuggestions || activeChapter.proofreadSuggestions.length === 0) ? (
              <div className="bg-slate-950/60 p-8 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-3">
                <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-semibold text-slate-300">Keine ausstehenden Korrekturvorschläge in Kapitel {activeChapter?.chapterNumber || 1}.</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Klicken Sie oben auf <strong className="text-purple-400">"Alle Kapitel am Stück lektorieren"</strong>, um das komplette Buch in einem Durchlauf sprachlich zu verfeinern.
                </p>
              </div>
            ) : (
              activeChapter.proofreadSuggestions.map((sug) => (
                <div key={sug.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase">
                      {sug.type}
                    </span>
                    <button
                      onClick={() => handleApplySingleSuggestion(sug)}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Übernehmen</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-lg text-rose-200">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Original</span>
                      "{sug.originalText}"
                    </div>
                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-lg text-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Vorschlag</span>
                      "{sug.suggestedText}"
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans italic">Begründung: {sug.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
