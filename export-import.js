/**
 * export-import.js — 진로탐구 성장 플랫폼 v5
 * 규 · gyu-platform-v8
 *
 * JSON/CSV 가져오기·내보내기 헬퍼 (canonical 정의)
 * index.html 안에 동일 함수를 정의하지 않도록 한다. (v5 중복 제거)
 */
(function(global) {
  'use strict';

  /* ── 파일 다운로드 ── */
  function downloadText(content, filename) {
    var blob = new Blob([content], { type: 'application/octet-stream' });
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 300);
  }

  /* ── JSON 파일 불러오기 이벤트 바인딩 ── */
  function bindImportHandler(inputId, onSuccess, onError) {
    inputId    = inputId    || 'file-import-student';
    onSuccess  = onSuccess  || function(result) {
      if (typeof renderStudentList === 'function') renderStudentList();
      if (typeof showToast === 'function') {
        if (result.type === 'store_v5')
          showToast('전체 데이터를 복원했습니다. (' + result.count + '명)');
        else
          showToast('학생 데이터를 불러왔습니다.');
      }
    };
    onError = onError || function(msg) {
      if (typeof showToast === 'function') showToast(msg, 'warn');
    };

    var input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('change', function(e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var isJson = file.type === 'application/json' || /\.json$/i.test(file.name || '');
      if (!isJson) { onError('JSON 파일만 불러올 수 있습니다.'); return; }

      var reader = new FileReader();
      reader.onload = function(ev) {
        var cp = typeof CareerPlatform !== 'undefined' ? CareerPlatform : null;
        if (!cp) { onError('CareerPlatform 미로드'); return; }
        var result = cp.importFromJSON(ev.target.result);
        if (!result) { onError('파일 형식이 올바르지 않습니다.'); return; }
        onSuccess(result);
      };
      reader.readAsText(file);
      input.value = '';
    });
  }

  /* ── CSV 학생 명단 불러오기 ── */
  function bindCsvImportHandler(inputId, onSuccess, onError) {
    inputId   = inputId   || 'file-import-csv';
    onSuccess = onSuccess || function(count) {
      if (typeof renderStudentList === 'function') renderStudentList();
      if (typeof showToast === 'function') showToast(count + '명 학생을 추가했습니다.');
    };
    onError = onError || function(msg) {
      if (typeof showToast === 'function') showToast(msg, 'warn');
    };

    var input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('change', function(e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var isCsv = file.type === 'text/csv' || /\.csv$/i.test(file.name || '');
      if (!isCsv) { onError('CSV 파일만 불러올 수 있습니다.'); return; }

      var reader = new FileReader();
      reader.onload = function(ev) {
        var cp = typeof CareerPlatform !== 'undefined' ? CareerPlatform : null;
        if (!cp) { onError('CareerPlatform 미로드'); return; }
        var count = cp.importStudentsFromCSV(ev.target.result);
        if (count < 1) { onError('추가된 학생이 없습니다. CSV 형식을 확인하세요.'); return; }
        onSuccess(count);
      };
      reader.readAsText(file, 'utf-8');
      input.value = '';
    });
  }

  global.PlatformIO = { downloadText, bindImportHandler, bindCsvImportHandler };

})(window);
