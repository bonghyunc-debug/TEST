// ============================================================================
// Smart Capital Gain Wizard - Tax Engine
// 양도소득세 계산 엔진 (SmartTax 로직 포팅)
// ============================================================================

import {
  CapitalGainTransaction,
  TaxCalculationResult,
  HoldingPeriod,
  LongTermDeduction,
  TaxRateResult,
  ExemptionResult,
  PenaltyDetail,
  InstallmentInfo,
  AssetType,
} from '@/domain/models';

import {
  TAX_BRACKETS_2022,
  TAX_BRACKETS_2023,
  LTTD_GENERAL_TABLE,
  LTTD_ONE_HOUSE_TABLE,
  TAX_CONSTANTS,
  PENALTY_RATES,
  FIXED_PUBLIC_HOLIDAYS,
  LUNAR_HOLIDAY_MAP,
  TaxBracket,
  LTTDEntry,
} from '@/constants/taxConstants';

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** 숫자 포맷팅 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/** 문자열을 숫자로 파싱 */
export function parseNumber(val: string | number | undefined | null): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

/** 토지류 자산 여부 */
export function isLandType(type: AssetType): boolean {
  return type === 'land' || type === 'land_farm';
}

// ---------------------------------------------------------------------------
// Date Calculations
// ---------------------------------------------------------------------------

/** 보유기간 계산 */
export function calculatePeriod(startStr: string, endStr: string): HoldingPeriod {
  if (!startStr || !endStr) return { years: 0, days: 0, text: '0년 0일' };
  
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { years: 0, days: 0, text: '날짜 오류' };
  }
  
  let years = end.getFullYear() - start.getFullYear();
  const isBeforeBirthday =
    end.getMonth() < start.getMonth() ||
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate());
  
  if (isBeforeBirthday) years--;
  
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / MS_PER_DAY);
  
  const targetYears = Math.max(0, years);
  let remainingDays = diffDays;
  let computedYears = 0;
  let cursor = new Date(start);
  
  while (computedYears < targetYears) {
    const nextYear = new Date(cursor);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const yearLength = Math.round((nextYear.getTime() - cursor.getTime()) / MS_PER_DAY);
    
    if (remainingDays < yearLength) break;
    remainingDays -= yearLength;
    cursor = nextYear;
    computedYears++;
  }
  
  return {
    years: computedYears,
    days: remainingDays,
    text: `${computedYears}년 ${remainingDays}일`,
  };
}

/** 공휴일 Set 빌드 */
function buildHolidaySet(year: number): Set<string> {
  const set = new Set<string>();
  FIXED_PUBLIC_HOLIDAYS.forEach(md => set.add(`${year}-${md}`));
  (LUNAR_HOLIDAY_MAP[year] || []).forEach(d => set.add(d));
  return set;
}

/** 신고/납부 기한 계산 */
export function calculateDeadline(
  transferDateStr: string,
  isBurdenGift: boolean = false
): string {
  if (!transferDateStr) return '';
  
  const date = new Date(transferDateStr);
  if (isNaN(date.getTime())) return '';
  
  // 부담부증여는 3개월, 그 외 2개월
  const monthsToAdd = isBurdenGift ? 3 : 2;
  const targetMonth = date.getMonth() + monthsToAdd;
  const year = date.getFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;
  
  // 해당 월의 말일
  let deadline = new Date(year, month + 1, 0);
  
  // 주말/공휴일이면 다음 영업일로
  while (true) {
    const holidays = buildHolidaySet(deadline.getFullYear());
    const iso = deadline.toISOString().split('T')[0];
    const day = deadline.getDay();
    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidays.has(iso);
    
    if (isWeekend || isHoliday) {
      deadline.setDate(deadline.getDate() + 1);
    } else {
      break;
    }
  }
  
  return deadline.toISOString().split('T')[0];
}

/** 1985.1.1 의제취득일 적용 */
export function getEffectiveAcquisitionDate(dateStr: string): string {
  if (!dateStr) return dateStr;
  const date = new Date(dateStr);
  const pre1985 = new Date(TAX_CONSTANTS.PRE_1985_DATE);
  
  if (date < pre1985) {
    return TAX_CONSTANTS.PRE_1985_DATE;
  }
  return dateStr;
}

// ---------------------------------------------------------------------------
// Tax Rate Calculations
// ---------------------------------------------------------------------------

/** 세율표 선택 */
function getTaxBrackets(transferDate: string): TaxBracket[] {
  return transferDate >= '2023-01-01' ? TAX_BRACKETS_2023 : TAX_BRACKETS_2022;
}

