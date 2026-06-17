// ─────────────────────────────────────────────
//  드롭다운 로직 담당
//  supabaseClient는 config.js에서 전역으로 정의됨
// ─────────────────────────────────────────────

/**
 * Supabase 테이블에서 value 컬럼을 읽어 <select> 요소를 채운다.
 * @param {string} tableName - Supabase 테이블 이름 ('size' | 'meter')
 * @param {string} selectId  - 대상 <select> 요소의 id
 * @returns {Promise<boolean>} 성공 여부
 */
async function loadDropdown(tableName, selectId) {
  const select = document.getElementById(selectId);

  const { data, error } = await supabaseClient
    .from(tableName)
    .select('value')
    .order('value', { ascending: true });

  if (error) {
    console.error(`[${tableName}] 로딩 실패:`, error.message);
    select.innerHTML = '<option value="">불러오기 실패</option>';
    return false;
  }

  select.innerHTML = '<option value="">선택하세요</option>';
  data.forEach(function(row) {
    const option = document.createElement('option');
    option.value = row.value;
    option.textContent = row.value;
    select.appendChild(option);
  });
  select.disabled = false;
  return true;
}

/**
 * 페이지 진입 시 두 드롭다운을 병렬로 로드한다.
 */
async function init() {
  const status = document.getElementById('status');
  status.textContent = '데이터 로딩 중...';
  status.className = 'status';

  const results = await Promise.all([
    loadDropdown('size',  'size-select'),
    loadDropdown('meter', 'meter-select'),
  ]);

  const allOk = results.every(function(r) { return r === true; });

  if (allOk) {
    status.textContent = '✓ Supabase 연결 성공';
    status.className = 'status success';
    setTimeout(function() { status.textContent = ''; }, 3000);
  } else {
    status.textContent = '연결 실패 — F12 콘솔에서 오류를 확인하세요';
    status.className = 'status error';
  }
}

document.addEventListener('DOMContentLoaded', init);
