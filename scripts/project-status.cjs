#!/usr/bin/env node
/**
 * project-status.js
 * 프로젝트 상태 보고서 생성 스크립트
 * 
 * 사용법:
 *   node scripts/project-status.js
 *   node scripts/project-status.js --json  # JSON 출력
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// 파일 라인 수 계산
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

// 디렉토리 내 파일 수집
function collectFiles(dir, ext, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
      collectFiles(fullPath, ext, files);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

// 파일 크기 포맷
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getProjectStatus() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
  
  // 소스 파일 통계
  const tsFiles = collectFiles(path.join(ROOT_DIR, 'src'), '.ts');
  const tsxFiles = collectFiles(path.join(ROOT_DIR, 'src'), '.tsx');
  const allSourceFiles = [...tsFiles, ...tsxFiles];
  
  let totalLines = 0;
  const fileStats = allSourceFiles.map(f => {
    const lines = countLines(f);
    totalLines += lines;
    return {
      path: path.relative(ROOT_DIR, f),
      lines
    };
  });
  
  // 빌드 파일 체크
  const standaloneHtml = path.join(ROOT_DIR, 'smart-capital-gain-wizard-standalone.html');
  const hasStandaloneHtml = fs.existsSync(standaloneHtml);
  const standaloneSize = hasStandaloneHtml ? fs.statSync(standaloneHtml).size : 0;
  
  // 문서 파일 체크
  const docs = [
    'AGENT.md',
    'README.md',
    'CHANGELOG.md',
    'docs/BRANCH_LOGIC_SPEC.md',
    'docs/SCENARIO_MATRIX.md',
    'docs/ROADMAP.md',
    'docs/DEV_GUIDE.md'
  ];
  
  const docStatus = docs.map(doc => ({
    name: doc,
    exists: fs.existsSync(path.join(ROOT_DIR, doc)),
    lines: countLines(path.join(ROOT_DIR, doc))
  }));
  
  return {
    project: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description
    },
    source: {
      totalFiles: allSourceFiles.length,
      totalLines,
      files: fileStats.sort((a, b) => b.lines - a.lines).slice(0, 10) // Top 10
    },
    build: {
      hasStandaloneHtml,
      standaloneSize: formatSize(standaloneSize)
    },
    docs: docStatus,
    timestamp: new Date().toISOString()
  };
}

function printReport(status) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           Smart Capital Gain Wizard - 프로젝트 상태          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  console.log('📦 프로젝트 정보');
  console.log('─'.repeat(50));
  console.log(`  이름: ${status.project.name}`);
  console.log(`  버전: ${status.project.version}`);
  console.log('');
  
  console.log('📄 소스 코드 통계');
  console.log('─'.repeat(50));
  console.log(`  총 파일 수: ${status.source.totalFiles}`);
  console.log(`  총 라인 수: ${status.source.totalLines.toLocaleString()}`);
  console.log('');
  console.log('  주요 파일 (Top 10):');
  status.source.files.forEach((f, i) => {
    console.log(`    ${i + 1}. ${f.path} (${f.lines.toLocaleString()} lines)`);
  });
  console.log('');
  
  console.log('🏗️ 빌드 상태');
  console.log('─'.repeat(50));
  console.log(`  Standalone HTML: ${status.build.hasStandaloneHtml ? '✅ 있음' : '❌ 없음'}`);
  if (status.build.hasStandaloneHtml) {
    console.log(`  파일 크기: ${status.build.standaloneSize}`);
  }
  console.log('');
  
  console.log('📚 문서 상태');
  console.log('─'.repeat(50));
  status.docs.forEach(doc => {
    const icon = doc.exists ? '✅' : '❌';
    const lines = doc.exists ? ` (${doc.lines} lines)` : '';
    console.log(`  ${icon} ${doc.name}${lines}`);
  });
  console.log('');
  
  console.log(`🕐 생성 시각: ${status.timestamp}`);
  console.log('');
}

// 메인 실행
const args = process.argv.slice(2);
const status = getProjectStatus();

if (args.includes('--json')) {
  console.log(JSON.stringify(status, null, 2));
} else {
  printReport(status);
}
