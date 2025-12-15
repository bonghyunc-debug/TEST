# AGENT.md - Smart Capital Gain Wizard

> **AI 에이전트를 위한 프로젝트 컨텍스트 파일**
> 이 파일은 AI가 프로젝트를 이해하고 개발을 진행할 때 참고하는 핵심 문서입니다.

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Smart Capital Gain Wizard (양도소득세 간편신고 도우미) |
| **버전** | 1.2.0 |
| **최종 업데이트** | 2024-12-15 |
| **기술 스택** | React 18 + TypeScript + Vite + Zustand + Tailwind CSS |
| **배포 형태** | Standalone HTML (단일 파일) |
| **코드 라인** | ~3,800 lines |

---

## 🎯 핵심 원칙

### 1. 세법 준수 최우선
```
⚠️ 중요: 모든 계산 로직은 반드시 현행 세법을 기준으로 합니다.
- 소득세법, 소득세법 시행령, 시행규칙
- 국세청 고시 및 예규
- 세율, 공제율 변경 시 즉시 반영 필요
```

### 2. 자산유형별 분기 로직
8가지 자산유형에 따라 UI, 입력필드, 계산로직이 분기됩니다:
- `general_house` - 일반주택
- `high_price_house` - 고가주택 (12억 초과)
- `land` - 토지
- `land_farm` - 농지
- `commercial` - 상가/오피스텔
- `membership_right` - 조합원입주권
- `presale_right` - 분양권
- `unregistered` - 미등기자산

### 3. 취득원인별 분기 로직
취득원인에 따라 취득가액 계산방법이 달라집니다:
- `purchase` - 매매: 실지취득가액 / 환산취득가액
- `inheritance` - 상속: 실지취득가액 / 기준시가
- `gift` - 증여: 실지취득가액 / 기준시가
- `construction` - 신축: 실지취득가액 / 환산취득가액
- `auction` - 경매: 실지취득가액 / 환산취득가액
- `gift_carryover` - 이월과세 증여: 당초 취득원인 따름

---

## 📁 프로젝트 구조

```
smart-capital-gain-wizard/
├── AGENT.md                 # 👈 현재 파일 (AI 컨텍스트)
├── README.md                # 프로젝트 소개
├── CHANGELOG.md             # 버전 변경 이력
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
│
├── src/
│   ├── main.tsx             # 진입점
│   ├── App.tsx              # 메인 앱
│   │
│   ├── domain/              # 🔥 핵심 비즈니스 로직
│   │   ├── models/
│   │   │   └── index.ts     # 타입 정의 (Transaction, AmountInfo 등)
│   │   ├── constants/
│   │   │   └── index.ts     # 세율표, 공제율표, 상수값
│   │   └── calculators/
│   │       └── index.ts     # 세금 계산 로직
│   │
│   ├── store/
│   │   └── wizardStore.ts   # Zustand 상태관리
│   │
│   └── components/
│       ├── ui/              # 공통 UI 컴포넌트
│       │   └── index.tsx    # Card, Button, NumberInput 등
│       └── wizard/
│           └── Steps.tsx    # 위자드 스텝 컴포넌트
│
├── docs/
│   ├── BRANCH_LOGIC_SPEC.md # 분기 로직 명세서 (v1.2)
│   ├── SCENARIO_MATRIX.md   # 시나리오 매트릭스 (54개 조합)
│   └── TAX_REFERENCE.md     # 세법 참조 문서
│
└── dist/                    # 빌드 결과물
```

---

## 🔧 주요 파일별 역할

### `src/domain/models/index.ts`
**타입 정의 파일** - 모든 데이터 구조의 기준
```typescript
// 주요 인터페이스
- AssetType: 8가지 자산유형
- AcquisitionCause: 6가지 취득원인
- TransferCause: 양도원인 (일반매도, 부담부증여, 수용 등)
- AmountInfo: 금액정보 (giftEvalMethod 포함)
- Transaction: 전체 거래 데이터
- CalculationResult: 계산 결과
```

### `src/domain/constants/index.ts`
**세율/공제율 상수** - 세법 변경 시 이 파일만 수정
```typescript
// 2023년 기준 세율표
TAX_BRACKETS_2023: 6%~45% 누진세율
TAX_BRACKETS_PRE_2023: 구 세율표

// 장기보유특별공제율
LONG_TERM_DEDUCTION_TABLE_1: 일반 (3년~15년, 6%~30%)
LONG_TERM_DEDUCTION_TABLE_2: 고가주택 거주자 (보유+거주 합산)

// 주요 상수
HIGH_PRICE_LIMIT: 1,200,000,000원
BASIC_DEDUCTION: 2,500,000원
NONGTEUKSE_RATE: 0.2 (농특세 20%)
```

