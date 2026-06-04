/**
 * roadmap-bridge.js — 진로탐구 성장 플랫폼 v6
 * 규 · gyu-platform-v6
 *
 * roadmap.html 플랫폼 연동 함수 모음
 * v6에서 문서화 목적으로 분리 (참조 파일)
 *
 * 포함 함수:
 *   _renderGYUInquirySummary()        학생 생성 탐구 요약 섹션
 *   _buildInquiryPromptSection()      AI 프롬프트 연동 빌더
 *   loadInquiryBannerFromPlatform()   상단 배너 렌더링
 *   injectPlatformCollabQuickPanel()  협조시트 퀵패널
 *
 * v7 계획: roadmap.html 내 해당 함수 제거 후 이 파일을 script src로 교체
 * ※ v6 현재는 roadmap.html 내에 동일 코드가 유지됩니다.
 */

function _renderGYUInquirySummary() {
  try {
    if (typeof CareerPlatform === 'undefined') return;
    var s   = CareerPlatform.loadState();
    var kw  = s.keyword  || {};
    var iq  = s.inquiry  || {};
    var st  = s.student  || {};
    var esc = CareerPlatform.escapeHtml;
    var hasData = kw.department || iq.title || iq.selectedQuestion;
    var panel   = document.getElementById('gyu-inquiry-summary');
    var grid    = document.getElementById('gyu-inq-grid');
    if (!panel || !grid) return;
    if (!hasData) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    var rows = [
      ['학생', [st.name, st.grade&&st.grade+'학년', st.className&&st.className+'반'].filter(Boolean).join(' ')],
      ['희망 학과', kw.department || ''],
      ['핵심 키워드', (kw.keywords||[]).filter(Boolean).join(', ')],
      ['탐구 주제', iq.title || ''],
      ['선택 질문', iq.selectedQuestion || ''],
      ['탐구 방법', iq.method || ''],
      ['산출물', iq.outputFormat || ''],
      ['학생부 기록 근거', iq.expectedEvidence || ''],
    ];
    grid.innerHTML = rows.filter(function(r){ return r[1]; }).map(function(r){
      return '<div style="background:rgba(255,255,255,.7);border-radius:8px;padding:8px 12px">'
        + '<div style="font-size:11px;font-weight:800;color:#64748b;margin-bottom:2px">' + esc(r[0]) + '</div>'
        + '<div style="font-size:13px;color:#1e293b">' + esc(r[1]) + '</div>'
        + '</div>';
    }).join('');
  } catch(e) { console.warn('[gyu] 탐구 요약 렌더링 오류:', e); }
}

/* ─────────────────────────────────────────── */

function _buildInquiryPromptSection() {
  try {
    if (typeof CareerPlatform === 'undefined') return '';
    if (typeof CareerPlatform.buildInquiryPromptContext === 'function') {
      const ctx = CareerPlatform.buildInquiryPromptContext();
      if (ctx) return '\n' + ctx + '\n';
    }
    const s = CareerPlatform.loadState();
    const kw = s.keyword;
    const iq = s.inquiry;
    const hasKeyword  = kw.department || (kw.keywords && kw.keywords.length > 0);
    const hasInquiry  = iq.title || iq.selectedQuestion;
    if (!hasKeyword && !hasInquiry) return '';

    const lines = [
      '',
      '━━━━━━━━━━━━━━━━━━━━━',
      '【학생 탐구 설계 데이터 (탐구 질문 생성기 연동)】',
      '━━━━━━━━━━━━━━━━━━━━━',
      '아래는 학생이 탐구 질문 생성기에서 작성한 탐구 설계 내용입니다.',
      '추천 활동 및 세특 전략 수립 시 반드시 반영하세요.',
      ''
    ];
    if (kw.track)       lines.push(`- 관심 계열: ${kw.track}`);
    if (kw.department)  lines.push(`- 희망 학과: ${kw.department}`);
    if (kw.keywords && kw.keywords.length > 0)
      lines.push(`- 핵심 키워드: ${kw.keywords.join(', ')}`);
    if (kw.questions && kw.questions.filter(q => q && q.trim()).length > 0) {
      lines.push('- 탐구 질문:');
      kw.questions.filter(q => q && q.trim()).forEach((q, i) => {
        lines.push(`  Q${i + 1}. ${q.trim()}`);
      });
    }
    if (hasInquiry) {
      lines.push('');
      if (iq.title)            lines.push(`- 탐구 주제: ${iq.title}`);
      if (iq.selectedQuestion) lines.push(`- 선택 질문: ${iq.selectedQuestion}`);
      if (iq.motive)           lines.push(`- 탐구 동기: ${iq.motive}`);
      if (iq.method)           lines.push(`- 탐구 방법: ${iq.method}`);
      if (iq.outputFormat)     lines.push(`- 산출 형태: ${iq.outputFormat}`);
      if (iq.expectedEvidence) lines.push(`- 학생부 기록 근거: ${iq.expectedEvidence}`);
      if (iq.reflection)       lines.push(`- 자기 성찰: ${iq.reflection}`);
      if (iq.nextQuestion)     lines.push(`- 후속 질문: ${iq.nextQuestion}`);
    }
    lines.push('');
    return lines.join('\n');
  } catch (e) {
    console.warn('[STEP06] _buildInquiryPromptSection 오류:', e);
    return '';
  }
}

/* ─────────────────────────────────────────── */

