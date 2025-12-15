// ============================================================================
// Smart Capital Gain Wizard - Wizard Steps
// 위저드 스텝 컴포넌트
// ============================================================================

import React from 'react';
import {
  Home,
  FileText,
  Building2,
  TreePine,
  FileCheck,
  Stamp,
  Tractor,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Briefcase,
  Gift,
  Scale,
  Layers,
  RefreshCw,
  Gavel,
  Calculator,
  X,
} from 'lucide-react';

import { useWizardStore } from '@/store/wizardStore';
import { StepContainer } from '@/components/layout';
import {
  Button,
  Input,
  NumberInput,
  CardSelection,
  Section,
  InfoBox,
  ResultRow,
  Divider,
} from '@/components/common';

import '@/constants/taxConstants';

import { formatNumber } from '@/engine/taxEngine';

// ---------------------------------------------------------------------------
// Start Step
// ---------------------------------------------------------------------------

export const StartStep: React.FC = () => {
  const { nextStep } = useWizardStore();
  
  return (
    <StepContainer
      title="양도소득세 간편신고 시작"
      description="몇 가지 질문에 답하면 양도소득세를 자동으로 계산해드립니다."
    >
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Calculator className="w-10 h-10 text-primary-600" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          안녕하세요!
        </h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          양도소득세 계산을 도와드리겠습니다.
          단계별로 정보를 입력하시면 정확한 세액을 계산해드립니다.
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <FileText />, label: '신고유형' },
            { icon: <Building2 />, label: '자산정보' },
            { icon: <Calendar />, label: '거래정보' },
            { icon: <Calculator />, label: '세액계산' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 bg-slate-50 rounded-xl flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400">
                {item.icon}
              </div>
              <span className="text-sm text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
        
        <Button size="lg" onClick={nextStep}>
          시작하기
        </Button>
      </div>
    </StepContainer>
  );
};

// ---------------------------------------------------------------------------
// Declaration Type Step
// ---------------------------------------------------------------------------

export const DeclarationTypeStep: React.FC = () => {
  const { transaction, setDeclarationType, setReturnMeta } = useWizardStore();
  const declarationType = transaction.returnMeta?.declarationType || 'regular';
  
  const options = [
    {
      id: 'regular',
      label: '예정신고',
      subLabel: '양도일 2개월 이내',
      icon: <Calendar size={22} />,
    },
    {
      id: 'after_deadline',
      label: '기한후신고',
      subLabel: '기한 경과 후',
      icon: <AlertTriangle size={22} />,
    },
    {
      id: 'amended',
      label: '수정신고',
      subLabel: '내용 수정/보완',
      icon: <FileText size={22} />,
    },
  ];
  
  return (
    <StepContainer
      title="신고 유형 선택"
      description="양도소득세 신고 유형을 선택해주세요."
    >
      <CardSelection
        options={options}
        value={declarationType}
        onChange={(v) => setDeclarationType(v as 'regular' | 'after_deadline' | 'amended')}
        columns={3}
      />
      
      {declarationType === 'after_deadline' && (
        <InfoBox type="warning" title="기한후신고 안내">
          법정 신고기한이 경과하여 무신고 가산세가 부과될 수 있습니다.
          다만 기한후 1개월 이내 신고 시 50% 감면됩니다.
        </InfoBox>
      )}
      
      {declarationType === 'amended' && (
        <Section title="기납부 세액 입력">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="당초 양도소득세"
              value={transaction.returnMeta?.initialIncomeTax || 0}
              onChange={(v) => setReturnMeta({ initialIncomeTax: v })}
              suffix="원"
            />
            <NumberInput
              label="당초 농어촌특별세"
              value={transaction.returnMeta?.initialNongteukse || 0}
              onChange={(v) => setReturnMeta({ initialNongteukse: v })}
              suffix="원"
            />
          </div>
          <InfoBox type="info">
            수정신고 시 추가 납부세액에 대해 과소신고 가산세가 부과됩니다.
          </InfoBox>
        </Section>
      )}
      
      <Section title="신고/납부 일자">
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="신고일"
            value={transaction.returnMeta?.reportDate || ''}
            onChange={(e) => setReturnMeta({ reportDate: e.target.value })}
          />
          <Input
            type="date"
            label="납부예정일"
            value={transaction.returnMeta?.paymentDate || ''}
            onChange={(e) => setReturnMeta({ paymentDate: e.target.value })}
          />
        </div>
      </Section>
    </StepContainer>
  );
};