### `src/domain/calculators/index.ts`
**계산 로직** - 핵심 알고리즘
```typescript
// 주요 함수
calculateCapitalGainTax(): 양도소득세 전체 계산
getTaxRate(): 세율 결정 (중과 포함)
getLongTermDeduction(): 장기보유특별공제 계산
getExemption(): 감면 계산
calculatePenalty(): 가산세 계산
getInstallment(): 분납 계산
```

### `src/components/wizard/Steps.tsx`
**UI 컴포넌트** - 위자드 각 단계별 화면
```typescript
// 8단계 위자드
StartStep: 시작
DeclarationTypeStep: 신고유형
TaxpayerStep: 납세자정보
AssetStep: 자산유형
TransactionStep: 거래정보
AmountsStep: 금액정보 (⚠️ 부담부증여 평가방법 분기 포함)
ReliefStep: 감면
ResultStep: 결과
```

---

## ⚡ 최근 구현 사항 (v1.2.0)

### 부담부증여 평가방법 분기
```
IF 양도원인 = 부담부증여:
  └─ 증여재산 평가방법 선택 UI 표시
     ├─ 시가 선택 → 기존 취득원인별 분기 로직
     └─ 보충적평가(기준시가) 선택 → 취득가액 = 기준시가 강제
```

**관련 코드 위치:**
- `Steps.tsx:455-459` - `isBurdenGiftOfficial` 플래그
- `Steps.tsx:506-527` - `getAcquisitionPriceMethodOptions()` 분기
- `Steps.tsx:561-598` - 부담부증여 UI 섹션

---

## 🚀 향후 개발 계획 (ROADMAP)

### Phase 2: 주식 양도소득세 (예정)
```
├── 비상장주식 양도소득세
│   ├── 대주주/소액주주 구분
│   ├── 중소기업/일반기업 세율
│   └── 의제취득가액 계산
│
└── 해외주식 양도소득세
    ├── 연간 250만원 기본공제
    ├── 22% 단일세율
    └── 환율 적용 로직
```

### Phase 3: 신고서 PDF 생성 (예정)
- 양도소득세 과세표준 신고서 (갑)
- 양도소득금액 계산명세서
- 자동 PDF 생성 및 다운로드

---

## 🔍 디버깅 가이드

### 계산 결과 검증
```typescript
// 브라우저 콘솔에서 상태 확인
const state = JSON.parse(localStorage.getItem('capital-gain-wizard'));
console.log(state);
```

### 흔한 이슈
1. **취득가액 0원 표시**: `acquisitionPriceMethod`와 실제 입력값 매칭 확인
2. **장특공 미적용**: 보유기간 계산 로직 확인 (`holdingForDed` vs `holdingForRate`)
3. **세율 불일치**: 중과 조건 확인 (`isHeavyTaxed` 플래그)

---

## 📝 코드 수정 시 체크리스트

### 세율/공제율 변경 시
- [ ] `constants/index.ts` 수정
- [ ] `CHANGELOG.md` 버전 업데이트
- [ ] `AGENT.md` 버전 업데이트
- [ ] 테스트 케이스 검증

### 새 자산유형 추가 시
- [ ] `models/index.ts`에 타입 추가
- [ ] `constants/index.ts`에 관련 상수 추가
- [ ] `calculators/index.ts` 분기 로직 추가
- [ ] `Steps.tsx` UI 분기 추가
- [ ] `SCENARIO_MATRIX.md` 시나리오 추가
- [ ] `BRANCH_LOGIC_SPEC.md` 로직 명세 추가

### UI 수정 시
- [ ] `Steps.tsx` 컴포넌트 수정
- [ ] 반응형 레이아웃 확인
- [ ] 접근성(a11y) 확인

---

## 🔗 참고 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| 분기 로직 명세 | `docs/BRANCH_LOGIC_SPEC.md` | 5차원 분기 로직 상세 |
| 시나리오 매트릭스 | `docs/SCENARIO_MATRIX.md` | 54개 자산-취득 조합 |
| 변경 이력 | `CHANGELOG.md` | 버전별 변경사항 |
| 개발 가이드 | `docs/DEV_GUIDE.md` | 개발 환경 설정 |

---

## ⚠️ 주의사항

1. **세법 검증 필수**: 계산 로직 수정 시 반드시 국세청 자료와 대조
2. **하위 호환성**: localStorage 스키마 변경 시 마이그레이션 고려
3. **빌드 검증**: 배포 전 `npm run build` 후 standalone HTML 테스트
4. **combine.js 주의**: JS 인라인 시 `$` 특수문자 처리 확인

---

*이 문서는 프로젝트 변경 시 자동 업데이트됩니다.*
*최종 수정: 2024-12-15 | 버전: 1.2.0*
