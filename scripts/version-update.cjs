#!/usr/bin/env node
/**
 * version-update.js
 * 버전 업데이트 및 문서 자동 갱신 스크립트
 * 
 * 사용법:
 *   node scripts/version-update.js patch   # 1.2.0 -> 1.2.1
 *   node scripts/version-update.js minor   # 1.2.0 -> 1.3.0
 *   node scripts/version-update.js major   # 1.2.0 -> 2.0.0
 *   node scripts/version-update.js 1.5.0   # 직접 지정
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');
const AGENT_MD = path.join(ROOT_DIR, 'AGENT.md');
const README_MD = path.join(ROOT_DIR, 'README.md');
const CHANGELOG_MD = path.join(ROOT_DIR, 'CHANGELOG.md');

// 현재 날짜 포맷
function getToday() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// 버전 파싱
function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

// 버전 문자열 생성
function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

// 버전 증가
function bumpVersion(currentVersion, type) {
  const v = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      return formatVersion({ major: v.major + 1, minor: 0, patch: 0 });
    case 'minor':
      return formatVersion({ major: v.major, minor: v.minor + 1, patch: 0 });
    case 'patch':
      return formatVersion({ major: v.major, minor: v.minor, patch: v.patch + 1 });
    default:
      // 직접 지정된 버전
      if (/^\d+\.\d+\.\d+$/.test(type)) {
        return type;
      }
      throw new Error(`Invalid version type: ${type}`);
  }
}

// package.json 업데이트
function updatePackageJson(newVersion) {
  const content = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  const oldVersion = content.version;
  content.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(content, null, 2) + '\n');
  return oldVersion;
}

// AGENT.md 버전 업데이트
function updateAgentMd(newVersion) {
  let content = fs.readFileSync(AGENT_MD, 'utf-8');
  const today = getToday();
  
  // 버전 업데이트
  content = content.replace(
    /\| \*\*버전\*\* \| [\d.]+ \|/,
    `| **버전** | ${newVersion} |`
  );
  
  // 최종 업데이트 날짜
  content = content.replace(
    /\| \*\*최종 업데이트\*\* \| [\d-]+ \|/,
    `| **최종 업데이트** | ${today} |`
  );
  
  // 푸터 업데이트
  content = content.replace(
    /\*최종 수정: [\d-]+ \| 버전: [\d.]+\*/,
    `*최종 수정: ${today} | 버전: ${newVersion}*`
  );
  
  fs.writeFileSync(AGENT_MD, content);
}

// README.md 버전 배지 업데이트
function updateReadmeMd(newVersion) {
  let content = fs.readFileSync(README_MD, 'utf-8');
  
  // 버전 배지 업데이트
  content = content.replace(
    /version-[\d.]+-blue/,
    `version-${newVersion}-blue`
  );
  
  fs.writeFileSync(README_MD, content);
}

// CHANGELOG.md에 새 버전 섹션 추가
function updateChangelogMd(newVersion, oldVersion) {
  let content = fs.readFileSync(CHANGELOG_MD, 'utf-8');
  const today = getToday();
  
  // [Unreleased] 다음에 새 버전 섹션 추가
  const unreleasedSection = '## [Unreleased]';
  const newSection = `## [Unreleased]

### Planned
- (작성 필요)

---

## [${newVersion}] - ${today}

### Added
- (작성 필요)

### Changed
- (작성 필요)

### Fixed
- (작성 필요)

---

## [${oldVersion}]`;

  content = content.replace(
    new RegExp(`${unreleasedSection}[\\s\\S]*?---\\s*\\n\\s*## \\[${oldVersion.replace(/\./g, '\\.')}\\]`),
    newSection
  );
  
  // Version History Summary 테이블 업데이트
  const tableRow = `| ${newVersion} | ${today} | (설명 필요) |`;
  content = content.replace(
    /(\| 버전 \| 날짜 \| 주요 변경사항 \|\n\|------|------|---------------\|)\n/,
    `$1\n${tableRow}\n`
  );
  
  fs.writeFileSync(CHANGELOG_MD, content);
}

// 메인 실행
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/version-update.js [patch|minor|major|x.x.x]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/version-update.js patch   # 1.2.0 -> 1.2.1');
    console.log('  node scripts/version-update.js minor   # 1.2.0 -> 1.3.0');
    console.log('  node scripts/version-update.js major   # 1.2.0 -> 2.0.0');
    console.log('  node scripts/version-update.js 2.0.0   # 직접 지정');
    process.exit(1);
  }
  
  const versionType = args[0];
  
  try {
    // 현재 버전 읽기
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
    const currentVersion = packageJson.version;
    
    // 새 버전 계산
    const newVersion = bumpVersion(currentVersion, versionType);
    
    console.log(`📦 버전 업데이트: ${currentVersion} -> ${newVersion}`);
    console.log('');
    
    // 파일 업데이트
    console.log('📝 파일 업데이트 중...');
    
    const oldVersion = updatePackageJson(newVersion);
    console.log('  ✅ package.json');
    
    updateAgentMd(newVersion);
    console.log('  ✅ AGENT.md');
    
    updateReadmeMd(newVersion);
    console.log('  ✅ README.md');
    
    updateChangelogMd(newVersion, oldVersion);
    console.log('  ✅ CHANGELOG.md');
    
    console.log('');
    console.log('🎉 버전 업데이트 완료!');
    console.log('');
    console.log('📋 다음 단계:');
    console.log('  1. CHANGELOG.md에서 변경사항 상세 작성');
    console.log('  2. npm run build');
    console.log('  3. git add -A && git commit -m "chore: bump version to ' + newVersion + '"');
    console.log('  4. git tag v' + newVersion);
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

main();