// ---------------------------------------------------------------------------
// Taxpayer Step
// ---------------------------------------------------------------------------

export const TaxpayerStep: React.FC = () => {
  const { transaction, setTaxpayer, setTransferee } = useWizardStore();
  
  return (
    <StepContainer
      title="인적사항 입력"
      description="양도인(본인)과 양수인 정보를 입력해주세요."
    >
      <Section title="양도인 (본인)">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="성명"
            placeholder="홍길동"
            value={transaction.taxpayer?.name || ''}
            onChange={(e) => setTaxpayer({ name: e.target.value })}
          />
          <Input
            label="주민등록번호"
            placeholder="000000-0000000"
            value={transaction.taxpayer?.ssn || ''}
            onChange={(e) => setTaxpayer({ ssn: e.target.value })}
          />
        </div>
        <Input
          label="연락처"
          placeholder="010-0000-0000"
          value={transaction.taxpayer?.phone || ''}
          onChange={(e) => setTaxpayer({ phone: e.target.value })}
        />
      </Section>
      
      <Divider className="my-6" />
      
      <Section title="양수인">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="성명"
            placeholder="김철수"
            value={transaction.transferee?.name || ''}
            onChange={(e) => setTransferee({ name: e.target.value })}
          />
          <Input
            label="주민등록번호"
            placeholder="000000-0000000"
            value={transaction.transferee?.ssn || ''}
            onChange={(e) => setTransferee({ ssn: e.target.value })}
          />
        </div>
      </Section>
    </StepContainer>
  );
};

// ---------------------------------------------------------------------------
// Asset Step
// ---------------------------------------------------------------------------

export const AssetStep: React.FC = () => {
  const { transaction, setAssetType, setAsset } = useWizardStore();
  const assetType = transaction.asset?.type || 'general_house';
  
  const assetOptions = [
    { id: 'general_house', label: '일반주택', icon: <Home size={22} /> },
    { id: 'high_price_house', label: '1세대1주택', subLabel: '고가주택', icon: <CheckCircle2 size={22} /> },
    { id: 'commercial', label: '상가/건물', icon: <Building2 size={22} /> },
    { id: 'land', label: '토지', subLabel: '나대지/잡종지', icon: <TreePine size={22} /> },
    { id: 'presale_right', label: '분양권', icon: <FileCheck size={22} /> },
    { id: 'membership_right', label: '입주권', icon: <Building2 size={22} /> },
    { id: 'land_farm', label: '농지', subLabel: '자경/대토', icon: <Tractor size={22} /> },
    { id: 'unregistered', label: '미등기', icon: <Stamp size={22} /> },
  ];
  
  const isLand = assetType === 'land' || assetType === 'land_farm';
  
  return (
    <StepContainer
      title="자산 정보 입력"
      description="양도하는 자산의 정보를 입력해주세요."
    >
      <Section title="자산 유형">
        <CardSelection
          options={assetOptions}
          value={assetType}
          onChange={(v) => setAssetType(v as any)}
          columns={4}
        />
      </Section>
      
      <Section title="자산 소재지">
        <Input
          label="주소"
          placeholder="서울특별시 강남구 테헤란로 123"
          value={transaction.asset?.address || ''}
          onChange={(e) => setAsset({ address: e.target.value })}
        />
      </Section>
      
      {isLand && (
        <>
          <Section title="토지 정보">
            <NumberInput
              label="면적"
              value={transaction.asset?.landArea || 0}
              onChange={(v) => setAsset({ landArea: v })}
              suffix="㎡"
              allowDecimal
            />
            
            <div className="mt-4">
              <CardSelection
                options={[
                  { id: 'business', label: '사업용 토지', subLabel: '일반세율 적용' },
                  { id: 'non_business', label: '비사업용 토지', subLabel: '중과세율 (+10%)' },
                ]}
                value={transaction.asset?.landUseType || 'business'}
                onChange={(v) => setAsset({ landUseType: v as any })}
                columns={2}
              />
            </div>
          </Section>
          
          {transaction.asset?.landUseType === 'non_business' && (
            <InfoBox type="warning" title="비사업용 토지 중과">
              비사업용 토지는 기본세율에 10%p가 가산됩니다.
              다만 8년 자경 농지 상속 등 예외 사유가 있는 경우 중과가 배제됩니다.
            </InfoBox>
          )}
        </>
      )}
      
      {assetType === 'high_price_house' && (
        <InfoBox type="info" title="1세대1주택 고가주택">
          양도가액 12억원 초과분에 대해서만 과세됩니다.
          거주요건(2년 이상) 충족 시 장기보유특별공제율이 높아집니다.
        </InfoBox>
      )}
    </StepContainer>
  );
};