function loadInquiryBannerFromPlatform() {
  try {
    if (typeof CareerPlatform === 'undefined') return;
    const s  = CareerPlatform.loadState();
    const kw = s.keyword;
    const iq = s.inquiry;
    const hasKeyword = kw.department || (kw.keywords && kw.keywords.length > 0);
    const hasInquiry = iq.title || iq.selectedQuestion;
    if (!hasKeyword && !hasInquiry) return;

    const grid = document.getElementById('cp-banner-grid');
    if (!grid) return;

    /* 규 · v6: row() 내 escapeHtml 적용 — XSS 차단 */
    const _esc6 = (typeof CareerPlatform !== 'undefined' && CareerPlatform.escapeHtml)
      ? CareerPlatform.escapeHtml
      : v => String(v==null?'':v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c]);

    const row = (label, val) => {
      if (!val || (Array.isArray(val) && val.length === 0)) return '';
      const dispVal = Array.isArray(val)
        ? val.map(v => `<span class="cp-banner-kw">${_esc6(v)}</span>`).join('')
        : `<span class="cp-banner-val">${_esc6(val)}</span>`;
      return `<span class="cp-banner-label">${_esc6(label)}</span>${dispVal}`;
    };

    let html = '';
    if (kw.track || kw.department) {
      const dept = [kw.track, kw.department].filter(Boolean).join(' › ');
      html += row('학과', dept);
    }
    if (kw.keywords && kw.keywords.length > 0)
      html += row('키워드', kw.keywords);
    if (kw.questions) {
      const qs = kw.questions.filter(q => q && q.trim());
      if (qs.length > 0)
        html += row('탐구질문', qs[0].trim() + (qs.length > 1 ? ` 외 ${qs.length - 1}건` : ''));
    }
    if (iq.title)
      html += row('탐구주제', iq.title);
    if (iq.method)
      html += row('탐구방법', iq.method);
    if (iq.outputFormat)
      html += row('산출형태', iq.outputFormat);
    if (iq.expectedEvidence)
      html += row('기록근거', iq.expectedEvidence);

    if (!html) return;
    grid.innerHTML = html;
    const banner = document.getElementById('cp-inquiry-banner');
    if (banner) banner.style.display = 'block';
  } catch (e) {
    console.warn('[STEP06] loadInquiryBannerFromPlatform 오류:', e);
  }
}



/**
 * v3: roadmap 화면에서도 플랫폼 연동 교과교사 협조 시트를 바로 복사/저장할 수 있게 한다.
 */
function injectPlatformCollabQuickPanel() {
  try {
    if (typeof CareerPlatform === 'undefined' || !CareerPlatform.buildTeacherCollabSheetText) return;
    const text = CareerPlatform.buildTeacherCollabSheetText();
    if (!text || text.replace(/\s/g, '').length < 30) return;
    const box = document.createElement('div');
    box.id = 'cp-collab-quick-panel';
    box.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:9999;background:#fff;border:1px solid #dbe3f0;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.16);padding:12px;max-width:300px;font-family:inherit';
    box.innerHTML = '<div style="font-size:12px;font-weight:800;color:#0f1f3d;margin-bottom:8px">🧾 플랫폼 협조 시트</div>' +
      '<div style="font-size:11px;color:#667085;line-height:1.5;margin-bottom:10px">저장된 탐구 설계 데이터를 교과교사 협조 시트로 바로 활용합니다.</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button onclick="copyPlatformCollabSheet()" style="border:none;background:#16a394;color:#fff;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700">복사</button>' +
      '<button onclick="downloadPlatformCollabSheet()" style="border:1px solid #dbe3f0;background:#f8fafc;color:#334155;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700">HTML 저장</button>' +
      '<button onclick="this.closest(\'#cp-collab-quick-panel\').remove()" style="border:1px solid #dbe3f0;background:#fff;color:#64748b;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700">닫기</button>' +
      '</div>';
    document.body.appendChild(box);
  } catch(e) { console.warn('[v3] injectPlatformCollabQuickPanel 오류:', e); }
}

/* ─────────────────────────────────────────── */

function injectPlatformCollabQuickPanel() {
  try {
    if (typeof CareerPlatform === 'undefined' || !CareerPlatform.buildTeacherCollabSheetText) return;
    const text = CareerPlatform.buildTeacherCollabSheetText();
    if (!text || text.replace(/\s/g, '').length < 30) return;
    const box = document.createElement('div');
    box.id = 'cp-collab-quick-panel';
    box.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:9999;background:#fff;border:1px solid #dbe3f0;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.16);padding:12px;max-width:300px;font-family:inherit';
    box.innerHTML = '<div style="font-size:12px;font-weight:800;color:#0f1f3d;margin-bottom:8px">🧾 플랫폼 협조 시트</div>' +
      '<div style="font-size:11px;color:#667085;line-height:1.5;margin-bottom:10px">저장된 탐구 설계 데이터를 교과교사 협조 시트로 바로 활용합니다.</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button onclick="copyPlatformCollabSheet()" style="border:none;background:#16a394;color:#fff;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700">복사</button>' +
      '<button onclick="downloadPlatformCollabSheet()" style="border:1px solid #dbe3f0;background:#f8fafc;color:#334155;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700">HTML 저장</button>' +
      '<button onclick="this.closest(\'#cp-collab-quick-panel\').remove()" style="border:1px solid #dbe3f0;background:#fff;color:#64748b;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700">닫기</button>' +
      '</div>';
    document.body.appendChild(box);
  } catch(e) { console.warn('[v3] injectPlatformCollabQuickPanel 오류:', e); }
}