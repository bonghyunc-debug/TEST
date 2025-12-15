# DEV_GUIDE.md - 개발 가이드

> Smart Capital Gain Wizard 개발 환경 설정 및 개발 가이드

---

## 🛠️ 개발 환경 설정

### 필수 요구사항

- Node.js 18.x 이상
- npm 9.x 이상 또는 yarn 1.22.x 이상

### 초기 설정

```bash
# 저장소 클론
git clone [repository-url]
cd smart-capital-gain-wizard

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

---

## 📁 프로젝트 구조 상세

```
smart-capital-gain-wizard/
│
├── 📄 루트 파일들
│   ├── AGENT.md              # AI 에이전트 컨텍스트
│   ├── README.md             # 프로젝트 소개
│   ├── CHANGELOG.md          # 버전 변경 이력
│   ├── package.json          # 의존성 관리
│   ├── tsconfig.json         # TypeScript 설정
│   ├── vite.config.ts        # Vite 빌드 설정
│   ├── tailwind.config.js    # Tailwind CSS 설정
│   └── postcss.config.js     # PostCSS 설정
│
├── 📂 src/                   # 소스 코드
│   ├── main.tsx              # 앱 진입점
│   ├── App.tsx               # 메인 앱 컴포넌트
│   ├── index.css             # 전역 스타일
│   │
│   ├── 📂 domain/            # 🔥 비즈니스 로직 (핵심)
│   │   ├── models/
│   │   │   └── index.ts      # 타입/인터페이스 정의
│   │   ├── constants/
│   │   │   └── index.ts      # 세율표, 공제율, 상수
│   │   └── calculators/
│   │       └── index.ts      # 세금 계산 함수
│   │
│   ├── 📂 store/             # 상태 관리
│   │   └── wizardStore.ts    # Zustand 스토어
│   │
│   └── 📂 components/        # UI 컴포넌트
│       ├── ui/
│       │   └── index.tsx     # 공통 UI (Card, Button 등)
│       └── wizard/
│           └── Steps.tsx     # 위자드 스텝 컴포넌트
│
├── 📂 docs/                  # 문서
│   ├── BRANCH_LOGIC_SPEC.md  # 분기 로직 명세
│   ├── SCENARIO_MATRIX.md    # 시나리오 매트릭스
│   ├── ROADMAP.md            # 개발 로드맵
│   └── DEV_GUIDE.md          # 개발 가이드 (현재 파일)
│
└── 📂 dist/                  # 빌드 결과물 (gitignore)
```

---

## 🏗️ 아키텍처

### 레이어 구조

```
┌─────────────────────────────────────────────┐
│                  UI Layer                    │
│         (components/wizard/Steps.tsx)        │
├─────────────────────────────────────────────┤
│               State Layer                    │
│           (store/wizardStore.ts)             │
├─────────────────────────────────────────────┤
│              Domain Layer                    │
│  ┌─────────┬─────────────┬─────────────┐   │
│  │ Models  │  Constants  │ Calculators │   │
│  └─────────┴─────────────┴─────────────┘   │
└─────────────────────────────────────────────┘
```

### 데이터 흐름

```
User Input
    ↓
UI Components (Steps.tsx)
    ↓
Zustand Actions (wizardStore.ts)
    ↓
State Update (transaction object)
    ↓
Calculator (calculateCapitalGainTax)
    ↓
Result Display
```

---

## 📝 코딩 컨벤션

### TypeScript

```typescript
// ✅ 인터페이스는 명확한 이름 사용
interface AmountInfo {
  transferPrice: number;
  acquisitionPrice?: number;
  // ...
}

// ✅ 타입은 유니온 타입으로 제한
type AssetType = 
  | 'general_house' 
  | 'high_price_house' 
  | 'land';

// ✅ 함수는 명확한 반환 타입 명시
function calculateTax(base: number): number {
  // ...
}
```

### React 컴포넌트

```tsx
// ✅ 함수형 컴포넌트 + React.FC 사용
export const MyComponent: React.FC = () => {
  // hooks는 최상단에
  const { transaction, setAmount } = useWizardStore();
  const [localState, setLocalState] = useState(0);

  // handlers 정의
  const handleChange = (value: number) => {
    setAmount({ price: value });
  };

  // 렌더링
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};
```

### Tailwind CSS

```tsx
// ✅ 클래스 순서: 레이아웃 → 크기 → 스타일 → 상태
<div className="flex flex-col w-full p-4 bg-white rounded-lg shadow-md hover:shadow-lg">