// ---------------------------------------------------------------------------
// Transaction Step
// ---------------------------------------------------------------------------

export const TransactionStep: React.FC = () => {
  const { transaction, setDeal } = useWizardStore();
  
  const transferCauseOptions = [
    { id: 'sale', label: '매매', icon: <Briefcase size={18} /> },
    { id: 'expropriation', label: '수용', icon: <Gavel size={18} /> },
    { id: 'auction', label: '경매/공매', icon: <Scale size={18} /> },
    { id: 'burden_gift', label: '부담부증여', icon: <Gift size={18} /> },
    { id: 'exchange', label: '교환', icon: <RefreshCw size={18} /> },
  ];
  
  const acquisitionCauseOptions = [
    { id: 'purchase', label: '매매', icon: <Briefcase size={18} /> },
    { id: 'construction', label: '신축', icon: <Building2 size={18} /> },
    { id: 'auction', label: '경매/공매', icon: <Scale size={18} /> },
    { id: 'inheritance', label: '상속', icon: <FileText size={18} /> },
    { id: 'gift', label: '증여', icon: <Gift size={18} /> },
    { id: 'gift_carryover', label: '증여(이월)', subLabel: '이월과세', icon: <Layers size={18} /> },
  ];
  
  const acquisitionCause = transaction.deal?.acquisitionCause;
  const showOrigDate = acquisitionCause === 'inheritance' || acquisitionCause === 'gift_carryover';
  
  return (
    <StepContainer
      title="거래 정보 입력"
      description="양도 및 취득 관련 정보를 입력해주세요."
    >
      <Section title="양도 원인">
        <CardSelection
          options={transferCauseOptions}
          value={transaction.deal?.transferCause || 'sale'}
          onChange={(v) => setDeal({ transferCause: v as any })}
          columns={5}
        />
      </Section>
      
      <Section title="취득 원인">
        <CardSelection
          options={acquisitionCauseOptions}
          value={transaction.deal?.acquisitionCause || 'purchase'}
          onChange={(v) => setDeal({ acquisitionCause: v as any })}
          columns={3}
        />
      </Section>
      
      <Section title="거래 일자">
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="양도일 (잔금일)"
            value={transaction.deal?.transferDate || ''}
            onChange={(e) => setDeal({ transferDate: e.target.value })}
          />
          <Input
            type="date"
            label={acquisitionCause === 'inheritance' ? '상속개시일' : '취득일'}
            value={transaction.deal?.acquisitionDate || ''}
            onChange={(e) => setDeal({ acquisitionDate: e.target.value })}
          />
        </div>
        
        {showOrigDate && (
          <Input
            type="date"
            label={acquisitionCause === 'inheritance' ? '피상속인 취득일' : '당초 증여자 취득일'}
            value={transaction.deal?.origAcquisitionDate || ''}
            onChange={(e) => setDeal({ origAcquisitionDate: e.target.value })}
            hint="세율 및 장기보유특별공제 기산일로 사용됩니다."
          />
        )}
      </Section>
      
      {transaction.deal?.transferCause === 'burden_gift' && (
        <InfoBox type="info" title="부담부증여 안내">
          채무인수액 비율만큼 양도로 보아 과세됩니다.
          신고기한은 증여일로부터 3개월입니다.
        </InfoBox>
      )}
    </StepContainer>
  );
};