/** 누진세액 계산 */
function calculateProgressiveTax(taxBase: number, brackets: TaxBracket[]): number {
  if (taxBase <= 0) return 0;
  const bracket = brackets.find(b => taxBase <= b.upTo) || brackets[brackets.length - 1];
  return Math.floor(taxBase * (bracket.rate / 100) - bracket.deduction);
}

/** 단기 양도세율 결정 */
export function determineSpecialRate(
  assetType: AssetType,
  holdingYears: number
): { ratePct: number | null; reason: string } {
  const years = Number.isFinite(holdingYears) ? holdingYears : 0;
  
  if (assetType === 'unregistered') {
    return { ratePct: 70, reason: '미등기 70%' };
  }
  
  if (assetType === 'presale_right') {
    if (years < 1) return { ratePct: 70, reason: '분양권 1년미만 70%' };
    return { ratePct: 60, reason: '분양권 60%' };
  }
  
  if (assetType === 'high_price_house' || assetType === 'membership_right') {
    if (years < 1) return { ratePct: 70, reason: '주택/입주권 1년미만 70%' };
    if (years < 2) return { ratePct: 60, reason: '주택/입주권 2년미만 60%' };
    return { ratePct: null, reason: '누진세율 적용' };
  }
  
  if (years < 1) return { ratePct: 50, reason: '1년미만 50%' };
  if (years < 2) return { ratePct: 40, reason: '2년미만 40%' };
  return { ratePct: null, reason: '누진세율 적용' };
}

/** 비사업용 토지 중과세 계산 */
function calcNonBusinessLandTax(taxBase: number, year: number): number {
  if (taxBase <= 0) return 0;
  const brackets = year >= 2023 ? TAX_BRACKETS_2023 : TAX_BRACKETS_2022;
  
  let tax = 0;
  let prevLimit = 0;
  
  for (const bracket of brackets) {
    const segment = Math.min(taxBase, bracket.upTo) - prevLimit;
    if (segment > 0) {
      tax += segment * ((bracket.rate + 10) / 100); // 각 구간 +10%p
      prevLimit = bracket.upTo;
    }
    if (taxBase <= bracket.upTo) break;
  }
  
  return Math.floor(tax);
}

/** 중과 대상 여부 */
function isHeavyTaxedCase(
  assetType: AssetType,
  landUseType: string | undefined,
  isBisatoException: boolean,
  years: number
): boolean {
  if (assetType === 'unregistered') return true;
  
  if (isLandType(assetType) && landUseType === 'non_business' && !isBisatoException) {
    return true;
  }
  
  if (assetType === 'presale_right' && years < 1) return true;
  
  return false;
}

/** 세율 결정 */
export function calculateTaxRate(
  taxBase: number,
  years: number,
  assetType: AssetType,
  landUseType: string | undefined,
  isBisatoException: boolean,
  transferDate: string
): TaxRateResult {
  const brackets = getTaxBrackets(transferDate);
  const bracket = brackets.find(b => taxBase <= b.upTo) || brackets[brackets.length - 1];
  const taxYear = new Date(transferDate).getFullYear();
  
  const isHeavy = isHeavyTaxedCase(assetType, landUseType, isBisatoException, years);
  const specialRate = determineSpecialRate(assetType, years);
  
  const candidates: TaxRateResult[] = [];
  
  // 기본 누진세율
  const basicTax = calculateProgressiveTax(taxBase, brackets);
  candidates.push({
    tax: basicTax,
    rate: bracket.rate,
    desc: `기본세율 (${bracket.rate}%)`,
    isHeavyTaxed: isHeavy,
  });
  
  // 단기 양도세율
  if (specialRate.ratePct !== null) {
    candidates.push({
      tax: Math.floor(taxBase * (specialRate.ratePct / 100)),
      rate: specialRate.ratePct,
      desc: specialRate.reason,
      isHeavyTaxed: isHeavy,
    });
  }
  
  // 비사업용 토지 중과
  const isBisato = isLandType(assetType) && landUseType === 'non_business';
  if (isBisato && !isBisatoException) {
    const bisatoTax = calcNonBusinessLandTax(taxBase, taxYear);
    candidates.push({
      tax: bisatoTax,
      rate: bracket.rate + 10,
      desc: '비사업용 토지 중과 (+10%p)',
      isHeavyTaxed: true,
    });
  }
  
  // 가장 높은 세액 선택
  return candidates.reduce((max, cur) => (cur.tax > max.tax ? cur : max), candidates[0]);
}

