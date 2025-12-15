// ============================================================================
// Smart Capital Gain Wizard - Zustand Store
// 위저드 상태 관리
// ============================================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import {
  WizardState,
  WizardStep,
  CapitalGainTransaction,
  DeclarationType,
  AssetType,
  AcquisitionPriceMethod,
  ExpenseMethod,
  Taxpayer,
  Transferee,
  AssetInfo,
  DealInfo,
  AmountInfo,
  ResidenceInfo,
  ReliefInfo,
  ReturnMeta,
} from '@/domain/models';

import { calculateTax } from '@/engine/taxEngine';
import { getNextStep, getPrevStep, isStepComplete } from '@/scenarios/scenarioEngine';

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialTransaction: Partial<CapitalGainTransaction> = {
  returnMeta: {
    declarationType: 'regular',
  },
  taxpayer: {
    name: '',
    ssn: '',
    phone: '',
  },
  asset: {
    type: 'general_house',
    address: '',
  },
  deal: {
    transferCause: 'sale',
    transferDate: '',
    acquisitionCause: 'purchase',
    acquisitionDate: '',
  },
  amounts: {
    transferPrice: 0,
    acquisitionPriceMethod: 'actual',
    expenseMethod: 'actual',
  },
  relief: {
    reliefType: 'none',
  },
};

const initialState: WizardState = {
  currentStep: 'start',
  completedSteps: [],
  transaction: initialTransaction,
  result: undefined,
  errors: {},
};

// ---------------------------------------------------------------------------
// Store Actions Interface
// ---------------------------------------------------------------------------

interface WizardActions {
  // Navigation
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Return Meta
  setDeclarationType: (type: DeclarationType) => void;
  setReturnMeta: (meta: Partial<ReturnMeta>) => void;
  
  // Taxpayer
  setTaxpayer: (taxpayer: Partial<Taxpayer>) => void;
  setTransferee: (transferee: Partial<Transferee>) => void;
  
  // Asset
  setAssetType: (type: AssetType) => void;
  setAsset: (asset: Partial<AssetInfo>) => void;
  
  // Deal
  setDeal: (deal: Partial<DealInfo>) => void;
  
  // Amounts
  setAmounts: (amounts: Partial<AmountInfo>) => void;
  setAcquisitionPriceMethod: (method: AcquisitionPriceMethod) => void;
  setExpenseMethod: (method: ExpenseMethod) => void;
  
  // Residence
  setResidence: (residence: Partial<ResidenceInfo>) => void;
  
  // Relief
  setRelief: (relief: Partial<ReliefInfo>) => void;
  
  // Calculation
  calculate: () => void;
  
  // Validation
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  
  // Reset
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useWizardStore = create<WizardState & WizardActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // --------------- Navigation ---------------
        goToStep: (step) => {
          set((state) => ({
            currentStep: step,
            completedSteps: state.completedSteps.includes(state.currentStep)
              ? state.completedSteps
              : [...state.completedSteps, state.currentStep],
          }));
        },
        
        nextStep: () => {
          const { currentStep, transaction } = get();
          
          // 현재 단계 완료 확인
          if (!isStepComplete(currentStep, transaction)) {
            return;
          }
          
          const next = getNextStep(currentStep, transaction);
          
          set((state) => ({
            currentStep: next,
            completedSteps: state.completedSteps.includes(currentStep)
              ? state.completedSteps
              : [...state.completedSteps, currentStep],
          }));
          
          // 결과 단계면 계산 실행
          if (next === 'result') {
            get().calculate();
          }
        },
        
        prevStep: () => {
          const { currentStep, transaction } = get();
          const prev = getPrevStep(currentStep, transaction);
          set({ currentStep: prev });
        },
        
