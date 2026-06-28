// 회귀 가드: components/company/*.tsx 의 JSX 텍스트(따옴표·주석 밖)에
// 유니코드 이스케이프(역슬래시+u) 리터럴이 있으면 실패시킨다.
// (JSX 텍스트의 역슬래시u 는 한글로 변환되지 않고 그대로 깨져 출력되는 버그)
// 실행: node scripts/check-jsx-escapes.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BS = String.fromCharCode(92);   // 역슬래시 한 글자 (리터럴 회피)
const ESC = BS + 'u';                 // 역슬래시 + u
const NL = String.fromCharCode(10);
const dir = 'components/company';

// 한 줄 안의 /* ... */ 블록 주석 제거 (인덱스 기반, 정규식 회피)
function stripBlock(str) {
  let out = '', i = 0;
  while (i < str.length) {
    const open = str.indexOf('/*', i);
    if (open < 0) { out += str.slice(i); break; }
    out += str.slice(i, open);
    const close = str.indexOf('*/', open + 2);
    if (close < 0) break;            // 줄 끝까지 주석 → 나머지 버림
    i = close + 2;
  }
  return out;
}

let bad = 0;
for (const f of readdirSync(dir).filter(n => n.endsWith('.tsx'))) {
  const text = readFileSync(join(dir, f), 'utf8');
  text.split(NL).forEach((line, i) => {
    // 1) 따옴표/백틱 구간 제거 (홀수 인덱스 = 따옴표 안)
    let s = line
      .split("'").filter((_, k) => k % 2 === 0).join('')
      .split('"').filter((_, k) => k % 2 === 0).join('')
      .split('`').filter((_, k) => k % 2 === 0).join('');
    // 2) 라인 주석 + 블록 주석 제거
    s = s.split('//')[0];
    s = stripBlock(s);
    // 3) 남은 곳에 역슬래시u 가 있으면 JSX 텍스트 깨짐 위험
    if (s.includes(ESC)) {
      console.error('  [FAIL] ' + f + ':' + (i + 1) + '  ' + line.trim().slice(0, 70));
      bad++;
    }
  });
}

if (bad > 0) {
  console.error(NL + 'JSX 텍스트 유니코드 이스케이프 ' + bad + '건 발견 (한글 깨짐 위험)');
  process.exit(1);
} else {
  console.log('OK: company 컴포넌트 JSX 텍스트에 유니코드 이스케이프 리터럴 없음');
}