// ---------------------------------------------------------------------------
// Amounts Step
// ---------------------------------------------------------------------------

export const AmountsStep: React.FC = () => {
  const { transaction, setAmounts, setAcquisitionPriceMethod, setExpenseMethod, setResidence } = useWizardStore();
  
  const isBurdenGift = transaction.deal?.transferCause === 'burden_gift';
  const isHighPriceHouse = transaction.asset?.type === 'high_price_house';
  
  return (
    <StepContainer
      title="금액 정보 입력"
      description="양도가액, 취득가액, 필요경비를 입력해주세요."
    >
      <Section title="양도가액">
        <NumberInput
          label="양도가액 (실거래가)"
          value={transaction.amounts?.transferPrice || 0}
          onChange={(v) => setAmounts({ transferPrice: v })}
          suffix="원"
        />
      </Section>
      
      {isBurdenGift && (
        <Section title="부담부증여 정보">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="증여재산 평가액"
              value={transaction.amounts?.giftValue || 0}
              onChange={(v) => setAmounts({ giftValue: v })}
              suffix="원"
            />
            <NumberInput
              label="채무인수액"
              value={transaction.amounts?.debtAmount || 0}
              onChange={(v) => setAmounts({ debtAmount: v })}
              suffix="원"
            />
          </div>
        </Section>
      )}
      
      <Section title="취득가액">
        <CardSelection
          options={[
            { id: 'actual', label: '실지취득가액', subLabel: '실제 매입가 기준' },
            { id: 'converted', label: '환산취득가액', subLabel: '기준시가 비율 환산' },
            { id: 'official', label: '기준시가', subLabel: '공시가격 기준' },
          ]}
          value={transaction.amounts?.acquisitionPriceMethod || 'actual'}
          onChange={(v) => setAcquisitionPriceMethod(v as any)}
          columns={3}
        />
        
        {transaction.amounts?.acquisitionPriceMethod === 'actual' && (
          <div className="mt-4 space-y-4">
            <NumberInput
              label="매입가액"
              value={transaction.amounts?.acquisitionPrice || 0}
              onChange={(v) => setAmounts({ acquisitionPrice: v })}
              suffix="원"
            />
            <div className="grid grid-cols-3 gap-4">
              <NumberInput
                label="취등록세"
                value={transaction.amounts?.acquisitionTax || 0}
                onChange={(v) => setAmounts({ acquisitionTax: v })}
                suffix="원"
              />
              <NumberInput
                label="중개수수료"
                value={transaction.amounts?.acquisitionBrokerage || 0}
                onChange={(v) => setAmounts({ acquisitionBrokerage: v })}
                suffix="원"
              />
              <NumberInput
                label="기타비용"
                value={transaction.amounts?.acquisitionOther || 0}
                onChange={(v) => setAmounts({ acquisitionOther: v })}
                suffix="원"
              />
            </div>
          </div>
        )}
        
        {transaction.amounts?.acquisitionPriceMethod !== 'actual' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <NumberInput
              label="취득 시 기준시가"
              value={transaction.amounts?.officialPriceAcq || 0}
              onChange={(v) => setAmounts({ officialPriceAcq: v })}
              suffix="원"
            />
            <NumberInput
              label="양도 시 기준시가"
              value={transaction.amounts?.officialPriceTransfer || 0}
              onChange={(v) => setAmounts({ officialPriceTransfer: v })}
              suffix="원"
            />
          </div>
        )}
      </Section>
      
      <Section title="필요경비">
        <CardSelection
          options={[
            { id: 'actual', label: '실제 필요경비', subLabel: '실제 지출액' },
            { id: 'standard', label: '개산공제', subLabel: '기준시가의 3%' },
          ]}
          value={transaction.amounts?.expenseMethod || 'actual'}
          onChange={(v) => setExpenseMethod(v as any)}
          columns={2}
        />
        
        {transaction.amounts?.expenseMethod === 'actual' && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <NumberInput
              label="자본적지출"
              value={transaction.amounts?.repairCost || 0}
              onChange={(v) => setAmounts({ repairCost: v })}
              suffix="원"
            />
            <NumberInput
              label="양도 중개수수료"
              value={transaction.amounts?.transferBrokerage || 0}
              onChange={(v) => setAmounts({ transferBrokerage: v })}
              suffix="원"
            />
            <NumberInput
              label="기타비용"
              value={transaction.amounts?.otherExpense || 0}
              onChange={(v) => setAmounts({ otherExpense: v })}
              suffix="원"
            />
          </div>
        )}
      </Section>
      
      {isHighPriceHouse && (
        <Section title="거주 정보 (1세대1주택)">
          <NumberInput
            label="거주 기간"
            value={transaction.residence?.residenceYears || 0}
            onChange={(v) => setResidence({ residenceYears: v })}
            suffix="년"
            allowDecimal
          />
          <InfoBox type="info">
            2년 이상 거주 시 장기보유특별공제 80%까지 적용됩니다.
          </InfoBox>
        </Section>
      )}
    </StepContainer>
  );
};

