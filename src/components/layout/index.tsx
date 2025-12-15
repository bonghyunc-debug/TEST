// ============================================================================
// Smart Capital Gain Wizard - Layout Components
// 레이아웃 컴포넌트
// ============================================================================

import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  Home,
  FileText,
  User,
  Building2,
  Calendar,
  Calculator,
  Gift,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

import { WizardStep } from '@/domain/models';
import { useWizardStore } from '@/store/wizardStore';
import { Button } from '@/components/common';

// ---------------------------------------------------------------------------
// Step Info
// ---------------------------------------------------------------------------

interface StepInfo {
  id: WizardStep;
  label: string;
  icon: ReactNode;
}

const STEPS: StepInfo[] = [
  { id: 'start', label: '시작', icon: <Home size={18} /> },
  { id: 'declaration_type', label: '신고유형', icon: <FileText size={18} /> },
  { id: 'taxpayer', label: '인적사항', icon: <User size={18} /> },
  { id: 'asset', label: '자산정보', icon: <Building2 size={18} /> },
  { id: 'transaction', label: '거래정보', icon: <Calendar size={18} /> },
  { id: 'amounts', label: '금액정보', icon: <Calculator size={18} /> },
  { id: 'relief', label: '감면', icon: <Gift size={18} /> },
  { id: 'result', label: '결과', icon: <CheckCircle size={18} /> },
];

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  completedSteps,
}) => {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;
  
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          const isPast = index < currentIndex;
          
          return (
            <div
              key={step.id}
              className={clsx(
                'flex flex-col items-center gap-1 transition-all duration-200',
                isActive && 'scale-110'
              )}
            >
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : isCompleted || isPast
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-slate-100 text-slate-400'
                )}
              >
                {isCompleted && !isActive ? (
                  <CheckCircle size={18} />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={clsx(
                  'text-xs font-medium hidden sm:block',
                  isActive
                    ? 'text-primary-600'
                    : isCompleted || isPast
                    ? 'text-slate-600'
                    : 'text-slate-400'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Wizard Layout
// ---------------------------------------------------------------------------

interface WizardLayoutProps {
  children: ReactNode;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({ children }) => {
  const { currentStep, completedSteps, prevStep, nextStep, reset } = useWizardStore();
  
  const isFirstStep = currentStep === 'start';
  const isLastStep = currentStep === 'result';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Smart Capital Gain Wizard
                </h1>
                <p className="text-sm text-slate-500">양도소득세 간편신고</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              leftIcon={<RotateCcw size={16} />}
            >
              처음부터
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ProgressBar currentStep={currentStep} completedSteps={completedSteps} />
        
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8">
            {children}
          </div>
          
          {/* Navigation Footer */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={isFirstStep}
              leftIcon={<ChevronLeft size={18} />}
            >
              이전
            </Button>
            
            {!isLastStep && (
              <Button
                variant="primary"
                onClick={nextStep}
                rightIcon={<ChevronRight size={18} />}
              >
                다음
              </Button>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-slate-400">
          본 계산기는 참고용이며, 정확한 세액은 세무사 상담을 권장합니다.
        </p>
      </footer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step Container
// ---------------------------------------------------------------------------

interface StepContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const StepContainer: React.FC<StepContainerProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {description && (
          <p className="text-slate-500 mt-2">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
};