// ---------------------------------------------------------------------------
// Long-term Holding Deduction
// ---------------------------------------------------------------------------

/** LTTD 테이블에서 공제율 조회 */
function getLTTDRate(years: number, table: LTTDEntry[]): number {
  const entry = table.find(row => years >= row.minYears && years <= row.maxYears);
  return entry ? entry.rate : 0;
}

/** 장기보유특별공제 계산 */
export function calculateLongTermDeduction(
  gain: number,
  years: number,
  assetType: AssetType,
  residenceYears: number = 0,
  useResidenceSpecial: boolean = false
): LongTermDeduction {
  // 미등기, 분양권, 3년 미만은 공제 없음
  if (assetType === 'unregistered' || assetType === 'presale_right' || years < 3) {
    return { amount: 0, rate: 0, desc: '공제대상 아님' };
  }
  
  // 1세대1주택 고가주택
  if (assetType === 'high_price_house') {
    const resFullYears = Math.floor(residenceYears);
    const isResidenceSatisfied = resFullYears >= 2 || useResidenceSpecial;
    
    if (isResidenceSatisfied) {
      // 표2 적용 (보유+거주)
      const holdRate = getLTTDRate(years, LTTD_ONE_HOUSE_TABLE);
      const resRate = getLTTDRate(resFullYears, LTTD_ONE_HOUSE_TABLE);
      const totalRate = Math.min(0.8, holdRate + resRate);
      
      return {
        amount: Math.floor(gain * totalRate),
        rate: totalRate,
        desc: `표2 (보유${(holdRate * 100).toFixed(0)}%+거주${(resRate * 100).toFixed(0)}%)`,
      };
    } else {
      // 거주 2년 미만이면 표1 적용
      const rate = getLTTDRate(years, LTTD_GENERAL_TABLE);
      return {
        amount: Math.floor(gain * rate),
        rate,
        desc: '표1 (거주 2년 미만)',
      };
    }
  }
  
  // 일반 자산
  const rate = getLTTDRate(years, LTTD_GENERAL_TABLE);
  return {
    amount: Math.floor(gain * rate),
    rate,
    desc: `일반 공제 (${(rate * 100).toFixed(0)}%)`,
  };
}

// ---------------------------------------------------------------------------
// Exemption (Relief) Calculation
// ---------------------------------------------------------------------------

/** 감면 세액 계산 */
export function calculateExemption(
  tax: number,
  reliefType: string,
  customRate: number,
  transferDate: string,
  isNongteukseExempt: boolean
): ExemptionResult {
  let amount = 0;
  let desc = '';
  
  switch (reliefType) {
    case 'farm_8y':
      amount = Math.min(tax, TAX_CONSTANTS.FARM_YEARLY_LIMIT);
      desc = '8년 자경농지 감면';
      break;
      
    case 'farmland_exchange':
      amount = Math.min(tax, TAX_CONSTANTS.FARM_YEARLY_LIMIT);
      desc = '농지대토 감면';
      break;
      
    case 'public_cash':
    case 'public_replacement': {
      const isPost2025 = transferDate >= TAX_CONSTANTS.PUBLIC_CASH_RATE_CHANGE_DATE;
      const rate = isPost2025 ? 0.15 : 0.10;
      amount = Math.floor(tax * rate);
      desc = `공익사업 수용 (${(rate * 100).toFixed(0)}%)`;
      break;
    }
    
    case 'custom':
      amount = Math.floor(tax * (customRate / 100));
      desc = `직접입력 감면 (${customRate}%)`;
      break;
      
    default:
      break;
  }
  
  // 농어촌특별세
  const nongteukse = isNongteukseExempt || reliefType === 'farm_8y'
    ? 0
    : Math.floor(amount * TAX_CONSTANTS.NONGTEUKSE_RATE);
  
  return { amount, desc, nongteukse };
}

// ---------------------------------------------------------------------------
// Penalty Calculation
// ---------------------------------------------------------------------------

/** 수정신고 감면율 */
function getAmendedReliefRate(monthsLate: number): number {
  if (monthsLate <= 1) return 0.9;
  if (monthsLate <= 3) return 0.75;
  if (monthsLate <= 6) return 0.5;
  if (monthsLate <= 12) return 0.3;
  if (monthsLate <= 18) return 0.2;
  if (monthsLate <= 24) return 0.1;
  return 0;
}

