// ============================================================================
// Smart Capital Gain Wizard - Domain Models
// 양도소득세 간편신고 도메인 모델 정의
// ============================================================================

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

/** 신고 유형 */
export type DeclarationType = 'regular' | 'after_deadline' | 'amended';

/** 자산 유형 */
export type AssetType =
  | 'general_house'      // 일반주택
  | 'high_price_house'   // 1세대1주택 고가주택
  | 'commercial'         // 상가/건물
  | 'land'               // 토지
  | 'land_farm'          // 자경/대토 농지
  | 'presale_right'      // 분양권
  | 'membership_right'   // 조합원입주권
  | 'unregistered';      // 미등기

/** 양도 원인 */
export type TransferCause =
  | 'sale'           // 매매
  | 'expropriation'  // 수용
  | 'auction'        // 경매/공매
  | 'burden_gift'    // 부담부증여
  | 'exchange';      // 교환

/** 취득 원인 */
export type AcquisitionCause =
  | 'purchase'        // 매매
  | 'construction'    // 신축
  | 'auction'         // 경매/공매
  | 'inheritance'     // 상속
  | 'gift'            // 증여
  | 'gift_carryover'; // 증여(이월과세)

/** 취득가액 산정 방식 */
export type AcquisitionPriceMethod = 'actual' | 'converted' | 'official';

/** 필요경비 산정 방식 */
export type ExpenseMethod = 'actual' | 'standard';

/** 토지 용도 */
export type LandUseType = 'business' | 'non_business';

/** 감면 유형 */
export type ReliefType =
  | 'none'
  | 'farm_8y'                    // 8년 자경 농지
  | 'farmland_exchange'          // 농지 대토
  | 'public_cash'                // 공익사업 수용 (현금)
  | 'public_replacement'         // 공익사업 수용 (대토)
  | 'custom';                    // 직접 입력

/** 위저드 단계 */
export type WizardStep =
  | 'start'
  | 'declaration_type'
  | 'taxpayer'
  | 'asset'
  | 'transaction'
  | 'amounts'
  | 'relief'
  | 'result';

// ---------------------------------------------------------------------------
// Sub-Models
// ---------------------------------------------------------------------------

/** 납세자 정보 */
export interface Taxpayer {
  name: string;
  ssn: string;           // 주민등록번호
  phone: string;
  address?: string;
}

/** 양수인 정보 */
export interface Transferee {
  name: string;
  ssn: string;
}

/** 자산 정보 */
export interface AssetInfo {
  type: AssetType;
  address: string;
  
  // 토지 관련
  landArea?: number;           // 면적 (㎡)
  landUseType?: LandUseType;   // 사업용/비사업용
  isBisatoException?: boolean; // 비사업용 중과 예외
  
  // 1990년 이전 취득 토지
  isPre1990?: boolean;
  price1990Jan1?: number;      // 1990.1.1 공시지가
  gradeAcq?: number;           // 취득 시 등급
  grade1990Aug30?: number;     // 1990.8.30 등급
  gradePrev1990Aug30?: number; // 1990.8.30 직전 등급
}

/** 거래 정보 */
export interface DealInfo {
  transferCause: TransferCause;
  transferDate: string;        // 양도일 (YYYY-MM-DD)
  
  acquisitionCause: AcquisitionCause;
  acquisitionDate: string;     // 취득일
  origAcquisitionDate?: string; // 당초 취득일 (상속/이월과세)
  origAcquisitionCause?: 'purchase' | 'inheritance' | 'gift';
}

/** 금액 정보 */
export interface AmountInfo {
  // 양도가액
  transferPrice: number;
  
  // 취득가액
  acquisitionPriceMethod: AcquisitionPriceMethod;
  acquisitionPrice?: number;       // 실거래가 (매입가)
  acquisitionTax?: number;         // 취등록세
  acquisitionBrokerage?: number;   // 취득 중개수수료
  acquisitionOther?: number;       // 기타 취득비용
  
  // 기준시가
  officialPriceAcq?: number;       // 취득 시 기준시가
  officialPriceTransfer?: number;  // 양도 시 기준시가
  
  // 필요경비
  expenseMethod: ExpenseMethod;
  repairCost?: number;             // 자본적지출
  transferBrokerage?: number;      // 양도 중개수수료
  otherExpense?: number;           // 기타 필요경비
  
  // 부담부증여 관련
  giftValue?: number;              // 증여재산 평가액
  debtAmount?: number;             // 채무인수액
  giftEvalMethod?: 'market' | 'official';
  
  // 이월과세 증여세
  giftTaxPaid?: number;
}

/** 1세대1주택 거주 정보 */
export interface ResidenceInfo {
  residenceYears?: number;
  useResidenceSpecial?: boolean;
}

/** 감면 정보 */
export interface ReliefInfo {
  reliefType: ReliefType;
  customRate?: number;            // 직접입력 감면율 (%)
  isNongteukseExempt?: boolean;   // 농특세 비과세
}

