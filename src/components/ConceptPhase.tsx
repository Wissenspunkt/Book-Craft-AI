import React, { useState, useRef } from 'react';
import { 
  BOOK_TEMPLATES 
} from '../data/templates';
import { 
  BookProject, 
  CitationStyle 
} from '../types';
import { 
  Sparkles, 
  BookOpen, 
  Check, 
  FileText, 
  Feather, 
  UserCheck, 
  TrendingUp, 
  HelpCircle,
  Wand2,
  Upload,
  Image as ImageIcon,
  Trash2,
  FolderOpen,
  Lightbulb,
  ArrowRight,
  Search,
  Compass,
  Layers
} from 'lucide-react';

interface ConceptPhaseProps {
  project: BookProject;
  onUpdateProject: (updated: Partial<BookProject>) => void;
  onNextPhase: () => void;
}

interface TopicIdea {
  title: string;
  subtitle: string;
  summary: string;
  targetAudience: string;
  genre: string;
  angle: string;
}

const CITATION_STYLES: CitationStyle[] = ['APA', 'MLA', 'Harvard', 'Chicago', 'IEEE'];

export const ConceptPhase: React.FC<ConceptPhaseProps> = ({
  project,
  onUpdateProject,
  onNextPhase
}) => {
  const [isRefiningWithAi, setIsRefiningWithAi] = useState(false);
  const [topicKeywords, setTopicKeywords] = useState('');
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<TopicIdea[]>([]);
  const [showTopicFinder, setShowTopicFinder] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  const handleCreateOutlineAndProceed = async () => {
    if (!project.title) return;
    setIsGeneratingOutline(true);

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
        const newChapters = resData.data.chapters.map((c: any, idx: number) => ({
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
      setIsGeneratingOutline(false);
      onNextPhase();
    }
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateProject({ coverImage: dataUrl });
      }
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleSelectTemplate = (tmplId: string) => {
    const tmpl = BOOK_TEMPLATES.find(t => t.id === tmplId);
    if (!tmpl) return;

    onUpdateProject({
      templateId: tmpl.id,
      genre: tmpl.genre,
      style: tmpl.defaultStyle,
      tone: tmpl.defaultTone,
      targetLength: tmpl.recommendedWordCount
    });
  };

  const handleGenerateTopicIdeas = async () => {
    setIsGeneratingTopics(true);
    try {
      const response = await fetch('/api/gemini/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: project.genre,
          targetAudience: project.targetAudience,
          keywords: topicKeywords,
          style: project.style
        })
      });

      const resData = await response.json();
      if (resData.success && resData.ideas) {
        setSuggestedTopics(resData.ideas);
      }
    } catch (e) {
      console.error('Error fetching topic ideas:', e);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleApplyTopicIdea = (idea: TopicIdea) => {
    onUpdateProject({
      title: idea.title,
      subtitle: idea.subtitle,
      summary: idea.summary,
      targetAudience: idea.targetAudience || project.targetAudience,
      genre: idea.genre || project.genre
    });
  };

  const handleRefineConcept = async () => {
    if (!project.title) return;
    setIsRefiningWithAi(true);

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
      if (resData.success && resData.data?.summary) {
        onUpdateProject({
          summary: resData.data.summary
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefiningWithAi(false);
    }
  };

  return (
    <div id="concept-phase-view" className="max-w-5xl mx-auto space-y-8 py-6 px-4">
      
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-2">
        <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Schritt 1: Projekt-Konzeption & Vorlagenauswahl</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
          Definieren Sie Ihr Buchprojekt
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Wählen Sie eine spezialisierte Vorlage, legen Sie die Gesamtlänge, den Schreibstil und die Tonalität fest. Nutzen Sie den KI-Themenfinder für Inspirationen.
        </p>
      </div>

      {/* 1. Vorlagen-Auswahl (Templates) */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-slate-100 flex items-center space-x-2">
          <span>1. Buch-Vorlage wählen</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BOOK_TEMPLATES.map((tmpl) => {
            const isSelected = project.templateId === tmpl.id;

            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                    : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-blue-400">
                      {tmpl.genre}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-100">{tmpl.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{tmpl.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div><strong>Empfohlen:</strong> {tmpl.recommendedWordCount}</div>
                  <div><strong>Stil:</strong> {tmpl.defaultStyle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Topic & Theme Suggestion Tool */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/60 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white flex items-center space-x-2">
                <span>KI-Themenfinder & Inspirations-Generator</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded-full border border-indigo-500/30">Neu</span>
              </h3>
              <p className="text-xs text-slate-300">
                Lassen Sie sich von der KI erstklassige Buchtitel, Untertitel & Kernthemen vorschlagen.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowTopicFinder(!showTopicFinder)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showTopicFinder ? 'Themenfinder ausblenden' : 'Themen-Ideen generieren'}</span>
          </button>
        </div>

        {showTopicFinder && (
          <div className="pt-4 border-t border-indigo-900/40 space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Gewünschte Stichwörter / Themengebiet (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={topicKeywords}
                    onChange={(e) => setTopicKeywords(e.target.value)}
                    placeholder="z.B. KI im Alltag, Finanzielle Freiheit, Achtsamkeit, Führungskräfte..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateTopicIdeas}
                  disabled={isGeneratingTopics}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Wand2 className={`w-4 h-4 ${isGeneratingTopics ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingTopics ? 'Analysiere Trends...' : '5 Bestseller-Ideen erzeugen'}</span>
                </button>
              </div>
            </div>

            {/* Generated Topics Grid */}
            {suggestedTopics.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Vorgeschlagene Buchkonzepte ({suggestedTopics.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Klicken Sie auf "Thema übernehmen", um alle Projektdaten automatisch zu füllen.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedTopics.map((idea, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-indigo-900/50 hover:border-indigo-500 p-4 rounded-xl space-y-3 transition group flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-800">
                            {idea.genre || project.genre}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Zielgruppe: {idea.targetAudience}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-white text-base group-hover:text-indigo-300 transition">
                          {idea.title}
                        </h4>
                        <p className="text-xs font-medium text-slate-300 italic">
                          "{idea.subtitle}"
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {idea.summary}
                        </p>

                        {idea.angle && (
                          <div className="text-[11px] text-indigo-300 font-medium bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/40">
                            <strong>Fokus:</strong> {idea.angle}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleApplyTopicIdea(idea)}
                        className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-bold text-xs rounded-lg border border-indigo-500/40 hover:border-indigo-500 transition flex items-center justify-center space-x-1.5 mt-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dieses Thema für das Buch übernehmen</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Projekt-Details & Parameter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <h2 className="text-lg font-serif font-bold text-slate-100 border-b border-slate-800 pb-3">
          2. Projektdaten & Schreibparameter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Buchtitel *</label>
            <input
              type="text"
              value={project.title}
              onChange={(e) => onUpdateProject({ title: e.target.value })}
              placeholder="z.B. Die Zukunft der Künstlichen Intelligenz"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Untertitel</label>
            <input
              type="text"
              value={project.subtitle}
              onChange={(e) => onUpdateProject({ subtitle: e.target.value })}
              placeholder="z.B. Ein Praxisleitfaden für verifizierte Innovation"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Author */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Autor / Name</label>
            <input
              type="text"
              value={project.author}
              onChange={(e) => onUpdateProject({ author: e.target.value })}
              placeholder="z.B. Dr. Alexander Weber"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Target Length */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Ziel-Gesamtlänge</label>
            <select
              value={project.targetLength}
              onChange={(e) => {
                const val = e.target.value;
                let words = 20000;
                if (val.includes('5.000')) words = 5000;
                if (val.includes('50.000')) words = 50000;
                onUpdateProject({ targetLength: val, targetWordCount: words });
              }}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              <option value="Kompakt read (~5.000 Wörter)">Kompakt read (~5.000 Wörter / Essay)</option>
              <option value="Standard Werk (~20.000 Wörter)">Standard Werk (~20.000 Wörter / Fachbuch)</option>
              <option value="Umfassendes Buch (~50.000+ Wörter)">Umfassendes Buch (~50.000+ Wörter / Bestseller)</option>
            </select>
          </div>

          {/* Target Chapter Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Ziel-Kapitelanzahl (Optional)</span>
              <span className="text-[11px] text-blue-400 font-normal">Gliederungsvorgabe</span>
            </label>
            <select
              value={project.targetChapterCount || 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                onUpdateProject({ targetChapterCount: val > 0 ? val : undefined });
              }}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              <option value={0}>&bull; Automatisch (KI schlägt 5–8 Kapitel vor)</option>
              <option value={3}>&bull; 3 Kapitel (Kompakt-Leitfaden)</option>
              <option value={5}>&bull; 5 Kapitel (Standard Kurzbuch)</option>
              <option value={7}>&bull; 7 Kapitel (Fachbuch)</option>
              <option value={8}>&bull; 8 Kapitel (Standard Sachbuch)</option>
              <option value={10}>&bull; 10 Kapitel (Umfassendes Werk)</option>
              <option value={12}>&bull; 12 Kapitel (Ausführliches Lehrbuch)</option>
              <option value={15}>&bull; 15 Kapitel (Großes Bestseller-Werk)</option>
            </select>
          </div>

          {/* Writing Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Schreibstil (Style)</label>
            <input
              type="text"
              value={project.style}
              onChange={(e) => onUpdateProject({ style: e.target.value })}
              placeholder="z.B. Informativ, Präzise & Akademisch"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tonalität (Tone of Voice)</label>
            <input
              type="text"
              value={project.tone}
              onChange={(e) => onUpdateProject({ tone: e.target.value })}
              placeholder="z.B. Analytisch, Unterhaltsam, Inspirierend"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Zielgruppe</label>
            <input
              type="text"
              value={project.targetAudience}
              onChange={(e) => onUpdateProject({ targetAudience: e.target.value })}
              placeholder="z.B. Einsteiger, Fachpublikum, Führungskräfte"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Citation Style */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Zitationsstandard für Quellverzeichnis</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {CITATION_STYLES.map((cStyle) => (
                <button
                  key={cStyle}
                  type="button"
                  onClick={() => onUpdateProject({ citationStyle: cStyle })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    project.citationStyle === cStyle
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {cStyle}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Summary & Core Concept */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Kernaussage / Kurze Buchzusammenfassung
            </label>
            <button
              onClick={handleRefineConcept}
              disabled={isRefiningWithAi || !project.title}
              className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 font-medium"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isRefiningWithAi ? 'animate-spin' : ''}`} />
              <span>Mit KI schärfen</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={project.summary}
            onChange={(e) => onUpdateProject({ summary: e.target.value })}
            placeholder="Beschreiben Sie in wenigen Sätzen die Hauptidee oder die Kernbotschaft Ihres Buches..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition resize-none"
          />
        </div>

        {/* Custom Cover Upload Option */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverFileUpload}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />

          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Eigenes Buch-Cover hochladen (Optional)</span>
            </label>
            <span className="text-[11px] text-slate-500">Kann auch später in Schritt 6 generiert werden</span>
          </div>

          {project.coverImage ? (
            <div className="flex items-center space-x-4 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <img
                src={project.coverImage}
                alt="Cover Vorschau"
                className="w-16 h-20 object-cover rounded-lg border border-slate-700 shadow-md"
              />
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-400 block">Eigenes Cover zugewiesen</span>
                <p className="text-[11px] text-slate-400">Wird für den Export und Deckblätter verwendet.</p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="text-xs text-blue-400 hover:underline font-semibold"
                  >
                    Ändern
                  </button>
                  <span className="text-slate-600">&bull;</span>
                  <button
                    onClick={() => onUpdateProject({ coverImage: undefined })}
                    className="text-xs text-rose-400 hover:underline font-semibold"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => coverInputRef.current?.click()}
              className="p-4 bg-slate-950/60 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl cursor-pointer transition text-center space-y-1 group"
            >
              <FolderOpen className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 mx-auto transition" />
              <div className="text-xs font-semibold text-slate-300 group-hover:text-white">
                Klicken Sie hier, um eine Bilddatei vom PC auszuwählen
              </div>
              <div className="text-[11px] text-slate-500">
                Unterstützte Formate: JPG, PNG, WebP (Empfohlenes Seitenverhältnis 3:4)
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-slate-400">
          {!project.title ? (
            <span className="text-amber-400 font-medium">* Bitte vergeben Sie einen Buchtitel, um fortzufahren.</span>
          ) : (
            <span>Bereit für Schritt 2: Die KI verfasst automatisch Kapitel, Überschriften, Beschreibungen &amp; individuelle Ziellängen.</span>
          )}
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onNextPhase}
            disabled={!project.title || isGeneratingOutline}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs transition border border-slate-700"
          >
            Direkt zur Gliederungsansicht &rarr;
          </button>

          <button
            onClick={handleCreateOutlineAndProceed}
            disabled={!project.title || isGeneratingOutline}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/25"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingOutline ? 'animate-spin' : ''}`} />
            <span>{isGeneratingOutline ? 'Verfasse Kapitel, Überschriften & Beschreibungen...' : 'Kapitel, Überschriften & Beschreibungen mit KI planen (Schritt 2)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