/** 기한후신고 감면율 */
function getLateReturnReliefRate(monthsLate: number): number {
  if (monthsLate <= 1) return 0.5;
  if (monthsLate <= 3) return 0.3;
  if (monthsLate <= 6) return 0.2;
  return 0;
}

/** 월 차이 계산 */
function getMonthsDiff(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const days = to.getDate() - from.getDate();
  const total = years * 12 + months + (days >= 0 ? 0 : -1);
  return total < 0 ? 0 : total;
}

/** 가산세 계산 */
export function calculatePenalty(
  unpaidTax: number,
  declarationType: string,
  deadline: string,
  paymentDate: string,
  reportDate: string
): PenaltyDetail {
  if (unpaidTax <= 0) {
    return { total: 0, report: 0, delay: 0, delayDays: 0, desc: '가산세 없음' };
  }
  
  const dueDate = new Date(deadline);
  const payDate = new Date(paymentDate || deadline);
  const fileDate = new Date(reportDate || paymentDate || deadline);
  
  const daysLate = Math.max(0, Math.floor((payDate.getTime() - dueDate.getTime()) / MS_PER_DAY));
  const monthsLate = getMonthsDiff(dueDate, fileDate);
  
  // 납부지연 가산세
  const delayPenalty = Math.floor(unpaidTax * daysLate * PENALTY_RATES.LATE_PAYMENT_DAILY);
  
  // 신고 관련 가산세
  let reportPenalty = 0;
  let reliefRate = 0;
  
  if (declarationType === 'after_deadline') {
    // 무신고 가산세
    reportPenalty = Math.floor(unpaidTax * PENALTY_RATES.UNFILED);
    reliefRate = getLateReturnReliefRate(monthsLate);
  } else if (declarationType === 'amended') {
    // 과소신고 가산세
    reportPenalty = Math.floor(unpaidTax * PENALTY_RATES.UNDERFILED);
    reliefRate = getAmendedReliefRate(monthsLate);
  }
  
  // 감면 적용
  reportPenalty = Math.floor(reportPenalty * (1 - reliefRate));
  
  const total = reportPenalty + delayPenalty;
  const parts: string[] = [];
  
  if (reportPenalty > 0) {
    parts.push(declarationType === 'after_deadline' ? '무신고' : '과소신고');
  }
  if (daysLate > 0) {
    parts.push(`납부지연 ${daysLate}일`);
  }
  if (reliefRate > 0) {
    parts.push(`감면 ${(reliefRate * 100).toFixed(0)}%`);
  }
  
  return {
    total,
    report: reportPenalty,
    delay: delayPenalty,
    delayDays: daysLate,
    desc: parts.length ? parts.join(', ') : '가산세 없음',
  };
}

// ---------------------------------------------------------------------------
// Installment Calculation
// ---------------------------------------------------------------------------

/** 분납 계산 */
export function calculateInstallment(
  totalTax: number,
  threshold: number,
  deadline: string
): InstallmentInfo {
  if (totalTax <= threshold) {
    return {
      canInstall: false,
      totalTax,
      firstPayment: totalTax,
      secondPayment: 0,
    };
  }
  
  let secondPayment: number;
  if (totalTax <= threshold * 2) {
    secondPayment = totalTax - threshold;
  } else {
    secondPayment = Math.floor(totalTax / 2);
  }
  
  const firstPayment = totalTax - secondPayment;
  
  const dueDate = new Date(deadline);
  dueDate.setMonth(dueDate.getMonth() + 2);
  
  return {
    canInstall: true,
    totalTax,
    firstPayment,
    secondPayment,
    secondDueDate: dueDate.toISOString().split('T')[0],
  };
}

// ---------------------------------------------------------------------------
// Acquisition Price Calculation
// ---------------------------------------------------------------------------

/** 취득가액 계산 */
export function calculateAcquisitionPrice(
  tx: CapitalGainTransaction,
  burdenRatio: number = 1
): { price: number; method: string } {
  const { amounts } = tx;
  const method = amounts.acquisitionPriceMethod;
  
  // 실지거래가액 합계
  const actualTotal =
    (amounts.acquisitionPrice || 0) +
    (amounts.acquisitionTax || 0) +
    (amounts.acquisitionBrokerage || 0) +
    (amounts.acquisitionOther || 0);
  
  const officialAcq = amounts.officialPriceAcq || 0;
  
  if (method === 'actual') {
    const price = Math.floor(actualTotal * burdenRatio);
    return { price, method: '실지취득가액' };
  }
  
  if (method === 'official') {
    const price = Math.floor(officialAcq * burdenRatio);
    return { price, method: '기준시가' };
  }
  
  // 환산취득가액
  const transferPrice = amounts.transferPrice || 0;
  const officialTransfer = amounts.officialPriceTransfer || 0;
  
  if (officialTransfer > 0 && officialAcq > 0) {
    const rawPrice = Math.floor(transferPrice * (officialAcq / officialTransfer));
    const price = Math.floor(rawPrice * burdenRatio);
    return { price, method: '환산취득가액' };
  }
  
  return { price: 0, method: '산정불가' };
}

