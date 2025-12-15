# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- 비상장주식 양도소득세 계산 기능
- 해외주식 양도소득세 계산 기능
- 신고서 PDF 생성 기능

---

## [1.2.0] - 2024-12-15

### Added
- **부담부증여 평가방법 분기 로직**
  - 증여재산 평가방법 선택 UI (시가 / 보충적평가)
  - 보충적평가 선택 시 취득가액 = 기준시가 강제 적용
  - `giftEvalMethod` 필드 추가 (`AmountInfo` 인터페이스)
  - `isBurdenGiftOfficial` 플래그 기반 분기 처리

- **문서 체계 구축**
  - `AGENT.md` - AI 에이전트용 프로젝트 컨텍스트
  - `CHANGELOG.md` - 버전 변경 이력 (현재 파일)
  - `docs/ROADMAP.md` - 향후 개발 계획
  - `docs/DEV_GUIDE.md` - 개발 가이드

### Changed
- `getAcquisitionPriceMethodOptions()` 함수에 3-tier 분기 로직 추가
- `SCENARIO_MATRIX.md` SC-030 부담부증여 시나리오 업데이트

### Fixed
- `combine.js` 스크립트의 `$` 특수문자 처리 오류 수정
  - 함수형 교체로 변경하여 JavaScript 코드 인라인 시 정규표현식 치환 문제 해결

---

## [1.1.0] - 2024-12-14

### Added
- **이월과세 증여세 공제 기능**
  - 증여 시 납부한 증여세 필요경비 산입
  - `giftTaxPaid` 필드 추가

- **분기 로직 문서화**
  - `docs/BRANCH_LOGIC_SPEC.md` v1.2 - 5차원 분기 로직 명세
  - `docs/SCENARIO_MATRIX.md` - 54개 자산-취득 조합 시나리오

### Changed
- 취득원인 분기 로직 개선
  - 상속/증여: 실지취득가액 또는 기준시가
  - 매매/신축/경매: 실지취득가액 또는 환산취득가액
  - 이월과세: 당초 취득원인에 따른 동적 분기

---

## [1.0.0] - 2024-12-13

### Added
- **8가지 자산유형 지원**
  - 일반주택 (`general_house`)
  - 고가주택 (`high_price_house`) - 12억 초과
  - 토지 (`land`)
  - 농지 (`land_farm`)
  - 상가/오피스텔 (`commercial`)
  - 조합원입주권 (`membership_right`)
  - 분양권 (`presale_right`)
  - 미등기자산 (`unregistered`)

- **8단계 위자드 UI**
  1. 시작
  2. 신고유형 선택
  3. 납세자 정보
  4. 자산유형 선택
  5. 거래정보 입력
  6. 금액정보 입력
  7. 감면 적용
  8. 계산 결과

- **세금 계산 기능**
  - 2023년 개정 누진세율표 (6%~45%)
  - 장기보유특별공제 (표1, 표2)
  - 비사업용 토지 중과세 (+10%p)
  - 단기 양도 중과세 (50%, 70%)
  - 미등기 양도 중과세 (70%)

- **감면 기능**
  - 8년 자경농지 감면
  - 농지대토 감면
  - 공익사업 수용 감면
  - 직접입력 감면

- **가산세 계산**
  - 무신고 가산세 (20%)
  - 과소신고 가산세 (10%)
  - 납부지연 가산세 (일 0.022%)
  - 기한 경과에 따른 감면율 적용

- **분납 계산**
  - 1,000만원 초과 시 분납 안내
  - 2개월 후 2차 납부일 자동 계산

- **기술 구현**
  - React 18 + TypeScript
  - Zustand 상태관리 (localStorage 연동)
  - Tailwind CSS 스타일링
  - Vite 빌드
  - Standalone HTML 배포

---

## Version History Summary

| 버전 | 날짜 | 주요 변경사항 |
|------|------|---------------|
| 1.2.0 | 2024-12-15 | 부담부증여 평가방법 분기, 문서 체계 구축 |
| 1.1.0 | 2024-12-14 | 이월과세 증여세 공제, 분기 로직 문서화 |
| 1.0.0 | 2024-12-13 | 최초 릴리즈 - 부동산 양도소득세 계산기 |

---

## Migration Notes

### v1.1.0 → v1.2.0
- `AmountInfo` 인터페이스에 `giftEvalMethod?: 'market' | 'official'` 필드 추가
- 기존 데이터 호환: 필드 없으면 `'market'` 기본값 적용

### v1.0.0 → v1.1.0
- `AmountInfo` 인터페이스에 `giftTaxPaid?: number` 필드 추가
- 기존 데이터 호환: 필드 없으면 `0` 기본값 적용

---

*이 문서는 프로젝트 변경 시 업데이트됩니다.*