// ✅ 조건부 클래스는 clsx/cn 사용
<button className={cn(
  "px-4 py-2 rounded",
  isActive ? "bg-blue-500 text-white" : "bg-gray-200"
)}>
```

---

## 🔧 주요 파일 수정 가이드

### 세율 변경 시

1. `src/domain/constants/index.ts` 수정
```typescript
// 세율표 수정
export const TAX_BRACKETS_2024 = [
  { upTo: 14000000, rate: 6, deduction: 0 },
  // ...
];
```

2. `src/domain/calculators/index.ts`에서 사용 확인

3. `CHANGELOG.md` 업데이트

### 새 자산유형 추가 시

1. `src/domain/models/index.ts`에 타입 추가
```typescript
export type AssetType = 
  | 'general_house'
  // ...
  | 'new_asset_type';  // 추가
```

2. `src/domain/constants/index.ts`에 관련 상수 추가

3. `src/domain/calculators/index.ts`에 분기 로직 추가

4. `src/components/wizard/Steps.tsx`에 UI 추가

5. `docs/SCENARIO_MATRIX.md`에 시나리오 추가

### 새 위자드 스텝 추가 시

1. `src/components/wizard/Steps.tsx`에 컴포넌트 추가
```tsx
export const NewStep: React.FC = () => {
  // ...
};
```

2. `src/store/wizardStore.ts`에 스텝 순서 추가
```typescript
const STEP_ORDER = [
  // ...
  'new_step',  // 추가
  // ...
];
```

---

## 🧪 테스트

### 수동 테스트 체크리스트

```
□ 일반주택 매매 시나리오
  - 장기보유특별공제 계산 확인
  - 누진세율 적용 확인

□ 고가주택 (12억 초과) 시나리오
  - 비과세/과세 분리 계산 확인
  - 거주기간 공제 적용 확인

□ 비사업용 토지 시나리오
  - +10%p 중과세율 적용 확인
  - 비사토예외 체크 확인

□ 부담부증여 시나리오
  - 시가 선택 → 기존 로직
  - 보충적평가 선택 → 기준시가 강제

□ 이월과세 시나리오
  - 당초 취득원인 분기 확인
  - 증여세 필요경비 산입 확인
```

### 계산 검증

```javascript
// 브라우저 콘솔에서 상태 확인
const store = JSON.parse(localStorage.getItem('capital-gain-wizard'));
console.log('Transaction:', store.state.transaction);
console.log('Result:', store.state.result);
```

---

## 🚀 빌드 & 배포

### 개발 빌드

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### Standalone HTML 생성

```bash
# 빌드 후 combine.js 실행
npm run build
node ../combine.js
```

`smart-capital-gain-wizard-standalone.html` 파일이 생성됩니다.

### 배포 체크리스트

```
□ npm run build 성공
□ TypeScript 에러 없음
□ Standalone HTML 정상 동작
□ CHANGELOG.md 업데이트
□ AGENT.md 버전 업데이트
```

---

## 🐛 디버깅 팁

### 상태 확인

```javascript
// Zustand 상태 직접 접근
window.__ZUSTAND_STORE__ = useWizardStore.getState();
```

### 계산 로직 디버깅

```typescript
// calculators/index.ts에서
console.log('Input:', { transaction });
console.log('Intermediate:', { taxableGain, deduction });
console.log('Output:', { result });
```

### 흔한 이슈

| 증상 | 원인 | 해결 |
|------|------|------|
| 취득가액 0원 | `acquisitionPriceMethod` 불일치 | 메서드와 입력값 매칭 확인 |
| 장특공 미적용 | 보유기간 < 3년 | 취득일/양도일 확인 |
| 세율 불일치 | 중과 조건 해당 | `isHeavyTaxed` 플래그 확인 |
| 결과 미표시 | `calculate()` 미호출 | 스텝 이동 로직 확인 |

---

## 📚 참고 자료

### 세법 참조
- [국세청 홈택스](https://www.hometax.go.kr)
- [국세법령정보시스템](https://taxlaw.nts.go.kr)
- [소득세법](https://law.go.kr/법령/소득세법)

### 기술 문서
- [React 공식 문서](https://react.dev)
- [Zustand 문서](https://docs.pmnd.rs/zustand)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Vite 문서](https://vitejs.dev)

---

## ❓ FAQ

**Q: 왜 Standalone HTML로 배포하나요?**
> 인터넷 연결 없이도 사용 가능하고, 서버 비용 없이 배포할 수 있습니다.

**Q: 세율이 변경되면 어떻게 하나요?**
> `constants/index.ts`만 수정하면 됩니다. 계산 로직은 상수를 참조합니다.

**Q: 왜 Redux 대신 Zustand를 사용하나요?**
> 보일러플레이트가 적고, localStorage 연동이 간편합니다.

---

*최종 업데이트: 2024-12-15*
