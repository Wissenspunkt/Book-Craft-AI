import React from 'react';
import { 
  FileText, 
  ListTree, 
  PenTool, 
  ShieldCheck, 
  CheckCheck, 
  Image as ImageIcon, 
  Share2, 
  CheckCircle2
} from 'lucide-react';
import { WorkflowPhase } from '../types';

interface WorkflowStepperProps {
  currentPhase: WorkflowPhase;
  onPhaseChange: (phase: WorkflowPhase) => void;
  completedPhases?: WorkflowPhase[];
}

export const WORKFLOW_STEPS: { id: WorkflowPhase; title: string; subtitle: string; icon: any }[] = [
  { id: 'concept', title: '1. Konzeption', subtitle: 'Vorlage & Stil', icon: FileText },
  { id: 'outline', title: '2. Gliederung', subtitle: 'Kapitel-Struktur', icon: ListTree },
  { id: 'writing', title: '3. Schreiben', subtitle: 'KI-Textentwurf', icon: PenTool },
  { id: 'factcheck', title: '4. Fakten & Quellen', subtitle: 'Strenge Kontrolle', icon: ShieldCheck },
  { id: 'proofread', title: '5. Korrektorat', subtitle: 'Lektorat & Stil', icon: CheckCheck },
  { id: 'illustrations', title: '6. Illustrationen', subtitle: 'Cover & Bilder', icon: ImageIcon },
  { id: 'export', title: '7. Export & Sync', subtitle: 'PDF, EPUB, Kindle', icon: Share2 }
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentPhase,
  onPhaseChange
}) => {
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentPhase);

  return (
    <div id="workflow-stepper-container" className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-16 z-30 shadow-sm py-2.5 px-4 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[760px] gap-2">
        {WORKFLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === currentPhase;
          const isPassed = idx < currentIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Button */}
              <button
                id={`step-btn-${step.id}`}
                onClick={() => onPhaseChange(step.id)}
                className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl transition-all duration-200 text-left border ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 shadow-sm shadow-blue-500/10'
                    : isPassed
                    ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 text-slate-300'
                    : 'bg-slate-900 hover:bg-slate-800/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className={`text-xs font-semibold leading-none ${isActive ? 'text-white' : isPassed ? 'text-slate-200' : 'text-slate-400'}`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[90px]">
                    {step.subtitle}
                  </div>
                </div>
              </button>

              {/* Separator Connector line */}
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`h-0.5 w-4 shrink-0 rounded ${idx < currentIndex ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