/** 신고 메타 정보 */
export interface ReturnMeta {
  declarationType: DeclarationType;
  reportDate?: string;
  paymentDate?: string;
  
  // 수정신고 (기납부세액)
  initialIncomeTax?: number;
  initialNongteukse?: number;
  
  // 합산신고
  hasPriorDeclaration?: boolean;
  priorIncomeAmount?: number;
  priorTaxAmount?: number;
}

// ---------------------------------------------------------------------------
// Main Transaction Model
// ---------------------------------------------------------------------------

/** 양도소득세 거래 (메인 도메인 모델) */
export interface CapitalGainTransaction {
  id?: string;
  
  // 신고 메타
  returnMeta: ReturnMeta;
  
  // 납세자/양수인
  taxpayer: Taxpayer;
  transferee?: Transferee;
  
  // 자산/거래/금액
  asset: AssetInfo;
  deal: DealInfo;
  amounts: AmountInfo;
  
  // 거주 (고가주택)
  residence?: ResidenceInfo;
  
  // 감면
  relief: ReliefInfo;
}

// ---------------------------------------------------------------------------
// Calculation Result Model
// ---------------------------------------------------------------------------

/** 보유기간 */
export interface HoldingPeriod {
  years: number;
  days: number;
  text: string;
}

/** 장기보유특별공제 */
export interface LongTermDeduction {
  amount: number;
  rate: number;
  desc: string;
}

/** 세율 적용 결과 */
export interface TaxRateResult {
  tax: number;
  rate: number;
  desc: string;
  isHeavyTaxed?: boolean;
}

/** 감면 결과 */
export interface ExemptionResult {
  amount: number;
  desc: string;
  nongteukse: number;
}

/** 가산세 상세 */
export interface PenaltyDetail {
  total: number;
  report: number;
  delay: number;
  delayDays: number;
  desc: string;
}

/** 분납 정보 */
export interface InstallmentInfo {
  canInstall: boolean;
  totalTax: number;
  firstPayment: number;
  secondPayment: number;
  secondDueDate?: string;
}

/** 세액 계산 결과 */
export interface TaxCalculationResult {
  // 취득가액/필요경비
  acquisitionPrice: number;
  acquisitionPriceMethod: string;
  expense: number;
  expenseDesc: string;
  
  // 양도차익
  rawGain: number;            // 양도차익
  taxableGain: number;        // 과세대상 양도차익
  taxExemptGain: number;      // 비과세 양도차익 (고가주택)
  
  // 장기보유특별공제
  longTermDeduction: LongTermDeduction;
  
  // 양도소득금액
  currentIncomeAmount: number;
  priorIncomeAmount: number;
  totalIncomeAmount: number;
  
  // 과세표준/세액
  basicDeduction: number;
  taxBase: number;
  taxRate: TaxRateResult;
  calculatedTax: number;
  
  // 감면
  exemption: ExemptionResult;
  decidedTax: number;
  
  // 가산세
  constructionPenalty: number;
  incomePenalty: PenaltyDetail;
  nongPenalty: PenaltyDetail;
  
  // 최종 세액
  totalIncomeTax: number;
  nongteukse: number;
  localIncomeTax: number;
  
  // 분납
  incomeInstallment: InstallmentInfo;
  nongInstallment: InstallmentInfo;
  
  // 납부 금액
  totalImmediateBill: number;
  
  // 기타
  deadline: string;
  holdingForRate: HoldingPeriod;
  holdingForDed: HoldingPeriod;
  highPriceLimit: number;
  
  // 부담부증여
  isBurdenGift: boolean;
  burdenRatio: number;
}

// ---------------------------------------------------------------------------
// Wizard State
// ---------------------------------------------------------------------------

/** 위저드 전체 상태 */
export interface WizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  transaction: Partial<CapitalGainTransaction>;
  result?: TaxCalculationResult;
  errors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Scenario Engine Types
// ---------------------------------------------------------------------------

/** 시나리오 ID */
export type ScenarioId =
  | 'HOUSE_GENERAL'
  | 'HIGH_PRICE_HOUSE_EXEMPT'
  | 'LAND_BUSINESS'
  | 'LAND_NON_BUSINESS'
  | 'LAND_FARM_8Y'
  | 'PRESALE_RIGHT'
  | 'MEMBERSHIP_RIGHT'
  | 'UNREGISTERED'
  | 'COMMERCIAL'
  | 'BURDEN_GIFT'
  | 'INHERITANCE'
  | 'GIFT_CARRYOVER';

/** 시나리오 룰 */
export interface ScenarioRule {
  id: ScenarioId;
  name: string;
  description: string;
  conditions: ScenarioCondition[];
  requiredFields: string[];
  optionalFields: string[];
  taxRateType: 'progressive' | 'flat' | 'heavy';
  specialLogic?: string[];
}

/** 시나리오 조건 */
export interface ScenarioCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
}
