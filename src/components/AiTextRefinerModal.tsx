import React, { useState } from 'react';
import { Sparkles, Wand2, Check, X, ArrowRight, RefreshCw, Bot, Sliders } from 'lucide-react';
import { BookProject } from '../types';

interface AiTextRefinerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  originalText: string;
  projectContext: BookProject;
  chapterTitle?: string;
  onApplyRefinedText: (newText: string) => void;
}

const PRESET_INSTRUCTIONS = [
  { id: 'polish', label: 'Stil, Lesefluss & Grammatik polieren', prompt: 'Überarbeite den Text stilistisch: Korrigiere Grammatik und Satzbau, verbessere den Lesefluss und eliminiere Wortwiederholungen.' },
  { id: 'shorten', label: 'Kürzen um ca. 25% (Prägnant)', prompt: 'Straffe den Text und kürze ihn um etwa 25%. Entferne Füllwörter, ohne die inhaltlichen Kernaussagen zu verlieren.' },
  { id: 'expand', label: 'Ausführlicher erklären & Beispiele ergänzen', prompt: 'Erweitere den Text mit anschaulichen Erklärungen, greifbaren Praxisbeispielen und vertiefenden Argumenten.' },
  { id: 'academic', label: 'Akademisch & Fachlich aufwerten', prompt: 'Formuliere den Text in einem hochgradig professionellen, akademischen Fachstil mit präziser Terminologie.' },
  { id: 'engaging', label: 'Lebendiger & verständlicher gestalten', prompt: 'Mache den Text mitreißender, bildhafter und verständlicher. Nutze eine lebendige Sprache mit hoher Leserbindung.' },
  { id: 'facts', label: 'Fakten & Gegenargumente schärfen', prompt: 'Prüfe die Logik und Argumentationskette. Ergänze fundierte Gegenargumente und schärfe die Kernaussagen.' }
];

export const AiTextRefinerModal: React.FC<AiTextRefinerModalProps> = ({
  isOpen,
  onClose,
  title,
  originalText,
  projectContext,
  chapterTitle,
  onApplyRefinedText,
}) => {
  const [instruction, setInstruction] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refinedResult, setRefinedResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_INSTRUCTIONS[0]) => {
    setSelectedPreset(preset.id);
    setInstruction(preset.prompt);
  };

  const handleRunRefinement = async () => {
    if (!originalText || !originalText.trim()) {
      setErrorMessage("Kein Text zum Überarbeiten vorhanden.");
      return;
    }

    const finalInstruction = instruction.trim() || 'Überarbeite den Text bezüglich Stil, Lesefluss und Struktur.';
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText,
          instruction: finalInstruction,
          context: {
            title: projectContext.title,
            chapterTitle: chapterTitle || '',
            genre: projectContext.genre,
            tone: projectContext.tone,
            style: projectContext.style,
          }
        })
      });

      const resData = await response.json();
      if (resData.success && resData.refinedText) {
        setRefinedResult(resData.refinedText);
      } else {
        setErrorMessage(resData.error || "Überarbeitung fehlgeschlagen.");
      }
    } catch (err: any) {
      console.error("Refinement call failed:", err);
      setErrorMessage("Netzwerkfehler bei der Kommunikation mit der KI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (refinedResult) {
      onApplyRefinedText(refinedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl space-y-6 p-6 my-8 text-slate-100 relative border-t-2 border-t-purple-500/80">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
                <span>KI-Lektorat &amp; Manuelle Textänderung</span>
              </h2>
              <p className="text-xs text-slate-400">
                {title} {chapterTitle ? `(${chapterTitle})` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Instructions Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Schnellauswahl KI-Lektoratsauftrag:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESET_INSTRUCTIONS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-left p-2.5 rounded-xl border text-xs font-medium transition ${
                  selectedPreset === preset.id
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instruction Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Individuelle Regieanweisung an die KI:</span>
            <span className="text-[11px] text-slate-500 font-normal">z.B. "Füge 3 praktische Tipps ein" oder "Stelle auf Du-Form um"</span>
          </label>
          <textarea
            rows={3}
            value={instruction}
            onChange={(e) => {
              setInstruction(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="Geben Sie hier Ihre spezifische Anweisung ein, wie die KI diesen Text überarbeiten soll..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleRunRefinement}
            disabled={isProcessing || !originalText.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-purple-600/25 disabled:opacity-50"
          >
            <Wand2 className={`w-4 h-4 text-amber-300 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'KI überarbeitet Text...' : 'KI mit Textüberarbeitung beauftragen'}</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Comparison / Result View */}
        {refinedResult && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Überarbeiteter KI-Entwurf vergleichend prüfen:</span>
              </span>
              <button
                onClick={handleApply}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Überarbeiteten Text übernehmen</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Originaltext</span>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed font-serif">
                  {originalText}
                </div>
              </div>

              {/* Refined */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-purple-300 uppercase">Überarbeiteter KI-Text</span>
                <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/40 text-xs text-slate-100 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed font-serif shadow-inner">
                  {refinedResult}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
