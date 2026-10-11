import React, { useState } from 'react';
import { 
  BookProject, 
  CitationStyle 
} from '../types';
import { 
  Share2, 
  Download, 
  FileText, 
  BookOpen, 
  Tablet, 
  CloudCheck, 
  Copy, 
  Check, 
  Sparkles, 
  Globe, 
  Printer,
  BookMarked,
  ListTree,
  ExternalLink,
  MessageSquare,
  Bookmark,
  AlignLeft,
  CheckCircle2,
  RefreshCw,
  Wand2,
  Eye,
  Edit3,
  Bot
} from 'lucide-react';
import { AiTextRefinerModal } from './AiTextRefinerModal';
import { 
  exportToPdf, 
  exportToEpub, 
  exportToTxt, 
  exportToKindle,
  formatBibliographyText 
} from '../utils/exportUtils';

interface ExportSyncPhaseProps {
  project: BookProject;
  onUpdateProject: (updated: Partial<BookProject>) => void;
  onManualSync: () => void;
  isSyncing: boolean;
}

export const ExportSyncPhase: React.FC<ExportSyncPhaseProps> = ({
  project,
  onUpdateProject,
  onManualSync,
  isSyncing
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [activeTab, setActiveTab] = useState<'blurb' | 'foreword' | 'toc' | 'conclusion' | 'bibliography'>('toc');
  const [isEditMode, setIsEditMode] = useState(false);
  const [copiedManuscript, setCopiedManuscript] = useState(false);
  const [refinerTarget, setRefinerTarget] = useState<{
    text: string;
    chapterId?: string;
    type: 'chapter' | 'foreword' | 'conclusion';
    title: string;
  } | null>(null);

  const totalWords = project.chapters.reduce((sum, c) => sum + (c.actualWords || 0), 0);
  const syncUrl = `${window.location.origin}?project=${project.id}`;

  const compileFullManuscriptText = () => {
    let fullText = `${project.title || 'Unbenanntes Buch'}\n`;
    if (project.subtitle) fullText += `${project.subtitle}\n`;
    fullText += `========================================\n\n`;

    if (project.blurb) {
      fullText += `KLAPPENTEXT:\n${project.blurb}\n\n----------------------------------------\n\n`;
    }
    if (project.foreword) {
      fullText += `VORWORT:\n${project.foreword}\n\n----------------------------------------\n\n`;
    }

    project.chapters.forEach((chap) => {
      fullText += `KAPITEL ${chap.chapterNumber}: ${chap.title}\n\n`;
      fullText += `${chap.content || '(Noch kein Inhalt verfasst)'}\n\n`;
      fullText += `----------------------------------------\n\n`;
    });

    if (project.conclusion) {
      fullText += `FAZIT & SCHLUSSWORT:\n${project.conclusion}\n\n----------------------------------------\n\n`;
    }

    const bib = formatBibliographyText(project);
    if (bib) {
      fullText += `QUELLENVERZEICHNIS:\n${bib}\n`;
    }

    return fullText;
  };

  const handleCopyManuscript = () => {
    const full = compileFullManuscriptText();
    navigator.clipboard.writeText(full);
    setCopiedManuscript(true);
    setTimeout(() => setCopiedManuscript(false), 2500);
  };

  const handleCopySyncUrl = () => {
    navigator.clipboard.writeText(syncUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleGenerateMetaElements = async () => {
    if (isGeneratingMeta) return;
    setIsGeneratingMeta(true);

    try {
      const response = await fetch('/api/gemini/meta-elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          subtitle: project.subtitle,
          genre: project.genre,
          style: project.style,
          tone: project.tone,
          summary: project.summary,
          chapters: project.chapters
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        onUpdateProject({
          blurb: resData.data.blurb || project.blurb,
          foreword: resData.data.foreword || project.foreword,
          conclusion: resData.data.conclusion || project.conclusion
        });
      }
    } catch (e) {
      console.error("Meta elements generation error:", e);
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  const scrollToBibliography = () => {
    setActiveTab('bibliography');
    const el = document.getElementById('quellverzeichnis-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="export-sync-phase-view" className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Share2 className="w-4 h-4" />
            <span>Schritt 7: Meta-Elemente, Inhaltsverzeichnis & Export</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Buchstruktur & Veröffentlichung
          </h1>
          <p className="text-xs text-slate-300">
            Erstellen & bearbeiten Sie Klappentext, Vorwort, Inhaltsverzeichnis, Fazit und Quellenverzeichnis. Exportieren Sie Ihr Werk in allen Formaten.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleGenerateMetaElements}
            disabled={isGeneratingMeta}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/25 border border-purple-400/30"
          >
            <Wand2 className={`w-4 h-4 text-amber-300 ${isGeneratingMeta ? 'animate-spin' : ''}`} />
            <span>{isGeneratingMeta ? 'Generiere...' : 'Klappentext, Vorwort & Fazit KI-Generieren'}</span>
          </button>

          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20"
          >
            <CloudCheck className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sichere...' : 'Cloud Sichern'}</span>
          </button>
        </div>
      </div>

      {/* Book Meta Elements & TOC Interactive Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center space-x-2 text-white">
            <BookMarked className="w-5 h-5 text-indigo-400" />
            <h2 className="font-serif font-bold text-lg">Zentrale Buch-Metaelemente & Struktur</h2>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Gesamtwörter:</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-blue-400 font-bold border border-slate-700">
              {totalWords.toLocaleString()} Wörter
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 overflow-x-auto border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab('toc')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border shrink-0 ${
              activeTab === 'toc'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Inhaltsverzeichnis</span>
          </button>

          <button
            onClick={() => setActiveTab('blurb')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border shrink-0 ${
              activeTab === 'blurb'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Klappentext</span>
            {project.blurb && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>

          <button
            onClick={() => setActiveTab('foreword')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border shrink-0 ${
              activeTab === 'foreword'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>Vorwort</span>
            {project.foreword && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>

          <button
            onClick={() => setActiveTab('conclusion')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border shrink-0 ${
              activeTab === 'conclusion'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fazit & Schlusswort</span>
            {project.conclusion && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>

          <button
            onClick={scrollToBibliography}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border shrink-0 ${
              activeTab === 'bibliography'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-blue-400" />
            <span>Link zum Quellenverzeichnis</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">

          {/* TAB: INHALTSVERZEICHNIS */}
          {activeTab === 'toc' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-serif font-bold text-white text-base flex items-center space-x-2">
                  <ListTree className="w-4 h-4 text-blue-400" />
                  <span>Automatisch generiertes Inhaltsverzeichnis</span>
                </h3>
                <span className="text-xs text-slate-400">Interaktive Voransicht</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Vorwort Entry */}
                {project.foreword && (
                  <div 
                    onClick={() => setActiveTab('foreword')}
                    className="p-3 bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-lg flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="font-bold text-purple-300">&bull; Vorwort</span>
                    <span className="text-[10px] text-slate-500 underline">Geleitwort lesen &rarr;</span>
                  </div>
                )}

                {/* Chapters List */}
                {project.chapters.map((chap) => (
                  <div key={chap.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between hover:border-slate-700 transition">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">
                        Kapitel {chap.chapterNumber}: {chap.title}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {chap.summary}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="font-mono text-slate-400">{chap.actualWords || 0} Wörter</span>
                    </div>
                  </div>
                ))}

                {/* Fazit Entry */}
                {project.conclusion && (
                  <div 
                    onClick={() => setActiveTab('conclusion')}
                    className="p-3 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-lg flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="font-bold text-emerald-300">&bull; Fazit & Schlusswort</span>
                    <span className="text-[10px] text-slate-500 underline">Fazit lesen &rarr;</span>
                  </div>
                )}

                {/* DIRECT LINK TO BIBLIOGRAPHY */}
                <div 
                  onClick={scrollToBibliography}
                  className="p-3.5 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/40 hover:border-blue-400 rounded-xl flex items-center justify-between cursor-pointer transition shadow-md group"
                >
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                    <span className="font-bold text-blue-300 text-xs">
                      Quellverzeichnis ({project.citationStyle} Standard)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-blue-400 group-hover:underline flex items-center space-x-1">
                    <span>Direkt zum Quellenverzeichnis springen</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: KLAPPENTEXT */}
          {activeTab === 'blurb' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <span>Klappentext (Buchrücken / Marketingtext)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {project.blurb ? `${project.blurb.trim().split(/\s+/).length} Wörter` : 'Noch nicht generiert'}
                </span>
              </div>

              <textarea
                value={project.blurb || ''}
                onChange={(e) => onUpdateProject({ blurb: e.target.value })}
                placeholder="Geben Sie den Klappentext für Ihr Buch ein oder klicken Sie oben auf 'Klappentext KI-Generieren'..."
                className="w-full h-36 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 resize-y leading-relaxed"
              />
            </div>
          )}

          {/* TAB: VORWORT */}
          {activeTab === 'foreword' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <AlignLeft className="w-4 h-4 text-purple-400" />
                  <span>Vorwort / Geleitwort</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {project.foreword ? `${project.foreword.trim().split(/\s+/).length} Wörter` : 'Noch nicht generiert'}
                </span>
              </div>

              <textarea
                value={project.foreword || ''}
                onChange={(e) => onUpdateProject({ foreword: e.target.value })}
                placeholder="Verfassen Sie das Vorwort für den Leser oder generieren Sie ein stimmungsvolles Geleitwort per KI..."
                className="w-full h-48 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50 resize-y leading-relaxed"
              />
            </div>
          )}

          {/* TAB: FAZIT */}
          {activeTab === 'conclusion' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Fazit & Schlusswort</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {project.conclusion ? `${project.conclusion.trim().split(/\s+/).length} Wörter` : 'Noch nicht generiert'}
                </span>
              </div>

              <textarea
                value={project.conclusion || ''}
                onChange={(e) => onUpdateProject({ conclusion: e.target.value })}
                placeholder="Fassen Sie die wichtigsten Kernbotschaften am Ende des Buches zusammen..."
                className="w-full h-48 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-y leading-relaxed"
              />
            </div>
          )}

          {/* TAB & ANCHOR: QUELLENVERZEICHNIS */}
          <div id="quellverzeichnis-section" className={`${activeTab === 'bibliography' ? 'block' : 'hidden'} space-y-3 pt-2`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-serif font-bold text-white text-base flex items-center space-x-2">
                <BookMarked className="w-4 h-4 text-blue-400" />
                <span>Quellenverzeichnis & Literaturreferenzen</span>
              </h3>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Zitationsstil:</span>
                <select
                  value={project.citationStyle}
                  onChange={(e) => onUpdateProject({ citationStyle: e.target.value as CitationStyle })}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="APA">APA Style</option>
                  <option value="MLA">MLA Style</option>
                  <option value="Harvard">Harvard Style</option>
                  <option value="Chicago">Chicago Style</option>
                  <option value="IEEE">IEEE Style</option>
                </select>
              </div>
            </div>

            <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {formatBibliographyText(project)}
            </pre>
          </div>

        </div>
      </div>

      {/* Export Formats Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-slate-100 flex items-center space-x-2">
          <Download className="w-5 h-5 text-blue-400" />
          <span>Echtzeit-Exportformate</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* PDF Export */}
          <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">PDF Format</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Druckfertiges Layout mit Deckblatt, Klappentext, Vorwort, Inhaltsverzeichnis, Fazit & Quellverzeichnis.
              </p>
            </div>

            <button
              onClick={() => exportToPdf(project)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>PDF Generieren</span>
            </button>
          </div>

          {/* EPUB Export */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">EPUB E-Reader</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standardisiertes E-Book Format für Apple Books, Tolino, Kobo und moderne E-Reader.
              </p>
            </div>

            <button
              onClick={() => exportToEpub(project)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>EPUB Exportieren</span>
            </button>
          </div>

          {/* Kindle Export */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Tablet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Kindle (.mobi/HTML)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Optimierte Kindle-HTML/KF8 Datei mit Kindle-Seitenumbrüchen und Inhaltsverzeichnis.
              </p>
            </div>

            <button
              onClick={() => exportToKindle(project)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-md shadow-amber-600/20 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Kindle Export</span>
            </button>
          </div>

          {/* TXT / Markdown Export */}
          <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">TXT / Markdown</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reiner Text im Markdown-Format für Weiterverarbeitung in Manuskript-Software.
              </p>
            </div>

            <button
              onClick={() => exportToTxt(project)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition border border-slate-700 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>TXT Herunterladen</span>
            </button>
          </div>

        </div>
      </div>

      {/* Cloud Sync & Cross-Device Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-white">Cloudbasierte Synchronisierung & Geräteneutraler Zugriff</h3>
            <p className="text-xs text-slate-400">
              Ihr Projekt ist sicher im Cloud-Speicher hinterlegt und kann von jedem PC, Tablet oder Smartphone aufgerufen werden.
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">Synchronisations-Link für andere Geräte:</span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={syncUrl}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono w-64 focus:outline-none"
              />
              <button
                onClick={handleCopySyncUrl}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center space-x-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Kopiert!' : 'Link kopieren'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Manuscript Window (Vorschau & Live Edit Mode) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-white">
                Komplettes Fertiges Manuskript
              </h2>
              <p className="text-xs text-slate-400">
                Gesamtschau aller Kapitel, Vorwort, Klappentext &amp; Quellenverzeichnis mit Live-Editor.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View / Edit Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setIsEditMode(false)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  !isEditMode
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lesemodus</span>
              </button>
              <button
                onClick={() => setIsEditMode(true)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  isEditMode
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Bearbeiten (Edit Mode)</span>
              </button>
            </div>

            <button
              onClick={handleCopyManuscript}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              title="Kopiert das gesamte Manuskript in die Zwischenablage"
            >
              {copiedManuscript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
              <span>{copiedManuscript ? 'Manuskript kopiert!' : 'Manuskript kopieren'}</span>
            </button>
          </div>
        </div>

        {/* Manuscript Scroll Area */}
        <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-6 max-h-[700px] overflow-y-auto space-y-8 font-serif text-slate-200 leading-relaxed shadow-inner">
          
          {/* Cover Header */}
          <div className="text-center py-6 border-b border-slate-800/80 space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-wide">{project.title || 'Unbenanntes Buch'}</h1>
            {project.subtitle && <p className="text-base text-slate-300 font-sans italic">{project.subtitle}</p>}
            <p className="text-xs text-slate-400 font-sans uppercase tracking-widest pt-2">
              Genre: {project.genre || 'Sachbuch'} &bull; Stil: {project.style || 'Fachliteratur'} &bull; Wortanzahl: {totalWords.toLocaleString('de-DE')} Wörter
            </p>
          </div>

          {!isEditMode ? (
            /* READ MODE */
            <div className="space-y-10 font-sans">
              
              {/* Klappentext */}
              {project.blurb && (
                <div className="space-y-2 pb-6 border-b border-slate-800/60 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40">
                  <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Klappentext</h2>
                  <p className="text-xs text-slate-300 leading-relaxed italic">{project.blurb}</p>
                </div>
              )}

              {/* Vorwort */}
              {project.foreword && (
                <div className="space-y-3 pb-6 border-b border-slate-800/60">
                  <h2 className="text-xl font-serif font-bold text-indigo-300">Vorwort</h2>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {project.foreword}
                  </div>
                </div>
              )}

              {/* Inhaltsübersicht */}
              <div className="space-y-3 pb-6 border-b border-slate-800/60">
                <h2 className="text-xl font-serif font-bold text-slate-100">Inhaltsverzeichnis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {project.chapters.map(c => (
                    <div key={c.id} className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="font-semibold text-slate-200">Kapitel {c.chapterNumber}: {c.title}</span>
                      <span className="text-slate-400 font-mono">{c.actualWords || 0} W</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapters List */}
              {project.chapters.map((chap) => (
                <div key={chap.id} className="space-y-4 pb-8 border-b border-slate-800/60">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Kapitel {chap.chapterNumber}</span>
                    <h2 className="text-2xl font-serif font-bold text-white">{chap.title}</h2>
                  </div>

                  {chap.content ? (
                    <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap space-y-3">
                      {chap.content}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-lg border border-slate-800/40">
                      Inhalt für dieses Kapitel wurde noch nicht generiert oder eingegeben.
                    </p>
                  )}
                </div>
              ))}

              {/* Fazit */}
              {project.conclusion && (
                <div className="space-y-3 pb-6 border-b border-slate-800/60">
                  <h2 className="text-xl font-serif font-bold text-emerald-300">Fazit &amp; Schlusswort</h2>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {project.conclusion}
                  </div>
                </div>
              )}

              {/* Quellenverzeichnis */}
              <div className="space-y-3">
                <h2 className="text-xl font-serif font-bold text-slate-100">Quellenverzeichnis ({project.citationStyle})</h2>
                <pre className="p-4 bg-slate-900 rounded-xl text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {formatBibliographyText(project)}
                </pre>
              </div>

            </div>
          ) : (
            /* EDIT MODE */
            <div className="space-y-8 font-sans">
              
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 flex items-center justify-between">
                <span>
                  <strong>Edit-Modus aktiv:</strong> Bearbeiten Sie Vorwort, Buchtitel, Kapiteltexte und Fazit direkt in den Eingabefeldern. Alle Änderungen fließen sofort in das Gesamtexport-Dokument ein!
                </span>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition shrink-0 ml-3"
                >
                  Fertig (Lesemodus)
                </button>
              </div>

              {/* Edit Foreword */}
              <div className="space-y-2 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">Vorwort / Geleitwort bearbeiten</label>
                  <button
                    onClick={() => setRefinerTarget({
                      text: project.foreword || '',
                      type: 'foreword',
                      title: 'Vorwort'
                    })}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition"
                  >
                    <Bot className="w-3 h-3" />
                    <span>KI mit Überarbeitung beauftragen</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={project.foreword || ''}
                  onChange={(e) => onUpdateProject({ foreword: e.target.value })}
                  placeholder="Vorwort verfassen..."
                  className="w-full bg-slate-950 text-xs text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Edit Chapters */}
              {project.chapters.map((chap) => (
                <div key={chap.id} className="space-y-3 p-5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {chap.chapterNumber}
                    </span>
                    <input
                      type="text"
                      value={chap.title}
                      onChange={(e) => {
                        const updated = project.chapters.map(c => c.id === chap.id ? { ...c, title: e.target.value } : c);
                        onUpdateProject({ chapters: updated });
                      }}
                      className="w-full bg-slate-950 font-bold text-sm text-white px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Kapiteltext (Volltext)</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setRefinerTarget({
                            text: chap.content || '',
                            chapterId: chap.id,
                            type: 'chapter',
                            title: `Kapitel ${chap.chapterNumber}`
                          })}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition"
                        >
                          <Bot className="w-3 h-3 text-purple-400" />
                          <span>KI mit Überarbeitung beauftragen</span>
                        </button>
                        <span>{(chap.content || '').trim().split(/\s+/).filter(Boolean).length} Wörter</span>
                      </div>
                    </div>
                    <textarea
                      rows={10}
                      value={chap.content || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const wordCount = val.trim() ? val.trim().split(/\s+/).length : 0;
                        const updated = project.chapters.map(c => c.id === chap.id ? { ...c, content: val, actualWords: wordCount } : c);
                        onUpdateProject({ chapters: updated });
                      }}
                      placeholder="Geben Sie hier den fertigen Kapiteltext ein oder überarbeiten Sie den bestehenden Text..."
                      className="w-full bg-slate-950 text-xs text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              ))}

              {/* Edit Conclusion */}
              <div className="space-y-2 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">Fazit &amp; Schlusswort bearbeiten</label>
                  <button
                    onClick={() => setRefinerTarget({
                      text: project.conclusion || '',
                      type: 'conclusion',
                      title: 'Fazit & Schlusswort'
                    })}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition"
                  >
                    <Bot className="w-3 h-3" />
                    <span>KI mit Überarbeitung beauftragen</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={project.conclusion || ''}
                  onChange={(e) => onUpdateProject({ conclusion: e.target.value })}
                  placeholder="Fazit verfassen..."
                  className="w-full bg-slate-950 text-xs text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

            </div>
          )}

        </div>
      </div>

      {refinerTarget && (
        <AiTextRefinerModal
          isOpen={!!refinerTarget}
          onClose={() => setRefinerTarget(null)}
          title={refinerTarget.title}
          originalText={refinerTarget.text}
          projectContext={project}
          onApplyRefinedText={(newText) => {
            if (refinerTarget.type === 'foreword') {
              onUpdateProject({ foreword: newText });
            } else if (refinerTarget.type === 'conclusion') {
              onUpdateProject({ conclusion: newText });
            } else if (refinerTarget.type === 'chapter' && refinerTarget.chapterId) {
              const wordCount = newText.trim() ? newText.trim().split(/\s+/).length : 0;
              const updated = project.chapters.map(c => 
                c.id === refinerTarget.chapterId 
                  ? { ...c, content: newText, actualWords: wordCount } 
                  : c
              );
              onUpdateProject({ chapters: updated });
            }
          }}
        />
      )}

    </div>
  );
};