// ---------------------------------------------------------------------------
// Main Calculation Function
// ---------------------------------------------------------------------------

/** 양도소득세 계산 (메인 함수) */
export function calculateTax(tx: CapitalGainTransaction): TaxCalculationResult {
  const { returnMeta, asset, deal, amounts, residence, relief } = tx;
  
  // 유효 취득일 (1985년 의제 적용)
  const effectiveAcqDate = getEffectiveAcquisitionDate(deal.acquisitionDate);
  const effectiveOrigAcqDate = deal.origAcquisitionDate
    ? getEffectiveAcquisitionDate(deal.origAcquisitionDate)
    : undefined;
  
  // 보유기간 계산
  const holdingForRate = calculatePeriod(
    effectiveOrigAcqDate || effectiveAcqDate,
    deal.transferDate
  );
  const holdingForDed = calculatePeriod(effectiveAcqDate, deal.transferDate);
  
  // 부담부증여 안분율
  const isBurdenGift = deal.transferCause === 'burden_gift';
  let burdenRatio = 1;
  if (isBurdenGift && amounts.giftValue && amounts.giftValue > 0) {
    burdenRatio = Math.min(1, (amounts.debtAmount || 0) / amounts.giftValue);
  }
  
  // 취득가액 계산
  const acqData = calculateAcquisitionPrice(tx, burdenRatio);
  
  // 필요경비 계산
  let expense = 0;
  let expenseDesc = '';
  
  if (amounts.acquisitionPriceMethod === 'converted') {
    // 환산취득가액 사용 시 개산공제
    const basePrice = amounts.officialPriceAcq || 0;
    expense = Math.floor(basePrice * 0.03 * burdenRatio);
    expenseDesc = '개산공제 (3%)';
  } else if (amounts.expenseMethod === 'actual') {
    // 실제 필요경비
    const actualExpense =
      (amounts.repairCost || 0) +
      (amounts.transferBrokerage || 0) +
      (amounts.otherExpense || 0);
    expense = Math.floor(actualExpense * burdenRatio);
    expenseDesc = '실제 필요경비';
  } else {
    // 개산공제
    const basePrice = amounts.officialPriceAcq || acqData.price;
    expense = Math.floor(basePrice * 0.03 * burdenRatio);
    expenseDesc = '개산공제 (3%)';
  }
  
  // 증여세 납부액 가산 (이월과세)
  if (amounts.giftTaxPaid && amounts.giftTaxPaid > 0) {
    expense += amounts.giftTaxPaid;
    expenseDesc += ' + 증여세';
  }
  
  // 양도차익
  const transferPrice = amounts.transferPrice || 0;
  const rawGain = Math.max(0, transferPrice - acqData.price - expense);
  
  // 과세대상 양도차익 (고가주택 비과세 안분)
  let taxableGain = rawGain;
  let taxExemptGain = 0;
  const highPriceLimit = TAX_CONSTANTS.HIGH_PRICE_LIMIT;
  
  if (asset.type === 'high_price_house' && transferPrice > 0) {
    const nonTaxableRatio = Math.min(1, highPriceLimit / transferPrice);
    taxExemptGain = Math.floor(rawGain * nonTaxableRatio);
    taxableGain = Math.max(0, rawGain - taxExemptGain);
  }
  
  // 중과 대상 여부
  const isHeavy = isHeavyTaxedCase(
    asset.type,
    asset.landUseType,
    asset.isBisatoException || false,
    holdingForRate.years
  );
  
  // 장기보유특별공제
  const longTermDeduction = isHeavy
    ? { amount: 0, rate: 0, desc: '중과 대상 장특공 배제' }
    : calculateLongTermDeduction(
        taxableGain,
        holdingForDed.years,
        asset.type,
        residence?.residenceYears || 0,
        residence?.useResidenceSpecial || false
      );
  
  // 양도소득금액
  const currentIncomeAmount = taxableGain - longTermDeduction.amount;
  const priorIncomeAmount = returnMeta.priorIncomeAmount || 0;
  const isAggregation = returnMeta.hasPriorDeclaration || false;
  const totalIncomeAmount = currentIncomeAmount + (isAggregation ? priorIncomeAmount : 0);
  
  // 기본공제
  let basicDeduction = TAX_CONSTANTS.BASIC_DEDUCTION;
  if (asset.type === 'unregistered') {
    basicDeduction = 0;
  }
  
  // 과세표준
  const taxBase = Math.max(0, totalIncomeAmount - basicDeduction);
  
  // 세율 적용
  const taxRate = calculateTaxRate(
    taxBase,
    holdingForRate.years,
    asset.type,
    asset.landUseType,
    asset.isBisatoException || false,
    deal.transferDate
  );
  
  // 산출세액
  const calculatedTax = taxRate.tax;
  
  // 감면
  const exemption = calculateExemption(
    calculatedTax,
    relief.reliefType,
    relief.customRate || 0,
    deal.transferDate,
    relief.isNongteukseExempt || false
  );
  
  // 결정세액
  const decidedTax = Math.max(0, calculatedTax - exemption.amount);
  
  // 신고기한
  const deadline = calculateDeadline(deal.transferDate, isBurdenGift);
  
  // 건물 신축 환산가액 가산세
  let constructionPenalty = 0;
  const isBuilding = ['general_house', 'high_price_house', 'commercial'].includes(asset.type);
  const isConstruction = deal.acquisitionCause === 'construction';
  const isConverted = amounts.acquisitionPriceMethod === 'converted';
  
  if (isBuilding && isConstruction && isConverted && holdingForRate.years < 5) {
    constructionPenalty = Math.floor(acqData.price * 0.05);
  }
  
  // 수정신고 추가납부세액
  const initialIncomeTax = returnMeta.initialIncomeTax || 0;
  const initialNongteukse = returnMeta.initialNongteukse || 0;
  const additionalIncomeTax = decidedTax + constructionPenalty - initialIncomeTax;
  const additionalNong = exemption.nongteukse - initialNongteukse;
  
  // 가산세
  const incomePenalty = calculatePenalty(
    Math.max(0, additionalIncomeTax),
    returnMeta.declarationType,
    deadline,
    returnMeta.paymentDate || deadline,
    returnMeta.reportDate || returnMeta.paymentDate || deadline
  );
  
  const nongPenalty = calculatePenalty(
    Math.max(0, additionalNong),
    returnMeta.declarationType,
    deadline,
    returnMeta.paymentDate || deadline,
    returnMeta.reportDate || returnMeta.paymentDate || deadline
  );
  
  // 총 납부세액
  let totalIncomeTax = Math.max(0, additionalIncomeTax) + incomePenalty.total;
  const totalNongteukse = Math.max(0, additionalNong) + nongPenalty.total;
  
  // 합산신고 시 기납부세액 차감
  if (isAggregation) {
    totalIncomeTax = Math.max(0, totalIncomeTax - (returnMeta.priorTaxAmount || 0));
  }
  
  // 분납
  const incomeInstallment = calculateInstallment(totalIncomeTax, 10_000_000, deadline);
  const nongInstallment = calculateInstallment(totalNongteukse, 5_000_000, deadline);
  
  // 지방소득세
  const localIncomeTax = Math.floor(totalIncomeTax * TAX_CONSTANTS.LOCAL_TAX_RATE);
  
  // 즉시 납부액
  const totalImmediateBill = incomeInstallment.firstPayment + nongInstallment.firstPayment;
  
  return {
    acquisitionPrice: acqData.price,
    acquisitionPriceMethod: acqData.method,
    expense,
    expenseDesc,
    
    rawGain,
    taxableGain,
    taxExemptGain,
    
    longTermDeduction,
    
    currentIncomeAmount,
    priorIncomeAmount,
    totalIncomeAmount,
    
    basicDeduction,
    taxBase,
    taxRate,
    calculatedTax,
    
    exemption,
    decidedTax,
    
    constructionPenalty,
    incomePenalty,
    nongPenalty,
    
    totalIncomeTax,
    nongteukse: totalNongteukse,
    localIncomeTax,
    
    incomeInstallment,
    nongInstallment,
    
    totalImmediateBill,
    
    deadline,
    holdingForRate,
    holdingForDed,
    highPriceLimit,
    
    isBurdenGift,
    burdenRatio,
  };
}
