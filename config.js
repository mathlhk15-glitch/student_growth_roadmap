/**
 * config.js — 진로탐구 성장 플랫폼 v8
 * 규 · gyu-platform-v8
 *
 * 학교명·앱명 등 커스터마이즈 설정.
 * 다른 학교 선생님에게 배포할 때는 이 파일만 수정하세요.
 *
 * showSchoolName: false → 범용판 (학교명 숨김)
 * showSchoolName: true  → 학교판 (schoolName 표시)
 */
var PLATFORM_CONFIG = (function() {
  'use strict';

  // ── 여기만 수정하세요 ──────────────────────
  var CONFIG = {
    appName:        '진로탐구 성장 플랫폼',
    subtitle:       '질문에서 학생부 성장까지',
    version:        'v8',
    schoolName:     '',          // 예: '○○고' — 비워두면 표시 안 함
    showSchoolName: false,       // true로 바꾸면 schoolName 표시
    authorTag:      'gyu'        // 규 · 내부 식별자
  };
  // ──────────────────────────────────────────

  /** 표시용 풀 타이틀 */
  CONFIG.getTitle = function() {
    return CONFIG.showSchoolName && CONFIG.schoolName
      ? CONFIG.schoolName + ' ' + CONFIG.appName
      : CONFIG.appName;
  };

  /** 페이지 <title> 적용 */
  CONFIG.applyToDocument = function() {
    if (document.title && CONFIG.showSchoolName && CONFIG.schoolName) {
      document.title = document.title.replace(CONFIG.appName, CONFIG.getTitle());
    }
    // 히어로 타이틀 업데이트 (존재 시)
    var el = document.getElementById('platform-title');
    if (el && CONFIG.showSchoolName && CONFIG.schoolName) {
      el.textContent = CONFIG.getTitle();
    }
  };

  return CONFIG;
})();
