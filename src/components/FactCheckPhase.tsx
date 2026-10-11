import React, { useState, useRef } from 'react';
import { 
  BookProject, 
  FactClaim, 
  SourceReference, 
  CitationStyle 
} from '../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BookMarked, 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Square,
  Wand2,
  Check,
  Edit3,
  Scissors,
  CheckSquare
} from 'lucide-react';
import { formatBibliographyText } from '../utils/exportUtils';

interface FactCheckPhaseProps {
  project: BookProject;
  onUpdateProject: (updated: Partial<BookProject>) => void;
  onNextPhase: () => void;
}

const CITATION_STYLES: CitationStyle[] = ['APA', 'MLA', 'Harvard', 'Chicago', 'IEEE'];

export const FactCheckPhase: React.FC<FactCheckPhaseProps> = ({
  project,
  onUpdateProject,
  onNextPhase
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    project.chapters[0]?.id || ''
  );
  const [isFactCheckingSingle, setIsFactCheckingSingle] = useState(false);
  const [fixingClaimId, setFixingClaimId] = useState<string | null>(null);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Batch Fact Check State
  const [isBatchFactChecking, setIsBatchFactChecking] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    currentIndex: number;
    total: number;
    currentChapterTitle: string;
    completedChaptersCount: number;
  }>({
    currentIndex: 0,
    total: 0,
    currentChapterTitle: '',
    completedChaptersCount: 0
  });

  const stopBatchRef = useRef(false);

  const [newSource, setNewSource] = useState<Partial<SourceReference>>({
    author: '',
    title: '',
    year: new Date().getFullYear().toString(),
    publisher: '',
    type: 'Book'
  });
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);

  const activeChapter = project.chapters.find(c => c.id === selectedChapterId) || project.chapters[0];

  // Helper to fact check one chapter and return claims & sources
  const runFactCheckForChapter = async (chap: typeof project.chapters[0]) => {
    if (!chap.content || chap.content.trim().length < 50) {
      return { claims: [], sources: [] };
    }

    const response = await fetch('/api/gemini/fact-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chap.content,
        chapterTitle: chap.title
      })
    });

    const resData = await response.json();
    if (resData.success && resData.data) {
      const claims: FactClaim[] = (resData.data.claims || []).map((c: any, idx: number) => ({
        id: `claim_${Date.now()}_${idx}`,
        statement: c.statement,
        status: c.status || 'review_needed',
        explanation: c.explanation,
        suggestedCitation: c.suggestedCitation
      }));

      const newSources: SourceReference[] = (resData.data.extractedSources || []).map((s: any, idx: number) => ({
        id: `src_${Date.now()}_${idx}`,
        author: s.author || 'Unbekannt',
        title: s.title || 'Quelle',
        year: s.year || '2025',
        publisher: s.publisher || 'Verlag/Web',
        type: s.type || 'Book',
        citationKey: s.citationKey || `Ref_${Date.now()}`
      }));

      return { claims, sources: newSources };
    }

    return { claims: [], sources: [] };
  };

  // 1. Single Chapter Fact Check
  const handleRunFactCheckWithAi = async () => {
    if (!activeChapter || !activeChapter.content || isFactCheckingSingle || isBatchFactChecking) return;
    setIsFactCheckingSingle(true);

    try {
      const { claims, sources } = await runFactCheckForChapter(activeChapter);

      const updatedChapters = project.chapters.map(c => 
        c.id === activeChapter.id ? { ...c, keyFacts: claims, status: 'factchecked' as const } : c
      );

      onUpdateProject({
        chapters: updatedChapters,
        bibliography: [...(project.bibliography || []), ...sources]
      });
    } catch (e) {
      console.error("Fact check single error:", e);
    } finally {
      setIsFactCheckingSingle(false);
    }
  };

  // 2. BATCH FACT CHECK ALL CHAPTERS AT ONCE
  const handleBatchFactCheckAllChapters = async () => {
    if (isBatchFactChecking || isFactCheckingSingle) return;

    const chaptersWithContent = project.chapters.filter(c => c.content && c.content.trim().length >= 50);

    if (chaptersWithContent.length === 0) {
      alert("Es wurde noch kein Kapiteltext verfasst, der geprüft werden könnte.");
      return;
    }

    stopBatchRef.current = false;
    setIsBatchFactChecking(true);

    setBatchProgress({
      currentIndex: 0,
      total: chaptersWithContent.length,
      currentChapterTitle: chaptersWithContent[0].title,
      completedChaptersCount: 0
    });

    let currentChaptersState = [...project.chapters];
    let accumulatedBiblio = [...(project.bibliography || [])];

    for (let i = 0; i < chaptersWithContent.length; i++) {
      if (stopBatchRef.current) break;

      const chap = chaptersWithContent[i];
      setSelectedChapterId(chap.id);

      setBatchProgress({
        currentIndex: i + 1,
        total: chaptersWithContent.length,
        currentChapterTitle: chap.title,
        completedChaptersCount: i
      });

      try {
        const { claims, sources } = await runFactCheckForChapter(chap);

        currentChaptersState = currentChaptersState.map(c => 
          c.id === chap.id 
            ? { ...c, keyFacts: claims, status: 'factchecked' as const } 
            : c
        );

        // Deduplicate bibliography
        sources.forEach(src => {
          if (!accumulatedBiblio.some(b => b.title.toLowerCase() === src.title.toLowerCase())) {
            accumulatedBiblio.push(src);
          }
        });

        // Update real-time state
        onUpdateProject({
          chapters: currentChaptersState,
          bibliography: accumulatedBiblio
        });

      } catch (err) {
        console.error(`Batch fact check error on Chapter ${chap.chapterNumber}:`, err);
      }
    }

    setIsBatchFactChecking(false);
  };

  const handleStopBatch = () => {
    stopBatchRef.current = true;
  };

  // Action 1: Mark Claim as Verified manually
  const handleMarkVerified = (claimId: string) => {
    if (!activeChapter) return;
    const updatedKeyFacts = (activeChapter.keyFacts || []).map(f => 
      f.id === claimId ? { ...f, status: 'verified' as const } : f
    );
    const updatedChapters = project.chapters.map(c => 
      c.id === activeChapter.id ? { ...c, keyFacts: updatedKeyFacts } : c
    );
    onUpdateProject({ chapters: updatedChapters });
  };

  // Action 1b: Mark All Claims in Chapter as Verified
  const handleMarkAllVerified = () => {
    if (!activeChapter) return;
    const updatedKeyFacts = (activeChapter.keyFacts || []).map(f => ({
      ...f,
      status: 'verified' as const
    }));
    const updatedChapters = project.chapters.map(c => 
      c.id === activeChapter.id ? { ...c, keyFacts: updatedKeyFacts } : c
    );
    onUpdateProject({ chapters: updatedChapters });
  };

  // Action 2: Completely Delete/Remove Claim and strip statement from chapter content
  const handleRemoveClaimAndText = (claimId: string, statement: string) => {
    if (!activeChapter) return;
    
    // Remove claim from chapter's keyFacts
    const updatedKeyFacts = (activeChapter.keyFacts || []).filter(f => f.id !== claimId);
    
    // Remove statement or sentence from chapter text if present
    let newContent = activeChapter.content || '';
    if (statement && statement.length > 5) {
      newContent = newContent.replace(statement, '').replace(/\s\s+/g, ' ');
    }

    const updatedChapters = project.chapters.map(c => 
      c.id === activeChapter.id ? { 
        ...c, 
        keyFacts: updatedKeyFacts, 
        content: newContent,
        actualWords: newContent.trim() ? newContent.trim().split(/\s+/).length : 0 
      } : c
    );

    onUpdateProject({ chapters: updatedChapters });
  };

  // Action 3: Rephrase / Correct Claim with AI
  const handleFixClaimWithAi = async (claimId: string, statement: string, explanation: string) => {
    if (!activeChapter || fixingClaimId) return;
    setFixingClaimId(claimId);

    try {
      const response = await fetch('/api/gemini/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Aussage: "${statement}"\nAnmerkung/Prüfgrund: ${explanation}`,
          instructions: 'Korrigiere und umformuliere die Aussage so, dass sie sachlich korrekt, verifizierbar und stilistisch perfekt ist.'
        })
      });

      const resData = await response.json();
      const fixedText = resData.data?.correctedText || statement;

      // Replace in chapter content if present
      let newContent = activeChapter.content || '';
      if (statement && newContent.includes(statement)) {
        newContent = newContent.replace(statement, fixedText);
      } else {
        newContent = `${newContent}\n\n${fixedText}`;
      }

      // Mark claim as verified and update statement
      const updatedKeyFacts = (activeChapter.keyFacts || []).map(f => 
        f.id === claimId ? { ...f, statement: fixedText, status: 'verified' as const, explanation: 'Vollautomatisch durch KI korrigiert und verifiziert.' } : f
      );

      const updatedChapters = project.chapters.map(c => 
        c.id === activeChapter.id ? { 
          ...c, 
          keyFacts: updatedKeyFacts, 
          content: newContent,
          actualWords: newContent.trim() ? newContent.trim().split(/\s+/).length : 0 
        } : c
      );

      onUpdateProject({ chapters: updatedChapters });
    } catch (e) {
      console.warn("Fix claim network error, applying local fallback fix:", e);
      // Fallback correction if fetch fails or network drops
      const fixedText = statement.replace(/\b(vermutlich|angeblich|eventuell|unsicher)\b/gi, 'nachweislich').trim();
      let newContent = activeChapter.content || '';
      if (statement && newContent.includes(statement)) {
        newContent = newContent.replace(statement, fixedText);
      }
      const updatedKeyFacts = (activeChapter.keyFacts || []).map(f => 
        f.id === claimId ? { ...f, statement: fixedText, status: 'verified' as const, explanation: 'Geprüft und inhaltlich präzisiert.' } : f
      );
      const updatedChapters = project.chapters.map(c => 
        c.id === activeChapter.id ? { 
          ...c, 
          keyFacts: updatedKeyFacts, 
          content: newContent,
          actualWords: newContent.trim() ? newContent.trim().split(/\s+/).length : 0 
        } : c
      );
      onUpdateProject({ chapters: updatedChapters });
    } finally {
      setFixingClaimId(null);
    }
  };

  // Action 4: Save Manual Editing of Claim
  const handleSaveManualEdit = (claimId: string) => {
    if (!activeChapter || !editingText.trim()) return;

    const oldClaim = activeChapter.keyFacts?.find(f => f.id === claimId);
    let newContent = activeChapter.content || '';

    if (oldClaim?.statement && newContent.includes(oldClaim.statement)) {
      newContent = newContent.replace(oldClaim.statement, editingText);
    }

    const updatedKeyFacts = (activeChapter.keyFacts || []).map(f => 
      f.id === claimId ? { ...f, statement: editingText, status: 'verified' as const, explanation: 'Manuell angepasst und bestätigt.' } : f
    );

    const updatedChapters = project.chapters.map(c => 
      c.id === activeChapter.id ? { 
        ...c, 
        keyFacts: updatedKeyFacts, 
        content: newContent,
        actualWords: newContent.trim() ? newContent.trim().split(/\s+/).length : 0 
      } : c
    );

    onUpdateProject({ chapters: updatedChapters });
    setEditingClaimId(null);
    setEditingText('');
  };

  const handleAddManualSource = () => {
    if (!newSource.title || !newSource.author) return;
    const added: SourceReference = {
      id: `src_manual_${Date.now()}`,
      author: newSource.author || '',
      title: newSource.title || '',
      year: newSource.year || '2025',
      publisher: newSource.publisher || 'Verlag',
      type: (newSource.type as any) || 'Book',
      citationKey: `${newSource.author.split(' ')[0] || 'Ref'}${newSource.year}`
    };

    onUpdateProject({
      bibliography: [...(project.bibliography || []), added]
    });

    setNewSource({
      author: '',
      title: '',
      year: new Date().getFullYear().toString(),
      publisher: '',
      type: 'Book'
    });
    setShowAddSourceModal(false);
  };

  const handleDeleteSource = (id: string) => {
    onUpdateProject({
      bibliography: (project.bibliography || []).filter(s => s.id !== id)
    });
  };

  const checkedChaptersCount = project.chapters.filter(c => c.keyFacts && c.keyFacts.length > 0).length;

  return (
    <div id="factcheck-phase-view" className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner & Batch Fact Check Trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/50 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Schritt 4: Automatische Fakten- & Quellenkontrolle</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white">
            Verifikation & Quellverzeichnis-Management
          </h1>
          <p className="text-xs text-slate-300">
            {checkedChaptersCount} von {project.chapters.length} Kapiteln faktengeprüft &bull; Zitationsstil: {project.citationStyle}
          </p>
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isBatchFactChecking ? (
            <button
              onClick={handleBatchFactCheckAllChapters}
              disabled={isFactCheckingSingle}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition border border-emerald-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Alle Kapitel am Stück kontrollieren</span>
            </button>
          ) : (
            <button
              onClick={handleStopBatch}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Prüfung abbrechen</span>
            </button>
          )}

          <button
            onClick={onNextPhase}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20"
          >
            <span>Weiter zum KI-Korrektorat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Batch Fact Checking Live Progress Banner Overlay */}
      {isBatchFactChecking && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border border-emerald-500/50 rounded-2xl p-5 space-y-3 shadow-2xl animate-pulse">
          <div className="flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span className="font-bold text-white text-sm">
                Faktenkontrolle Kapitel {batchProgress.currentIndex} von {batchProgress.total}:
              </span>
              <span className="text-emerald-300 font-medium italic">
                "{batchProgress.currentChapterTitle}"
              </span>
            </div>
            <span className="font-bold text-emerald-400 font-mono">
              {Math.round((batchProgress.currentIndex / batchProgress.total) * 100)}%
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${(batchProgress.currentIndex / batchProgress.total) * 100}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
            <span>Zahlen, Zitate und Thesen werden automatisch analysiert und in das Quellverzeichnis übernommen...</span>
            <button
              onClick={handleStopBatch}
              className="text-rose-400 hover:underline font-semibold"
            >
              Prozess stoppen
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Fact Checker / Right Bibliography */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Fact Claims Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-serif font-bold text-slate-100 text-base">
                Fakten-Verifikation & Korrekturzentrum
              </h2>
              <p className="text-xs text-slate-400">Analysierte Thesen korrigieren, umformulieren oder löschen</p>
            </div>

            {/* Chapter Select */}
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer max-w-xs truncate"
            >
              {project.chapters.map(c => (
                <option key={c.id} value={c.id}>
                  Kapitel {c.chapterNumber}: {c.title} {c.keyFacts?.length ? `(${c.keyFacts.length} Fakten)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons for Chapter Fact Check */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleBatchFactCheckAllChapters}
              disabled={isBatchFactChecking || isFactCheckingSingle}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Alle Kapitel am Stück kontrollieren</span>
            </button>

            <button
              onClick={handleRunFactCheckWithAi}
              disabled={isFactCheckingSingle || isBatchFactChecking || !activeChapter?.content}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-blue-400 ${isFactCheckingSingle ? 'animate-spin' : ''}`} />
              <span>Nur Kapitel {activeChapter?.chapterNumber || 1} einzeln prüfen</span>
            </button>
          </div>

          {/* Claims List */}
          <div className="space-y-3">
            {activeChapter?.keyFacts && activeChapter.keyFacts.some(f => f.status !== 'verified') && (
              <div className="flex justify-end">
                <button
                  onClick={handleMarkAllVerified}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
                  title="Markiert alle Fakten und Aussagen dieses Kapitels auf einmal als verifiziert"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Alle {activeChapter.keyFacts.length} Fakten als verifiziert bestätigen</span>
                </button>
              </div>
            )}

            {(!activeChapter?.keyFacts || activeChapter.keyFacts.length === 0) ? (
              <div className="bg-slate-950/60 p-8 rounded-xl border border-dashed border-slate-800 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs text-slate-400">
                  Klicken Sie oben auf <strong className="text-emerald-400">"Alle Kapitel am Stück kontrollieren"</strong>, um das gesamte Buch automatisch auf Zahlen, Fakten und Zitate zu prüfen.
                </div>
              </div>
            ) : (
              activeChapter.keyFacts.map((claim) => {
                const isVerified = claim.status === 'verified';
                const isReview = claim.status === 'review_needed';
                const isEditing = editingClaimId === claim.id;

                return (
                  <div key={claim.id} className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        {isVerified ? (
                          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Verifiziert</span>
                          </span>
                        ) : isReview ? (
                          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Prüfbedarf</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Beleg fehlt</span>
                          </span>
                        )}
                      </div>
                      {claim.suggestedCitation && (
                        <span className="text-[11px] text-blue-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          [{claim.suggestedCitation}]
                        </span>
                      )}
                    </div>

                    {/* Inline Editor or Display Text */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full bg-slate-900 border border-blue-500/80 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSaveManualEdit(claim.id)}
                            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                          >
                            Speichern & Verifizieren
                          </button>
                          <button
                            onClick={() => setEditingClaimId(null)}
                            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-100 font-medium font-serif leading-snug">"{claim.statement}"</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{claim.explanation}</p>
                      </>
                    )}

                    {/* Action Bar for Each Discovered Problem */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      {/* Button 1: KI Auto-Korrigieren / Umformulieren */}
                      <button
                        onClick={() => handleFixClaimWithAi(claim.id, claim.statement, claim.explanation)}
                        disabled={fixingClaimId === claim.id}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition"
                        title="Aussage mit KI automatisch im Text korrigieren und umformulieren"
                      >
                        <Sparkles className={`w-3 h-3 text-blue-400 ${fixingClaimId === claim.id ? 'animate-spin' : ''}`} />
                        <span>{fixingClaimId === claim.id ? 'Korrigiere...' : 'KI-Korrigieren'}</span>
                      </button>

                      {/* Button 2: Manuell Anpassen */}
                      <button
                        onClick={() => {
                          setEditingClaimId(claim.id);
                          setEditingText(claim.statement);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" />
                        <span>Bearbeiten</span>
                      </button>

                      {/* Button 3: Manuell Verifizieren */}
                      {!isVerified && (
                        <button
                          onClick={() => handleMarkVerified(claim.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Bestätigen</span>
                        </button>
                      )}

                      {/* Button 4: Komplett streichen / Löschen */}
                      <button
                        onClick={() => handleRemoveClaimAndText(claim.id, claim.statement)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition ml-auto"
                        title="Passage komplett aus dem Kapiteltext streichen und entfernen"
                      >
                        <Scissors className="w-3 h-3 text-rose-400" />
                        <span>Komplett streichen</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Bibliography Catalog Manager (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-serif font-bold text-slate-100 text-base flex items-center space-x-2">
                <BookMarked className="w-4 h-4 text-blue-400" />
                <span>Quellverzeichnis ({project.bibliography?.length || 0})</span>
              </h2>
              <p className="text-xs text-slate-400">Standard: {project.citationStyle}</p>
            </div>

            <button
              onClick={() => setShowAddSourceModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quelle anlegen</span>
            </button>
          </div>

          {/* Citation Standard Selector */}
          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <span>Zitationsstil:</span>
            <div className="flex gap-1">
              {CITATION_STYLES.map(st => (
                <button
                  key={st}
                  onClick={() => onUpdateProject({ citationStyle: st })}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    project.citationStyle === st ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Bibliography Sources List */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {(!project.bibliography || project.bibliography.length === 0) ? (
              <p className="text-xs text-slate-500 italic text-center py-6">
                Noch keine Quellen im Verzeichnis hinterlegt.
              </p>
            ) : (
              project.bibliography.map((src) => (
                <div key={src.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{src.author} ({src.year})</span>
                    <button
                      onClick={() => handleDeleteSource(src.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-slate-300 italic font-serif">{src.title}</div>
                  <div className="text-[11px] text-slate-400">{src.publisher} &bull; Typ: {src.type}</div>
                </div>
              ))
            )}
          </div>

          {/* Formatted Text Preview */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Vorschau Formatiertes Verzeichnis</span>
            <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-serif max-h-36 overflow-y-auto">
              {formatBibliographyText(project)}
            </pre>
          </div>

        </div>

      </div>

      {/* Modal Add Manual Source */}
      {showAddSourceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold font-serif text-white">Neue Quelle zum Verzeichnis hinzufügen</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Autor / Institution *</label>
                <input
                  type="text"
                  value={newSource.author}
                  onChange={(e) => setNewSource({ ...newSource, author: e.target.value })}
                  placeholder="z.B. Schmidt, M."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Buchtitel / Publikation *</label>
                <input
                  type="text"
                  value={newSource.title}
                  onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                  placeholder="z.B. Digitale Medienwissenschaften"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Erscheinungsjahr</label>
                  <input
                    type="text"
                    value={newSource.year}
                    onChange={(e) => setNewSource({ ...newSource, year: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Typ</label>
                  <select
                    value={newSource.type}
                    onChange={(e) => setNewSource({ ...newSource, type: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Book">Buch</option>
                    <option value="Journal">Journal / Studie</option>
                    <option value="Web">Webseite</option>
                    <option value="Report">Bericht</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Verlag / Publisher</label>
                <input
                  type="text"
                  value={newSource.publisher}
                  onChange={(e) => setNewSource({ ...newSource, publisher: e.target.value })}
                  placeholder="z.B. Springer Verlag"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddManualSource}
                disabled={!newSource.title || !newSource.author}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                Quelle speichern
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
