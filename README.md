# Smart Capital Gain Wizard 🏠💰

> **양도소득세 간편신고 도우미** - 부동산/주식 양도소득세 계산 및 신고서 작성 지원

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)

---

## 📖 소개

Smart Capital Gain Wizard는 복잡한 양도소득세 계산을 단계별 마법사(Wizard) 형태로 안내하여 누구나 쉽게 세금을 계산하고 신고서를 작성할 수 있도록 돕는 웹 애플리케이션입니다.

### 주요 특징

- 🏠 **8가지 자산유형 지원**: 주택, 토지, 농지, 상가, 분양권, 입주권 등
- 📊 **2023년 개정세법 적용**: 최신 누진세율 및 공제율 반영
- 🧮 **자동 계산**: 장기보유특별공제, 감면, 가산세 자동 계산
- 📱 **반응형 디자인**: PC/모바일 모두 지원
- 💾 **데이터 저장**: 브라우저 로컬 스토리지에 자동 저장
- 📦 **단일 파일 배포**: 인터넷 연결 없이 실행 가능

---

## 🚀 빠른 시작

### 방법 1: Standalone HTML (권장)

1. `smart-capital-gain-wizard-standalone.html` 파일 다운로드
2. 브라우저에서 파일 열기
3. 완료! 🎉

### 방법 2: 소스코드 빌드

```bash
# 저장소 클론
git clone [repository-url]
cd smart-capital-gain-wizard

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 📋 지원 기능

### 현재 지원 (v1.2.0)

| 기능 | 상태 | 설명 |
|------|------|------|
| 부동산 양도소득세 | ✅ 완료 | 주택, 토지, 상가 등 |
| 분양권/입주권 | ✅ 완료 | 단기세율 적용 |
| 장기보유특별공제 | ✅ 완료 | 일반/고가주택 구분 |
| 비사업용 토지 중과 | ✅ 완료 | +10%p 중과세율 |
| 부담부증여 | ✅ 완료 | 평가방법별 분기 |
| 이월과세 | ✅ 완료 | 당초 취득원인 추적 |
| 가산세 계산 | ✅ 완료 | 무신고/과소신고/납부지연 |
| 분납 계산 | ✅ 완료 | 1,000만원 초과 시 |

### 개발 예정

| 기능 | 상태 | 예정 버전 |
|------|------|------|
| 비상장주식 양도소득세 | 🔜 예정 | v2.0.0 |
| 해외주식 양도소득세 | 🔜 예정 | v2.0.0 |
| 신고서 PDF 생성 | 🔜 예정 | v2.1.0 |
| 다중 거래 합산 | 🔜 예정 | v2.2.0 |

---

## 🖥️ 화면 구성

```
┌─────────────────────────────────────────────────┐
│  Smart Capital Gain Wizard                      │
├─────────────────────────────────────────────────┤
│  [1] 시작 → [2] 신고유형 → [3] 납세자정보      │
│  → [4] 자산유형 → [5] 거래정보 → [6] 금액정보  │
│  → [7] 감면 → [8] 결과                         │
└─────────────────────────────────────────────────┘
```

---

## 📁 프로젝트 구조

```
smart-capital-gain-wizard/
├── src/
│   ├── domain/           # 비즈니스 로직
│   │   ├── models/       # 타입 정의
│   │   ├── constants/    # 세율표, 상수
│   │   └── calculators/  # 계산 로직
│   ├── store/            # 상태 관리 (Zustand)
│   └── components/       # React 컴포넌트
├── docs/                 # 문서
├── AGENT.md             # AI 에이전트 컨텍스트
├── CHANGELOG.md         # 변경 이력
└── README.md            # 프로젝트 소개
```

---

## 🛠️ 기술 스택

- **Frontend**: React 18.3 + TypeScript 5.0
- **상태관리**: Zustand 4.4
- **스타일링**: Tailwind CSS 3.4
- **빌드도구**: Vite 5.4
- **아이콘**: Lucide React

---

## 📚 문서

- [AGENT.md](AGENT.md) - AI 에이전트용 프로젝트 컨텍스트
- [CHANGELOG.md](CHANGELOG.md) - 버전별 변경 이력
- [docs/BRANCH_LOGIC_SPEC.md](docs/BRANCH_LOGIC_SPEC.md) - 분기 로직 명세
- [docs/SCENARIO_MATRIX.md](docs/SCENARIO_MATRIX.md) - 시나리오 매트릭스
- [docs/DEV_GUIDE.md](docs/DEV_GUIDE.md) - 개발 가이드

---

## ⚠️ 면책조항

이 프로그램은 참고용으로만 사용하시기 바랍니다. 실제 세금 신고 시에는 반드시 세무 전문가와 상담하시기 바랍니다. 계산 결과에 대한 법적 책임은 사용자에게 있습니다.

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포할 수 있습니다.

---

*Made with ❤️ for Korean taxpayers*