// ---------------------------------------------------------------------------
// Relief Step
// ---------------------------------------------------------------------------

export const ReliefStep: React.FC = () => {
  const { transaction, setRelief } = useWizardStore();
  
  const reliefOptions = [
    { id: 'none', label: '해당 없음', icon: <X size={18} /> },
    { id: 'farm_8y', label: '8년 자경 농지', subLabel: '100% (한도 1억)', icon: <Tractor size={18} /> },
    { id: 'public_cash', label: '공익사업 수용', subLabel: '10~15%', icon: <Briefcase size={18} /> },
    { id: 'custom', label: '기타 감면', subLabel: '직접 입력', icon: <Calculator size={18} /> },
  ];
  
  return (
    <StepContainer
      title="감면 정보"
      description="해당되는 감면이 있으면 선택해주세요."
    >
      <Section title="감면 유형">
        <CardSelection
          options={reliefOptions}
          value={transaction.relief?.reliefType || 'none'}
          onChange={(v) => setRelief({ reliefType: v as any })}
          columns={2}
        />
      </Section>
      
      {transaction.relief?.reliefType === 'custom' && (
        <Section title="직접 입력">
          <NumberInput
            label="감면율"
            value={transaction.relief?.customRate || 0}
            onChange={(v) => setRelief({ customRate: v })}
            suffix="%"
            allowDecimal
          />
        </Section>
      )}
      
      {transaction.relief?.reliefType !== 'none' && (
        <Section title="농어촌특별세">
          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={transaction.relief?.isNongteukseExempt || false}
              onChange={(e) => setRelief({ isNongteukseExempt: e.target.checked })}
              className="w-5 h-5 rounded text-primary-600"
            />
            <div>
              <span className="font-semibold text-slate-800">농어촌특별세 비과세</span>
              <p className="text-sm text-slate-500">8년 자경농지 감면 등은 농특세 비과세</p>
            </div>
          </label>
        </Section>
      )}
    </StepContainer>
  );
};

// ---------------------------------------------------------------------------
// Result Step
// ---------------------------------------------------------------------------