        // --------------- Return Meta ---------------
        setDeclarationType: (type) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              returnMeta: {
                ...state.transaction.returnMeta,
                declarationType: type,
              } as ReturnMeta,
            },
          }));
        },
        
        setReturnMeta: (meta) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              returnMeta: {
                declarationType: 'regular',
                ...state.transaction.returnMeta,
                ...meta,
              } as ReturnMeta,
            },
          }));
        },
        
        // --------------- Taxpayer ---------------
        setTaxpayer: (taxpayer) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              taxpayer: {
                ...state.transaction.taxpayer,
                ...taxpayer,
              } as Taxpayer,
            },
          }));
        },
        
        setTransferee: (transferee) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              transferee: {
                ...state.transaction.transferee,
                ...transferee,
              } as Transferee,
            },
          }));
        },
        
        // --------------- Asset ---------------
        setAssetType: (type) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              asset: {
                ...state.transaction.asset,
                type,
              } as AssetInfo,
            },
          }));
        },
        
        setAsset: (asset) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              asset: {
                ...state.transaction.asset,
                ...asset,
              } as AssetInfo,
            },
          }));
        },
        
        // --------------- Deal ---------------
        setDeal: (deal) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              deal: {
                ...state.transaction.deal,
                ...deal,
              } as DealInfo,
            },
          }));
        },
        
        // --------------- Amounts ---------------
        setAmounts: (amounts) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              amounts: {
                ...state.transaction.amounts,
                ...amounts,
              } as AmountInfo,
            },
          }));
        },
        
        setAcquisitionPriceMethod: (method) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              amounts: {
                ...state.transaction.amounts,
                acquisitionPriceMethod: method,
              } as AmountInfo,
            },
          }));
        },
        
        setExpenseMethod: (method) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              amounts: {
                ...state.transaction.amounts,
                expenseMethod: method,
              } as AmountInfo,
            },
          }));
        },
        
        // --------------- Residence ---------------
        setResidence: (residence) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              residence: {
                ...state.transaction.residence,
                ...residence,
              },
            },
          }));
        },
        
        // --------------- Relief ---------------
        setRelief: (relief) => {
          set((state) => ({
            transaction: {
              ...state.transaction,
              relief: {
                ...state.transaction.relief,
                ...relief,
              } as ReliefInfo,
            },
          }));
        },
        
        // --------------- Calculation ---------------
        calculate: () => {
          const { transaction } = get();
          
          try {
            // 필수 필드 확인
            if (!transaction.returnMeta || !transaction.taxpayer ||
                !transaction.asset || !transaction.deal ||
                !transaction.amounts || !transaction.relief) {
              console.error('Missing required transaction fields');
              return;
            }
            
            const fullTx: CapitalGainTransaction = {
              returnMeta: transaction.returnMeta as ReturnMeta,
              taxpayer: transaction.taxpayer as Taxpayer,
              transferee: transaction.transferee,
              asset: transaction.asset as AssetInfo,
              deal: transaction.deal as DealInfo,
              amounts: transaction.amounts as AmountInfo,
              residence: transaction.residence,
              relief: transaction.relief as ReliefInfo,
            };
            
            const result = calculateTax(fullTx);
            set({ result });
          } catch (error) {
            console.error('Calculation error:', error);
          }
        },
        
        // --------------- Validation ---------------
        setError: (field, message) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [field]: message,
            },
          }));
        },
        
        clearError: (field) => {
          set((state) => {
            const { [field]: _, ...rest } = state.errors;
            return { errors: rest };
          });
        },
        
        clearAllErrors: () => {
          set({ errors: {} });
        },
        
        // --------------- Reset ---------------
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'capital-gain-wizard',
        partialize: (state) => ({
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
        }),
      }
    ),
    { name: 'WizardStore' }
  )
);

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectTransaction = (state: WizardState) => state.transaction;
export const selectResult = (state: WizardState) => state.result;
export const selectCurrentStep = (state: WizardState) => state.currentStep;
export const selectCompletedSteps = (state: WizardState) => state.completedSteps;
export const selectErrors = (state: WizardState) => state.errors;

export const selectIsStepComplete = (step: WizardStep) => (state: WizardState) =>
  isStepComplete(step, state.transaction);

export const selectCanProceed = (state: WizardState) =>
  isStepComplete(state.currentStep, state.transaction);
