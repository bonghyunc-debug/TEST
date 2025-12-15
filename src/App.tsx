// ============================================================================
// Smart Capital Gain Wizard - App Component
// 메인 앱 컴포넌트
// ============================================================================

import React from 'react';
import { useWizardStore } from '@/store/wizardStore';
import { WizardLayout } from '@/components/layout';
import {
  StartStep,
  DeclarationTypeStep,
  TaxpayerStep,
  AssetStep,
  TransactionStep,
  AmountsStep,
  ReliefStep,
  ResultStep,
} from '@/components/wizard/Steps';

const App: React.FC = () => {
  const { currentStep } = useWizardStore();
  
  const renderStep = () => {
    switch (currentStep) {
      case 'start':
        return <StartStep />;
      case 'declaration_type':
        return <DeclarationTypeStep />;
      case 'taxpayer':
        return <TaxpayerStep />;
      case 'asset':
        return <AssetStep />;
      case 'transaction':
        return <TransactionStep />;
      case 'amounts':
        return <AmountsStep />;
      case 'relief':
        return <ReliefStep />;
      case 'result':
        return <ResultStep />;
      default:
        return <StartStep />;
    }
  };
  
  return (
    <WizardLayout>
      {renderStep()}
    </WizardLayout>
  );
};

export default App;
