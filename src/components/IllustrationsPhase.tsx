import React, { useState, useRef } from 'react';
import { 
  BookProject, 
  Chapter 
} from '../types';
import { 
  Image as ImageIcon, 
  Sparkles, 
  ArrowRight, 
  Wand2, 
  Check, 
  Download, 
  Layers, 
  Palette, 
  BookOpen,
  RefreshCw,
  Upload,
  Trash2,
  FileImage,
  FolderOpen
} from 'lucide-react';

interface IllustrationsPhaseProps {
  project: BookProject;
  onUpdateProject: (updated: Partial<BookProject>) => void;
  onNextPhase: () => void;
}

const STYLE_PRESETS = [
  'Minimalist & Editorial Art',
  'Fotorealistisch & Hochdetailliert',
  'Ölgemälde & Klassisch',
  'Digital Concept Painting',
  'Aquarell & Sanfte Töne',
  'Futuristisch & Cyberpunk',
  'Schwarz-Weiß Linienzeichnung'
];

export const IllustrationsPhase: React.FC<IllustrationsPhaseProps> = ({
  project,
  onUpdateProject,
  onNextPhase
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'cover' | string>('cover');
  const [promptText, setPromptText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChapter = project.chapters.find(c => c.id === selectedTarget);

  const handleGenerateImageWithAi = async () => {
    const promptToUse = promptText || (
      selectedTarget === 'cover' 
        ? `Buchtitel: "${project.title}". Thema: ${project.summary || project.genre}` 
        : `Kapitel-Illustration für "${activeChapter?.title}": ${activeChapter?.summary}`
    );

    setIsGenerating(true);

    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${promptToUse}, Stil: ${selectedStyle}`,
          type: selectedTarget === 'cover' ? 'cover' : 'illustration',
          aspectRatio: selectedTarget === 'cover' ? '3:4' : '16:9'
        })
      });

      const resData = await response.json();
      if (resData.success && resData.imageUrl) {
        setGeneratedPreview(resData.imageUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyImageToBook = (imageUrlToApply?: string) => {
    const imgUrl = imageUrlToApply || generatedPreview;
    if (!imgUrl) return;

    if (selectedTarget === 'cover') {
      onUpdateProject({ coverImage: imgUrl });
    } else {
      const updatedChapters = project.chapters.map(c => 
        c.id === selectedTarget ? { ...c, illustrationUrl: imgUrl, illustrationPrompt: promptText } : c
      );
      onUpdateProject({ chapters: updatedChapters });
    }

    setGeneratedPreview(null);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleApplyImageToBook(dataUrl);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleRemoveCurrentImage = () => {
    if (selectedTarget === 'cover') {
      onUpdateProject({ coverImage: undefined });
    } else {
      const updatedChapters = project.chapters.map(c => 
        c.id === selectedTarget ? { ...c, illustrationUrl: undefined } : c
      );
      onUpdateProject({ chapters: updatedChapters });
    }
  };

  return (
    <div id="illustrations-phase-view" className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCustomFileUpload}
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
      />

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <ImageIcon className="w-4 h-4" />
            <span>Schritt 6: Buch-Cover & Kapitel-Illustrationen</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Grafikstudio: KI-Cover & Eigene Bildeinbindung
          </h1>
          <p className="text-xs text-slate-300">
            Generieren Sie individuelle KI-Cover oder laden Sie Ihr eigenes benutzerdefiniertes Buch-Cover / Kapitelbild direkt hoch.
          </p>
        </div>

        <button
          onClick={onNextPhase}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20 shrink-0"
        >
          <span>Weiter zu Export & Cloud-Sync (Schritt 7)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="font-serif font-bold text-slate-100 text-base">
              Illustrations-Konfigurator
            </h2>
            <span className="text-[11px] text-indigo-400 font-semibold">KI & Upload</span>
          </div>

          {/* Target Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Verwendungszweck</label>
            <select
              value={selectedTarget}
              onChange={(e) => {
                setSelectedTarget(e.target.value);
                setGeneratedPreview(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:outline-none cursor-pointer"
            >
              <option value="cover">&bull; Buch-Cover (3:4 Format)</option>
              {project.chapters.map(c => (
                <option key={c.id} value={c.id}>
                  &bull; Kapitel {c.chapterNumber}: {c.title.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          {/* Quick Direct Upload Box */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Eigenes {selectedTarget === 'cover' ? 'Buch-Cover' : 'Kapitelbild'} hochladen</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Laden Sie eine eigene Bilddatei (JPG, PNG, WebP) von Ihrem Computer hoch.
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20"
            >
              <FolderOpen className="w-4 h-4" />
              <span>{selectedTarget === 'cover' ? 'Cover-Datei auswählen' : 'Kapitel-Illustration auswählen'}</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">oder mit KI generieren</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Style Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Kunst-Stilrichtung</label>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {STYLE_PRESETS.map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStyle(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs text-left font-medium border transition ${
                    selectedStyle === st 
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold' 
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Bildbeschreibung / Prompt</label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Beschreiben Sie das gewünschte Motiv für die KI..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          <button
            onClick={handleGenerateImageWithAi}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generiere Bild mit KI...' : 'KI-Illustration generieren'}</span>
          </button>
        </div>

        {/* Right Preview Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="font-serif font-bold text-slate-100 text-base">
              Vorschau & Zuordnung
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              {selectedTarget === 'cover' ? 'Buch-Cover' : `Kapitel ${activeChapter?.chapterNumber || 1}`}
            </span>
          </div>

          {/* Generated Image or Existing Asset */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[420px] space-y-4 relative">
            {generatedPreview ? (
              <div className="space-y-4 text-center">
                <img
                  src={generatedPreview}
                  alt="KI Vorschau"
                  className="max-h-80 max-w-full rounded-lg border border-slate-700 shadow-2xl object-contain mx-auto"
                />
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => handleApplyImageToBook()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/25 inline-flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Als {selectedTarget === 'cover' ? 'Cover' : 'Kapitelbild'} übernehmen</span>
                  </button>
                  <button
                    onClick={() => setGeneratedPreview(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Verwerfen
                  </button>
                </div>
              </div>
            ) : selectedTarget === 'cover' && project.coverImage ? (
              <div className="text-center space-y-4">
                <div className="relative group inline-block">
                  <img
                    src={project.coverImage}
                    alt="Aktuelles Cover"
                    className="max-h-88 rounded-lg border border-slate-700 shadow-2xl mx-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ersetzen</span>
                    </button>
                    <button
                      onClick={handleRemoveCurrentImage}
                      className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Löschen</span>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-emerald-400 font-bold">Aktuell zugewiesenes Buch-Cover</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Wird in PDF-, EPUB- und Kindle-Exporten verwendet.</p>
                </div>
              </div>
            ) : selectedTarget !== 'cover' && activeChapter?.illustrationUrl ? (
              <div className="text-center space-y-4">
                <div className="relative group inline-block">
                  <img
                    src={activeChapter.illustrationUrl}
                    alt="Kapitel Illustration"
                    className="max-h-80 rounded-lg border border-slate-700 shadow-2xl mx-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ersetzen</span>
                    </button>
                    <button
                      onClick={handleRemoveCurrentImage}
                      className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Löschen</span>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-emerald-400 font-bold">Aktuelle Kapitel-Illustration</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Wird oben in Kapitel {activeChapter.chapterNumber} platziert.</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 text-slate-500 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <FileImage className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-300">
                    Kein {selectedTarget === 'cover' ? 'Buch-Cover' : 'Kapitelbild'} zugewiesen
                  </p>
                  <p className="text-xs text-slate-500">
                    Laden Sie links eine eigene Grafik hoch oder generieren Sie eines mit KI.
                  </p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition inline-flex items-center space-x-2"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Eigenes Bild hochladen</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
