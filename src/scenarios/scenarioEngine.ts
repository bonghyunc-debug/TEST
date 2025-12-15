// ============================================================================
// Smart Capital Gain Wizard - Scenario Engine
// 시나리오 기반 분기 로직
// ============================================================================

import {
  CapitalGainTransaction,
  ScenarioRule,
  ScenarioCondition,
  AssetType,
  WizardStep,
} from '@/domain/models';

// ---------------------------------------------------------------------------
// Scenario Rules Definition
// ---------------------------------------------------------------------------

export const SCENARIO_RULES: ScenarioRule[] = [
  {
    id: 'HIGH_PRICE_HOUSE_EXEMPT',
    name: '1세대1주택 고가주택 (비과세)',
    description: '12억 초과분만 과세, 비과세 안분 계산 필요',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'high_price_house' },
    ],
    requiredFields: [
      'asset.address',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
      'residence.residenceYears',
    ],
    optionalFields: ['residence.useResidenceSpecial'],
    taxRateType: 'progressive',
    specialLogic: ['HIGH_PRICE_EXEMPT_RATIO', 'ONE_HOUSE_LTTD'],
  },
  {
    id: 'HOUSE_GENERAL',
    name: '일반 주택',
    description: '다주택자 또는 비과세 요건 미충족 주택',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'general_house' },
    ],
    requiredFields: [
      'asset.address',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
    ],
    optionalFields: [],
    taxRateType: 'progressive',
  },
  {
    id: 'LAND_BUSINESS',
    name: '사업용 토지',
    description: '일반 세율 적용 토지',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'land' },
      { field: 'asset.landUseType', operator: 'eq', value: 'business' },
    ],
    requiredFields: [
      'asset.address',
      'asset.landArea',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
    ],
    optionalFields: ['asset.isPre1990'],
    taxRateType: 'progressive',
  },
  {
    id: 'LAND_NON_BUSINESS',
    name: '비사업용 토지',
    description: '중과세율 (+10%p) 적용',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'land' },
      { field: 'asset.landUseType', operator: 'eq', value: 'non_business' },
    ],
    requiredFields: [
      'asset.address',
      'asset.landArea',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
    ],
    optionalFields: ['asset.isBisatoException'],
    taxRateType: 'heavy',
    specialLogic: ['NON_BUSINESS_LAND_SURCHARGE'],
  },
  {
    id: 'LAND_FARM_8Y',
    name: '8년 자경 농지',
    description: '100% 감면 (한도 1억원)',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'land_farm' },
    ],
    requiredFields: [
      'asset.address',
      'asset.landArea',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
    ],
    optionalFields: [],
    taxRateType: 'progressive',
    specialLogic: ['FARM_8Y_RELIEF'],
  },
  {
    id: 'PRESALE_RIGHT',
    name: '분양권',
    description: '1년 미만 70%, 1년 이상 60% 단일세율',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'presale_right' },
    ],
    requiredFields: [
      'asset.address',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
    ],
    optionalFields: [],
    taxRateType: 'flat',
    specialLogic: ['PRESALE_FLAT_RATE'],
  },
  {
    id: 'MEMBERSHIP_RIGHT',
    name: '조합원입주권',
    description: '1년 미만 70%, 2년 미만 60%, 2년 이상 누진',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'membership_right' },
    ],
    requiredFields: [
      'asset.address',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
    ],
    optionalFields: [],
    taxRateType: 'progressive',
    specialLogic: ['MEMBERSHIP_SHORT_TERM_RATE'],
  },
  {
    id: 'UNREGISTERED',
    name: '미등기 자산',
    description: '70% 단일세율, 기본공제 없음',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'unregistered' },
    ],
    requiredFields: [
      'asset.address',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
    ],
    optionalFields: [],
    taxRateType: 'flat',
    specialLogic: ['UNREGISTERED_70PCT', 'NO_BASIC_DEDUCTION'],
  },
  {
    id: 'COMMERCIAL',
    name: '상가/건물',
    description: '일반 누진세율 적용',
    conditions: [
      { field: 'asset.type', operator: 'eq', value: 'commercial' },
    ],
    requiredFields: [
      'asset.address',
      'deal.transferDate',
      'deal.acquisitionDate',
      'amounts.transferPrice',
    ],
    optionalFields: [],
    taxRateType: 'progressive',
  },
  {
    id: 'BURDEN_GIFT',
    name: '부담부증여',
    description: '채무인수액 비율로 안분 과세',
    conditions: [
      { field: 'deal.transferCause', operator: 'eq', value: 'burden_gift' },
    ],
    requiredFields: [
      'amounts.giftValue',
      'amounts.debtAmount',
    ],
    optionalFields: ['amounts.giftEvalMethod'],
    taxRateType: 'progressive',
    specialLogic: ['BURDEN_GIFT_RATIO'],
  },
  {
    id: 'INHERITANCE',
    name: '상속 취득',
    description: '피상속인 취득일 기준 보유기간 계산',
    conditions: [
      { field: 'deal.acquisitionCause', operator: 'eq', value: 'inheritance' },
    ],
    requiredFields: [
      'deal.origAcquisitionDate',
    ],
    optionalFields: ['deal.origAcquisitionCause'],
    taxRateType: 'progressive',
    specialLogic: ['INHERITANCE_HOLDING_PERIOD'],
  },
  {
    id: 'GIFT_CARRYOVER',
    name: '증여 이월과세',
    description: '증여자 취득가액/취득일 승계',
    conditions: [
      { field: 'deal.acquisitionCause', operator: 'eq', value: 'gift_carryover' },
    ],
    requiredFields: [
      'deal.origAcquisitionDate',
      'amounts.giftTaxPaid',
    ],
    optionalFields: ['deal.origAcquisitionCause'],
    taxRateType: 'progressive',
    specialLogic: ['GIFT_CARRYOVER_ACQ_PRICE', 'GIFT_TAX_EXPENSE'],
  },
];

