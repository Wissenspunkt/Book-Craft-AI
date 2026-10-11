import React, { useState, useRef } from 'react';
import { 
  BookProject, 
  Chapter 
} from '../types';
import { 
  PenTool, 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  RefreshCw, 
  FileText, 
  ArrowRight, 
  Layers, 
  Quote, 
  ImageIcon,
  Wand2,
  Copy,
  Check,
  Square,
  Bot
} from 'lucide-react';
import { AiTextRefinerModal } from './AiTextRefinerModal';

interface WritingPhaseProps {
  project: BookProject;
  onUpdateProject: (updated: Partial<BookProject>) => void;
  onNextPhase: () => void;
  onNavigateToIllustrations: (chapterId: string) => void;
}

export const WritingPhase: React.FC<WritingPhaseProps> = ({
  project,
  onUpdateProject,
  onNextPhase,
  onNavigateToIllustrations
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    project.chapters[0]?.id || ''
  );
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefinerOpen, setIsRefinerOpen] = useState(false);

  // Batch Writing State
  const [isBatchWriting, setIsBatchWriting] = useState(false);
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

  const handleUpdateChapterContent = (newText: string) => {
    if (!activeChapter) return;
    const words = newText.trim() ? newText.trim().split(/\s+/).length : 0;
    
    const updated = project.chapters.map(c => 
      c.id === activeChapter.id 
        ? { ...c, content: newText, actualWords: words, status: words > 100 ? ('writing' as const) : ('draft' as const) } 
        : c
    );
    onUpdateProject({ chapters: updated });
  };

  // Helper function to generate single chapter content
  const generateSingleChapterContent = async (chap: Chapter, promptOverride?: string) => {
    const existingContext = project.chapters
      .slice(0, chap.chapterNumber - 1)
      .map(c => c.content)
      .filter(Boolean)
      .join('\n');

    const response = await fetch('/api/gemini/chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: project.title,
        chapterTitle: chap.title,
        chapterNumber: chap.chapterNumber,
        summary: promptOverride || chap.summary,
        style: project.style,
        tone: project.tone,
        targetLengthWords: chap.estimatedWords,
        existingContext,
        bibliography: project.bibliography
      })
    });

    const resData = await response.json();
    if (resData.success && resData.content) {
      return resData.content;
    }
    return null;
  };

  // 1. Single Chapter Generation
  const handleGenerateChapterWithAi = async () => {
    if (!activeChapter || isGeneratingContent || isBatchWriting) return;
    setIsGeneratingContent(true);

    try {
      const content = await generateSingleChapterContent(activeChapter, customPrompt);
      if (content) {
        handleUpdateChapterContent(content);
      }
    } catch (e) {
      console.error("Single chapter generation error:", e);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // 2. BATCH WRITE ALL CHAPTERS AT ONCE
  const handleBatchWriteAllChapters = async () => {
    if (isBatchWriting || isGeneratingContent) return;

    stopBatchRef.current = false;
    setIsBatchWriting(true);

    let currentChaptersState = [...project.chapters];

    setBatchProgress({
      currentIndex: 0,
      total: currentChaptersState.length,
      currentChapterTitle: currentChaptersState[0]?.title || ''
    });

    for (let i = 0; i < currentChaptersState.length; i++) {
      if (stopBatchRef.current) break;

      const chap = currentChaptersState[i];
      setSelectedChapterId(chap.id);

      setBatchProgress({
        currentIndex: i + 1,
        total: currentChaptersState.length,
        currentChapterTitle: chap.title
      });

      try {
        const content = await generateSingleChapterContent(chap, i === 0 && customPrompt ? customPrompt : undefined);
        if (content) {
          const words = content.trim() ? content.trim().split(/\s+/).length : 0;
          
          currentChaptersState = currentChaptersState.map(c => 
            c.id === chap.id 
              ? { ...c, content, actualWords: words, status: words > 100 ? ('writing' as const) : ('draft' as const) } 
              : c
          );

          onUpdateProject({ chapters: currentChaptersState });
        }
      } catch (err) {
        console.error(`Batch writing error on Chapter ${chap.chapterNumber}:`, err);
      }
    }

    setIsBatchWriting(false);
  };

  const handleStopBatch = () => {
    stopBatchRef.current = true;
  };

  const handleCopyContent = () => {
    if (!activeChapter?.content) return;
    navigator.clipboard.writeText(activeChapter.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalWrittenWords = project.chapters.reduce((sum, c) => sum + (c.actualWords || 0), 0);
  const writtenChaptersCount = project.chapters.filter(c => (c.actualWords || 0) > 100).length;

  return (
    <div id="writing-phase-view" className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <PenTool className="w-4 h-4" />
            <span>Schritt 3: Vollautomatisches Kapitel-Schreiben</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white">
            Vollständiges Buch verfassen & Kapitel lektorieren
          </h1>
          <p className="text-xs text-slate-300">
            {writtenChaptersCount} von {project.chapters.length} Kapiteln fertig geschrieben &bull; {totalWrittenWords.toLocaleString()} Wörter insgesamt
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isBatchWriting ? (
            <button
              onClick={handleBatchWriteAllChapters}
              disabled={isGeneratingContent}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition border border-purple-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Alle Kapitel am Stück schreiben</span>
            </button>
          ) : (
            <button
              onClick={handleStopBatch}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Schreibprozess abbrechen</span>
            </button>
          )}

          <button
            onClick={onNextPhase}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20"
          >
            <span>Weiter zur Faktenkontrolle (Schritt 4)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Batch Writing Live Progress Banner Overlay */}
      {isBatchWriting && (
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-500/50 rounded-2xl p-5 space-y-3 shadow-2xl animate-pulse">
          <div className="flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span className="font-bold text-white text-sm">
                Schreibe Kapitel {batchProgress.currentIndex} von {batchProgress.total}:
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
              className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-400 h-full transition-all duration-500"
              style={{ width: `${(batchProgress.currentIndex / batchProgress.total) * 100}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
            <span>KI verfasst flüssigen, stilistisch abgestimmten Fließtext mit Fachbelegen...</span>
            <button
              onClick={handleStopBatch}
              className="text-rose-400 hover:underline font-semibold"
            >
              Prozess stoppen
            </button>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Chapter Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kapitelauswahl
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">{project.chapters.length} Kapitel</span>
          </div>

          {/* Prominent Write All Button in Sidebar */}
          <button
            onClick={handleBatchWriteAllChapters}
            disabled={isBatchWriting || isGeneratingContent}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Alle Kapitel am Stück schreiben</span>
          </button>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {project.chapters.map((chap) => {
              const isActive = chap.id === activeChapter?.id;
              const hasContent = (chap.actualWords || 0) > 0;

              return (
                <button
                  key={chap.id}
                  onClick={() => setSelectedChapterId(chap.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-sm'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {chap.chapterNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-slate-100 truncate">{chap.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                      <span>{chap.actualWords || 0} / {chap.estimatedWords} Wörter</span>
                      {hasContent ? (
                        <span className="text-emerald-400 text-[10px] font-semibold">Geschrieben</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Entwurf</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Chapter Editor & AI Controls (8 cols) */}
        {activeChapter ? (
          <div className="lg:col-span-8 space-y-4">
            
            {/* AI Generator Control Box */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Kapitel {activeChapter.chapterNumber} oder gesamtes Buch verfassen
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToIllustrations(activeChapter.id)}
                  className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Illustration erstellen</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Optionale Regieanweisung (z.B. Besondere Schwerpunkte, Belege für Studie X einbauen)..."
                  className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBatchWriteAllChapters}
                    disabled={isBatchWriting || isGeneratingContent}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shrink-0 transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Alle Kapitel am Stück schreiben</span>
                  </button>

                  <button
                    onClick={handleGenerateChapterWithAi}
                    disabled={isGeneratingContent || isBatchWriting}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center space-x-1 shrink-0 transition disabled:opacity-50"
                    title={`Nur Kapitel ${activeChapter.chapterNumber} einzeln schreiben`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isGeneratingContent ? 'animate-spin' : ''}`} />
                    <span>Nur Kap. {activeChapter.chapterNumber}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Workspace */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    Kapitel {activeChapter.chapterNumber}: {activeChapter.title}
                  </h3>
                  <p className="text-xs text-slate-400">{activeChapter.summary}</p>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setIsRefinerOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-blue-600/30 hover:from-purple-600/50 hover:to-blue-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition"
                    title="Text an manuelle KI zur Überarbeitung übergeben"
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-300" />
                    <span>KI-Textüberarbeitung</span>
                  </button>

                  <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    <span className="font-bold text-blue-400">{activeChapter.actualWords || 0}</span> Wörter
                  </div>
                  <button
                    onClick={handleCopyContent}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="In Zwischenablage kopieren"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Text Area Input */}
              <textarea
                rows={16}
                value={activeChapter.content || ''}
                onChange={(e) => handleUpdateChapterContent(e.target.value)}
                placeholder="Schreiben Sie hier Ihren Text oder lassen Sie ihn mit dem oberen KI-Generator verfassen... Nutzen Sie Markdown für Überschriften (##) und Zitate."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 font-serif leading-relaxed focus:outline-none focus:border-blue-500/80 transition resize-y"
              />

              {/* Chapter Footer Tools */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Stil: {project.style} &bull; Zitationen in eckigen Klammern [Beleg: ...]</span>
                <span className="text-emerald-400 font-medium">Autosave aktiv</span>
              </div>

            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            Wählen Sie ein Kapitel auf der linken Seite aus.
          </div>
        )}

      </div>

      {activeChapter && (
        <AiTextRefinerModal
          isOpen={isRefinerOpen}
          onClose={() => setIsRefinerOpen(false)}
          title={`Kapitel ${activeChapter.chapterNumber} KI-Überarbeitung`}
          chapterTitle={activeChapter.title}
          originalText={activeChapter.content || ''}
          projectContext={project}
          onApplyRefinedText={(newText) => handleUpdateChapterContent(newText)}
        />
      )}

    </div>
  );
};