export const ResultStep: React.FC = () => {
  const { result } = useWizardStore();
  
  if (!result) {
    return (
      <StepContainer title="계산 중..." description="">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto" />
          <p className="text-slate-500 mt-4">세액을 계산하고 있습니다...</p>
        </div>
      </StepContainer>
    );
  }
  
  return (
    <StepContainer
      title="계산 결과"
      description={`신고기한: ${result.deadline}`}
    >
      {/* 요약 카드 */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-6">
        <div className="text-sm opacity-80 mb-1">총 납부세액</div>
        <div className="text-3xl font-bold mb-4">
          {formatNumber(result.totalImmediateBill)}원
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          <div>
            <div className="text-xs opacity-70">양도소득세</div>
            <div className="font-semibold">{formatNumber(result.totalIncomeTax)}원</div>
          </div>
          <div>
            <div className="text-xs opacity-70">농어촌특별세</div>
            <div className="font-semibold">{formatNumber(result.nongteukse)}원</div>
          </div>
          <div>
            <div className="text-xs opacity-70">지방소득세</div>
            <div className="font-semibold">{formatNumber(result.localIncomeTax)}원</div>
          </div>
        </div>
      </div>
      
      {/* 상세 내역 */}
      <div className="space-y-6">
        <Section title="양도차익 계산">
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <ResultRow label="양도가액" value={result.rawGain + result.acquisitionPrice + result.expense} />
            <ResultRow label={`취득가액 (${result.acquisitionPriceMethod})`} value={-result.acquisitionPrice} indent />
            <ResultRow label={`필요경비 (${result.expenseDesc})`} value={-result.expense} indent />
            <Divider className="my-2" />
            <ResultRow label="양도차익" value={result.rawGain} highlight />
          </div>
        </Section>
        
        {result.taxExemptGain > 0 && (
          <Section title="비과세 안분 (고가주택)">
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <ResultRow label="비과세 양도차익" value={result.taxExemptGain} />
              <ResultRow label="과세대상 양도차익" value={result.taxableGain} highlight />
            </div>
          </Section>
        )}
        
        <Section title="양도소득금액">
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <ResultRow label="과세대상 양도차익" value={result.taxableGain} />
            <ResultRow
              label={`장기보유특별공제 (${result.longTermDeduction.desc})`}
              value={-result.longTermDeduction.amount}
              indent
            />
            <Divider className="my-2" />
            <ResultRow label="양도소득금액" value={result.currentIncomeAmount} highlight />
          </div>
        </Section>
        
        <Section title="세액 계산">
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <ResultRow label="양도소득금액" value={result.totalIncomeAmount} />
            <ResultRow label="기본공제" value={-result.basicDeduction} indent />
            <ResultRow label="과세표준" value={result.taxBase} />
            <Divider className="my-2" />
            <ResultRow label={`산출세액 (${result.taxRate.desc})`} value={result.calculatedTax} />
            {result.exemption.amount > 0 && (
              <ResultRow label={`감면세액 (${result.exemption.desc})`} value={-result.exemption.amount} indent />
            )}
            <ResultRow label="결정세액" value={result.decidedTax} highlight />
          </div>
        </Section>
        
        {(result.incomePenalty.total > 0 || result.nongPenalty.total > 0) && (
          <Section title="가산세">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
              {result.constructionPenalty > 0 && (
                <ResultRow label="환산가액 가산세" value={result.constructionPenalty} />
              )}
              {result.incomePenalty.total > 0 && (
                <ResultRow label={`소득세 가산세 (${result.incomePenalty.desc})`} value={result.incomePenalty.total} />
              )}
              {result.nongPenalty.total > 0 && (
                <ResultRow label={`농특세 가산세 (${result.nongPenalty.desc})`} value={result.nongPenalty.total} />
              )}
            </div>
          </Section>
        )}
        
        {result.incomeInstallment.canInstall && (
          <Section title="분납 안내">
            <InfoBox type="info" title="분납 가능">
              양도소득세 {formatNumber(result.totalIncomeTax)}원 중{' '}
              {formatNumber(result.incomeInstallment.secondPayment)}원을{' '}
              {result.incomeInstallment.secondDueDate}까지 분납할 수 있습니다.
            </InfoBox>
          </Section>
        )}
      </div>
      
      {/* 보유기간 정보 */}
      <div className="mt-6 p-4 bg-slate-100 rounded-xl">
        <div className="text-sm text-slate-600">
          <span className="font-semibold">보유기간:</span> {result.holdingForRate.text}
          {result.holdingForDed.text !== result.holdingForRate.text && (
            <span className="ml-4">
              <span className="font-semibold">장특공 기산:</span> {result.holdingForDed.text}
            </span>
          )}
        </div>
      </div>
    </StepContainer>
  );
};