// ---------------------------------------------------------------------------
// Scenario Matching
// ---------------------------------------------------------------------------

/** 필드 값 가져오기 (점 표기법 지원) */
function getFieldValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

/** 조건 평가 */
function evaluateCondition(
  tx: Partial<CapitalGainTransaction>,
  condition: ScenarioCondition
): boolean {
  const value = getFieldValue(tx as Record<string, unknown>, condition.field);
  
  switch (condition.operator) {
    case 'eq':
      return value === condition.value;
    case 'ne':
      return value !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(value);
    case 'gt':
      return typeof value === 'number' && value > (condition.value as number);
    case 'lt':
      return typeof value === 'number' && value < (condition.value as number);
    case 'gte':
      return typeof value === 'number' && value >= (condition.value as number);
    case 'lte':
      return typeof value === 'number' && value <= (condition.value as number);
    default:
      return false;
  }
}

/** 시나리오 매칭 */
export function matchScenario(
  tx: Partial<CapitalGainTransaction>
): ScenarioRule | null {
  for (const rule of SCENARIO_RULES) {
    const allConditionsMet = rule.conditions.every(cond =>
      evaluateCondition(tx, cond)
    );
    
    if (allConditionsMet) {
      return rule;
    }
  }
  
  return null;
}

/** 모든 매칭되는 시나리오 반환 */
export function matchAllScenarios(
  tx: Partial<CapitalGainTransaction>
): ScenarioRule[] {
  return SCENARIO_RULES.filter(rule =>
    rule.conditions.every(cond => evaluateCondition(tx, cond))
  );
}

// ---------------------------------------------------------------------------
// Required Fields Validation
// ---------------------------------------------------------------------------

/** 필수 필드 검증 */
export function validateRequiredFields(
  tx: Partial<CapitalGainTransaction>,
  scenario: ScenarioRule
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of scenario.requiredFields) {
    const value = getFieldValue(tx as Record<string, unknown>, field);
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

// ---------------------------------------------------------------------------
// Step Navigation Logic
// ---------------------------------------------------------------------------

/** 자산 유형에 따른 필요 단계 결정 */
export function getRequiredSteps(
  assetType: AssetType | undefined,
  transferCause: string | undefined,
  _acquisitionCause: string | undefined
): WizardStep[] {
  const baseSteps: WizardStep[] = [
    'start',
    'declaration_type',
    'taxpayer',
    'asset',
    'transaction',
    'amounts',
  ];
  
  const additionalSteps: WizardStep[] = [];
  
  // 고가주택은 거주 정보 필요 (residence step은 amounts에 포함)
  
  // 감면 가능한 경우
  if (
    assetType === 'land_farm' ||
    transferCause === 'expropriation' ||
    assetType !== 'unregistered'
  ) {
    additionalSteps.push('relief');
  }
  
  return [...baseSteps, ...additionalSteps, 'result'];
}

/** 다음 단계 결정 */
export function getNextStep(
  currentStep: WizardStep,
  tx: Partial<CapitalGainTransaction>
): WizardStep {
  const steps = getRequiredSteps(
    tx.asset?.type,
    tx.deal?.transferCause,
    tx.deal?.acquisitionCause
  );
  
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= steps.length - 1) {
    return 'result';
  }
  
  return steps[currentIndex + 1];
}

/** 이전 단계 결정 */
export function getPrevStep(
  currentStep: WizardStep,
  tx: Partial<CapitalGainTransaction>
): WizardStep {
  const steps = getRequiredSteps(
    tx.asset?.type,
    tx.deal?.transferCause,
    tx.deal?.acquisitionCause
  );
  
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex <= 0) {
    return 'start';
  }
  
  return steps[currentIndex - 1];
}

/** 단계 완료 여부 확인 */
export function isStepComplete(
  step: WizardStep,
  tx: Partial<CapitalGainTransaction>
): boolean {
  switch (step) {
    case 'start':
      return true;
      
    case 'declaration_type':
      return !!tx.returnMeta?.declarationType;
      
    case 'taxpayer':
      return !!(tx.taxpayer?.name && tx.taxpayer?.ssn);
      
    case 'asset':
      return !!tx.asset?.type;
      
    case 'transaction':
      return !!(tx.deal?.transferDate && tx.deal?.acquisitionDate);
      
    case 'amounts':
      return !!(tx.amounts?.transferPrice && tx.amounts?.transferPrice > 0);
      
    case 'relief':
      return !!tx.relief?.reliefType;
      
    case 'result':
      return true;
      
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Scenario Description
// ---------------------------------------------------------------------------

/** 시나리오 설명 생성 */
export function getScenarioDescription(
  tx: Partial<CapitalGainTransaction>
): string {
  const scenarios = matchAllScenarios(tx);
  
  if (scenarios.length === 0) {
    return '일반 양도';
  }
  
  return scenarios.map(s => s.name).join(' + ');
}

/** 특수 로직 필요 여부 */
export function hasSpecialLogic(
  tx: Partial<CapitalGainTransaction>,
  logicId: string
): boolean {
  const scenarios = matchAllScenarios(tx);
  return scenarios.some(s => s.specialLogic?.includes(logicId));
}
