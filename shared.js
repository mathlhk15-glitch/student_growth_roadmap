/**
 * shared.js — 진로탐구 성장 플랫폼 v5
 * 규 · gyu-platform-v5
 *
 * 변경 이력
 *  v1.x (v3)  단일 학생 구조
 *  v2.0 (v4)  다중 학생 구조 (단일 localStorage 키)
 *  v2.1 (v5)
 *  v2.2 (v6)  CSV 따옴표 파서 / inquiry·roadmap innerHTML escape 완성  학생별 분리 키 · XSS 차단 · userMode 구조 정리
 *             aiResultRaw 용량 제한 · 교과별 협조시트 분기
 *             저장 실패 감지 · 마이그레이션 v3→v4→v5
 */
(function (global) {
  'use strict';

  /* ─────────────────────────────────────
   * 1. 키 스키마 (v5: 학생별 분리)
   *
   *  careerPlatform_v5_meta
   *    → { version, currentStudentId, studentIds[], userMode, updatedAt }
   *
   *  careerPlatform_v5_student_{id}
   *    → StudentRecord
   * ───────────────────────────────────── */
  const KEY_META    = 'careerPlatform_v5_meta';
  const KEY_PREFIX  = 'careerPlatform_v5_student_';
  // 마이그레이션 소스 키
  const LEGACY_V4   = 'careerPlatform_v4';
  const LEGACY_V3   = 'cwKyeongilCareerPlatform_v1';

  // 저장 실패 콜백 등록 (외부에서 onSaveError 교체 가능)
  var _onSaveError = null;

  /* ─────────────────────────────────────
   * 2. 기본 스키마
   * ───────────────────────────────────── */
  function makeDefaultRecord() {
    return {
      meta: { createdAt: '', updatedAt: '' },
      student: {
        name: '', grade: '', className: '',
        number: '', careerInterest: '', memo: ''
      },
      keyword: {
        track: '', department: '',
        keywords: [], questions: ['', '', '']
      },
      inquiry: {
        title: '', selectedQuestion: '', motive: '',
        relatedSubjects: [], relatedConcepts: [],
        method: '', materials: '', outputFormat: '',
        expectedEvidence: '', reflection: '', nextQuestion: ''
      },
      roadmap: {
        studentRecordText: '',
        selectedUniversities: [],
        aiPrompt: '',
        aiResultRaw: '',      // 저장 시 50KB 초과하면 자동 truncate
        aiResultParsed: null
      },
      teacher: {
        observationPoint: '',
        seTeukDirection: '',
        collaborationNote: '',
        parentCounselingNote: '',
        collaborationSheetText: '',
        collaborationSheetHtml: ''
      }
    };
  }

  function makeDefaultMeta() {
    return {
      version: '2.2.0',
      currentStudentId: null,
      studentIds: [],
      userMode: 'teacher',   // 'teacher' | 'student'  ← store 레벨 (v5 수정)
      updatedAt: ''
    };
  }

  /* ─────────────────────────────────────
   * 3. 유틸
   * ───────────────────────────────────── */
  function _now() { return new Date().toISOString(); }
  function _id()  { return 'st_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6); }
  function _clone(o) { return JSON.parse(JSON.stringify(o)); }

  /** 재귀 안전 병합 */
  function _merge(defaults, saved) {
    if (!saved || typeof saved !== 'object') return _clone(defaults);
    var r = _clone(defaults);
    for (var k in r) {
      if (!(k in saved)) continue;
      var dv = r[k], sv = saved[k];
      if (dv && typeof dv === 'object' && !Array.isArray(dv)
          && sv && typeof sv === 'object' && !Array.isArray(sv)) {
        r[k] = _merge(dv, sv);
      } else { r[k] = sv; }
    }
    return r;
  }

  /** XSS 차단 escape — index.html / 배너 HTML 삽입 시 사용 */
  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[ch];
    });
  }

  /** localStorage 저장 (실패 감지 포함) */
  function _lsSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('[shared.js] localStorage 저장 실패:', key, e);
      if (typeof _onSaveError === 'function') _onSaveError(key, e);
      return false;
    }
  }

  /** aiResultRaw 용량 제한 (50KB 초과 시 truncate) */
  var AI_RAW_LIMIT = 50 * 1024; // 50KB
  function _trimRecord(rec) {
    var r = _clone(rec);
    if (r.roadmap && r.roadmap.aiResultRaw) {
      var raw = r.roadmap.aiResultRaw;
      if (typeof raw === 'string' && raw.length > AI_RAW_LIMIT) {
        r.roadmap.aiResultRaw = raw.slice(0, AI_RAW_LIMIT) + '\n…(저장 용량 초과로 일부 생략)';
      }
    }
    return r;
  }

  /* ─────────────────────────────────────
   * 4. 메타 로드 / 저장
   * ───────────────────────────────────── */
  function _loadMeta() {
    try {
      var raw = localStorage.getItem(KEY_META);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.studentIds)) {
          return Object.assign(makeDefaultMeta(), parsed);
        }
      }
    } catch(e) {}
    return _migrateLegacy();
  }

  function _saveMeta(meta) {
    meta.updatedAt = _now();
    return _lsSet(KEY_META, JSON.stringify(meta));
  }

  /* ─────────────────────────────────────
   * 5. 학생 레코드 로드 / 저장
   * ───────────────────────────────────── */
  function _loadRecord(id) {
    try {
      var raw = localStorage.getItem(KEY_PREFIX + id);
      if (raw) {
        var parsed = JSON.parse(raw);
        return _merge(makeDefaultRecord(), parsed);
      }
    } catch(e) {}
    return makeDefaultRecord();
  }

  function _saveRecord(id, record) {
    record.meta.updatedAt = _now();
    var trimmed = _trimRecord(record);
    return _lsSet(KEY_PREFIX + id, JSON.stringify(trimmed));
  }

  /* ─────────────────────────────────────
   * 6. 마이그레이션 (v3/v4 → v5)
   * ───────────────────────────────────── */
  function _migrateLegacy() {
    var meta = makeDefaultMeta();

    // v4 → v5
    try {
      var v4raw = localStorage.getItem(LEGACY_V4);
      if (v4raw) {
        var v4 = JSON.parse(v4raw);
        if (v4 && v4.students) {
          Object.entries(v4.students).forEach(function(entry) {
            var oldId = entry[0], oldRec = entry[1];
            var newId = _id();
            var rec = _merge(makeDefaultRecord(), oldRec);
            rec.meta.createdAt = rec.meta.createdAt || _now();
            _saveRecord(newId, rec);
            meta.studentIds.push(newId);
            if (v4.currentStudentId === oldId) meta.currentStudentId = newId;
          });
          if (!meta.currentStudentId && meta.studentIds.length) {
            meta.currentStudentId = meta.studentIds[0];
          }
          console.info('[shared.js] v4→v5 마이그레이션 완료:', meta.studentIds.length + '명');
          return meta;
        }
      }
    } catch(e) { console.warn('[shared.js] v4 마이그레이션 실패:', e); }

    // v3 → v5
    try {
      var v3raw = localStorage.getItem(LEGACY_V3);
      if (v3raw) {
        var v3 = JSON.parse(v3raw);
        if (v3 && v3.student) {
          var newId = _id();
          var rec = _merge(makeDefaultRecord(), v3);
          rec.meta.createdAt = _now();
          _saveRecord(newId, rec);
          meta.studentIds = [newId];
          meta.currentStudentId = newId;
          console.info('[shared.js] v3→v5 마이그레이션 완료');
          return meta;
        }
      }
    } catch(e) { console.warn('[shared.js] v3 마이그레이션 실패:', e); }

    return meta;
  }

  /* ─────────────────────────────────────
   * 7. localStorage 사용량 추정
   * ───────────────────────────────────── */
  function getStorageStats() {
    var total = 0;
    var detail = [];
    try {
      for (var k in localStorage) {
        if (!localStorage.hasOwnProperty(k)) continue;
        var v = localStorage.getItem(k) || '';
        var bytes = (k.length + v.length) * 2; // UTF-16 근사
        total += bytes;
        if (k.startsWith('careerPlatform_v5')) detail.push({ key: k, bytes: bytes });
      }
    } catch(e) {}
    return {
      totalBytes: total,
      platformBytes: detail.reduce(function(s, d){ return s + d.bytes; }, 0),
      detail: detail,
      warningThreshold: 4 * 1024 * 1024, // 4MB
      dangerThreshold:  4.5 * 1024 * 1024 // 4.5MB
    };
  }

  /* ─────────────────────────────────────
   * 8. 학생 관리 API (v5)
   * ───────────────────────────────────── */
  function getStudentList() {
    var meta = _loadMeta();
    return meta.studentIds.map(function(id) {
      var rec = _loadRecord(id);
      return {
        id: id,
        name:           rec.student.name           || '(이름 없음)',
        grade:          rec.student.grade          || '',
        className:      rec.student.className      || '',
        number:         rec.student.number         || '',
        careerInterest: rec.student.careerInterest || '',
        department:     rec.keyword.department     || '',
        inquiryTitle:   rec.inquiry.title          || '',
        updatedAt:      rec.meta.updatedAt         || ''
      };
    });
  }

  function getCurrentStudentId() {
    var meta = _loadMeta();
    if (meta.currentStudentId && meta.studentIds.indexOf(meta.currentStudentId) !== -1) {
      return meta.currentStudentId;
    }
    return meta.studentIds.length ? meta.studentIds[0] : null;
  }

  function setCurrentStudent(id) {
    var meta = _loadMeta();
    if (meta.studentIds.indexOf(id) === -1) return false;
    meta.currentStudentId = id;
    return _saveMeta(meta);
  }

  function createStudent(nameHint) {
    var meta = _loadMeta();
    var id   = _id();
    var rec  = makeDefaultRecord();
    rec.meta.createdAt = _now();
    rec.meta.updatedAt = _now();
    if (nameHint) rec.student.name = nameHint;
    _saveRecord(id, rec);
    meta.studentIds.push(id);
    meta.currentStudentId = id;
    _saveMeta(meta);
    return id;
  }

  function deleteStudent(id) {
    var meta = _loadMeta();
    var idx  = meta.studentIds.indexOf(id);
    if (idx === -1) return false;
    meta.studentIds.splice(idx, 1);
    try { localStorage.removeItem(KEY_PREFIX + id); } catch(e) {}
    if (meta.currentStudentId === id) {
      meta.currentStudentId = meta.studentIds.length ? meta.studentIds[0] : null;
    }
    return _saveMeta(meta);
  }

  function duplicateStudent(id) {
    var meta = _loadMeta();
    if (meta.studentIds.indexOf(id) === -1) return null;
    var src   = _loadRecord(id);
    var newId = _id();
    var rec   = _clone(src);
    rec.meta.createdAt = _now();
    rec.meta.updatedAt = _now();
    rec.student.name   = (rec.student.name || '') + ' (복사)';
    _saveRecord(newId, rec);
    meta.studentIds.push(newId);
    meta.currentStudentId = newId;
    _saveMeta(meta);
    return newId;
  }

  /**
   * CSV 학생 명단 일괄 등록
   * 규 · v6: 따옴표 필드("전자공학, 반도체") 처리 CSV 파서로 보강
   *
   * 지원 형식 (헤더 필수):
   *   학년,반,번호,이름,희망진로
   *   1,3,12,김민준,전자공학
   *   1,3,13,"이서연","간호학, 의예"
   *
   * ※ 주의: 각 칸에 쉼표가 있을 경우 반드시 큰따옴표로 감싸세요.
   *   예) 희망진로에 "전자공학, 반도체" 처럼 쓰세요.
   */
  function _parseCSVLine(line) {
    var result = [];
    var cur    = '';
    var inQ    = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; } // 이중 따옴표 이스케이프
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  function importStudentsFromCSV(csvText) {
    var lines  = csvText.trim().split(/\r?\n/);
    var header = _parseCSVLine(lines[0]);
    var added  = 0;
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var cols = _parseCSVLine(line);
      if (!cols.join('').trim()) continue;
      var obj = {};
      header.forEach(function(h, idx){ obj[h.trim()] = (cols[idx] || '').trim(); });
      var name = obj['이름'] || obj['name'] || '';
      if (!name) continue; // 이름 없는 행 건너뜀
      var id  = createStudent(name);
      var rec = _loadRecord(id);
      rec.student.grade          = obj['학년'] || obj['grade']   || '';
      rec.student.className      = obj['반']   || obj['class']   || '';
      rec.student.number         = obj['번호'] || obj['number']  || '';
      rec.student.careerInterest = obj['희망진로'] || obj['career'] || '';
      _saveRecord(id, rec);
      added++;
    }
    return added;
  }

  /** JSON 내보내기 (단건) */
  function exportStudentJSON(id) {
    var meta = _loadMeta();
    if (meta.studentIds.indexOf(id) === -1) return null;
    var rec = _loadRecord(id);
    return JSON.stringify({ _type: 'student_record_v5', id: id, record: rec }, null, 2);
  }

  /** JSON 전체 내보내기 */
  function exportAllJSON() {
    var meta     = _loadMeta();
    var students = {};
    meta.studentIds.forEach(function(id) { students[id] = _loadRecord(id); });
    return JSON.stringify({ _type: 'store_v5', meta: meta, students: students }, null, 2);
  }

  /** JSON 가져오기 (v5/v4/v3 통합) */
  function importFromJSON(jsonStr) {
    try {
      var data = JSON.parse(jsonStr);
      var meta = _loadMeta();

      if (data._type === 'store_v5' && data.students) {
        // v5 전체 복원 — 기존 유지하고 merge
        Object.entries(data.students).forEach(function(entry) {
          var id = entry[0], rec = entry[1];
          var newId = _id();
          _saveRecord(newId, _merge(makeDefaultRecord(), rec));
          if (meta.studentIds.indexOf(newId) === -1) meta.studentIds.push(newId);
        });
        if (data.meta && data.meta.currentStudentId) {
          meta.currentStudentId = meta.studentIds[meta.studentIds.length - 1];
        }
        _saveMeta(meta);
        return { type: 'store_v5', count: Object.keys(data.students).length };
      }

      if (data._type === 'student_record_v5' && data.record) {
        var newId = _id();
        _saveRecord(newId, _merge(makeDefaultRecord(), data.record));
        if (meta.studentIds.indexOf(newId) === -1) meta.studentIds.push(newId);
        meta.currentStudentId = newId;
        _saveMeta(meta);
        return { type: 'student_v5', id: newId };
      }

      // v4 단건
      if (data._type === 'student_record_v4' && data.record) {
        var newId = _id();
        _saveRecord(newId, _merge(makeDefaultRecord(), data.record));
        meta.studentIds.push(newId);
        meta.currentStudentId = newId;
        _saveMeta(meta);
        return { type: 'student_v4_migrated', id: newId };
      }

      // v3/v4 flat
      if (data.student && data.keyword) {
        var newId = _id();
        _saveRecord(newId, _merge(makeDefaultRecord(), data));
        meta.studentIds.push(newId);
        meta.currentStudentId = newId;
        _saveMeta(meta);
        return { type: 'legacy_migrated', id: newId };
      }

      return null;
    } catch(e) {
      console.error('[shared.js] importFromJSON 오류:', e);
      return null;
    }
  }

  function clearAll() {
    try {
      var meta = _loadMeta();
      meta.studentIds.forEach(function(id) {
        localStorage.removeItem(KEY_PREFIX + id);
      });
      localStorage.removeItem(KEY_META);
      return true;
    } catch(e) { return false; }
  }

  /* ─────────────────────────────────────
   * 9. userMode (store 레벨 — v5 수정)
   * ───────────────────────────────────── */
  function setUserMode(mode) {
    if (mode !== 'student' && mode !== 'teacher') return false;
    var meta      = _loadMeta();
    meta.userMode = mode;
    return _saveMeta(meta);
  }

  function getUserMode() {
    return _loadMeta().userMode || 'teacher';
  }

  /* ─────────────────────────────────────
   * 10. 하위 호환 API (v3/v4 코드 호환)
   *     loadState / saveState / updateSection →
   *     현재 선택 학생의 레코드를 대상으로 동작
   * ───────────────────────────────────── */
  function loadState() {
    var id = getCurrentStudentId();
    if (!id) return makeDefaultRecord();
    return _clone(_loadRecord(id));
  }

  function saveState(record) {
    var id = getCurrentStudentId();
    if (!id) { id = createStudent(); }
    return _saveRecord(id, record);
  }

  function updateSection(section, data) {
    var id     = getCurrentStudentId();
    if (!id) { id = createStudent(); }
    var record = _loadRecord(id);
    if (!(section in record)) { console.warn('[shared.js] 알 수 없는 섹션:', section); return false; }
    if (record[section] && typeof record[section] === 'object' && !Array.isArray(record[section])) {
      record[section] = Object.assign({}, record[section], data);
    } else { record[section] = data; }
    return _saveRecord(id, record);
  }

  function getDefaultState() { return makeDefaultRecord(); }

  /* ─────────────────────────────────────
   * 11. 페이지 전환 헬퍼
   * ───────────────────────────────────── */
  function sendToInquiry(kwData) {
    updateSection('keyword', kwData);
    location.href = 'inquiry.html';
  }

  function sendToRoadmap(inquiryData) {
    updateSection('inquiry', inquiryData);
    location.href = 'roadmap.html';
  }

  function getInquirySummary() {
    var s = loadState();
    return {
      student:          s.student,
      track:            s.keyword.track,
      department:       s.keyword.department,
      keywords:         s.keyword.keywords,
      questions:        s.keyword.questions,
      inquiryTitle:     s.inquiry.title,
      selectedQuestion: s.inquiry.selectedQuestion,
      method:           s.inquiry.method,
      expectedEvidence: s.inquiry.expectedEvidence
    };
  }

  /* ─────────────────────────────────────
   * 12. 프롬프트 컨텍스트 빌더
   * ───────────────────────────────────── */
  function buildInquiryPromptContext() {
    var s  = loadState();
    var st = s.student  || {};
    var kw = s.keyword  || {};
    var iq = s.inquiry  || {};
    var hasKw  = kw.track || kw.department || (kw.keywords && kw.keywords.length);
    var hasIq  = iq.title || iq.selectedQuestion || iq.motive || iq.method || iq.expectedEvidence;
    if (!hasKw && !hasIq) return '';

    var L = [
      '━━━━━━━━━━━━━━━━━━━━━',
      '【플랫폼 연동 탐구 설계 데이터】',
      '━━━━━━━━━━━━━━━━━━━━━',
      '아래 내용은 학생이 직접 작성한 탐구 설계 데이터입니다. 추천 활동·세특 전략·면접 질문·교과교사 협조 시트에 반드시 반영하세요.',
      ''
    ];
    if (st.name) L.push('- 학생명: ' + st.name);
    if (st.grade || st.className || st.number) {
      L.push('- 학년/반/번호: ' + [st.grade && st.grade+'학년', st.className && st.className+'반', st.number && st.number+'번'].filter(Boolean).join(' '));
    }
    if (st.careerInterest) L.push('- 희망 진로: ' + st.careerInterest);
    if (kw.track)       L.push('- 관심 계열: ' + kw.track);
    if (kw.department)  L.push('- 희망 학과: ' + kw.department);
    if (kw.keywords && kw.keywords.length) L.push('- 핵심 키워드: ' + kw.keywords.filter(Boolean).join(', '));
    var qs = (kw.questions || []).filter(function(q){ return q && String(q).trim(); });
    if (qs.length) { L.push('- 학생 생성 질문:'); qs.forEach(function(q,i){ L.push('  Q'+(i+1)+'. '+String(q).trim()); }); }
    if (iq.title)            L.push('- 탐구 주제: ' + iq.title);
    if (iq.selectedQuestion) L.push('- 최종 선택 질문: ' + iq.selectedQuestion);
    if (iq.motive)           L.push('- 탐구 동기: ' + iq.motive);
    if (iq.relatedSubjects && iq.relatedSubjects.length) L.push('- 관련 교과: ' + iq.relatedSubjects.filter(Boolean).join(', '));
    if (iq.relatedConcepts && iq.relatedConcepts.length) L.push('- 관련 개념: ' + iq.relatedConcepts.filter(Boolean).join(', '));
    if (iq.method)           L.push('- 탐구 방법: ' + iq.method);
    if (iq.materials)        L.push('- 참고 자료: ' + iq.materials);
    if (iq.outputFormat)     L.push('- 산출물 형식: ' + iq.outputFormat);
    if (iq.expectedEvidence) L.push('- 학생부 기록 근거: ' + iq.expectedEvidence);
    if (iq.reflection)       L.push('- 성찰: ' + iq.reflection);
    if (iq.nextQuestion)     L.push('- 후속 질문: ' + iq.nextQuestion);
    return L.join('\n');
  }

  /* ─────────────────────────────────────
   * 13. 교과별 협조 시트 (v5 고도화)
   * ───────────────────────────────────── */
  var _SUBJECT_OBS = {
    '수학':     '자료를 함수·비율·통계·그래프 등 수학적 표현으로 변환하는 과정과 수학적 근거 제시 방식',
    '과학':     '가설 설정, 변인 통제, 자료 해석, 과학 개념 적용 및 오차 분석 과정',
    '생명과학': '생명 현상과 탐구 주제 연결, 실험 설계, 생명윤리 관점 포함 여부',
    '화학':     '화학 반응·구조·물성 개념 적용, 실험 결과 해석, 안전 수칙 인식',
    '물리학':   '물리 법칙·공식 적용, 실험 설계, 측정 오차 분석 및 결론 도출',
    '지구과학': '지구 환경 데이터 분석, 기후·환경 문제와 탐구 주제 연결',
    '사회':     '개인 사례를 사회 구조·제도·정책·공동체 관점으로 확장하는 과정',
    '역사':     '역사적 사례 비교 분석, 현재와의 연결, 비판적 해석 과정',
    '경제':     '경제 원리 적용, 통계 자료 해석, 정책적 시사점 도출 과정',
    '윤리':     '윤리적 딜레마 분석, 가치 판단 근거 제시, 토론 참여 과정',
    '국어':     '자료의 신뢰성 평가, 논거 구성, 표현 전략, 주장 구조화 과정',
    '영어':     '영문 자료 탐색, 핵심 정보 요약, 전문 용어 해석, 글로벌 사례 비교',
    '정보':     '알고리즘 설계, 코드 구현·디버깅, 데이터 분석, 컴퓨팅 사고 적용',
    '미술':     '탐구 주제의 시각화 방식, 표현 매체 선택 이유, 창작 과정 서술',
    '음악':     '주제와 감정 표현 연결, 음악적 구조 분석, 창작·연주·감상 과정',
    '체육':     '신체 활동과 탐구 개념 연결, 팀 협력, 전략적 사고 적용 과정'
  };

  function _getSubjectObs(subjects) {
    if (!subjects || !subjects.length) return null;
    var obs = [];
    subjects.forEach(function(sub) {
      var key = Object.keys(_SUBJECT_OBS).find(function(k){ return sub && sub.includes(k); });
      if (key) obs.push('[' + key + '] ' + _SUBJECT_OBS[key]);
    });
    return obs.length ? obs.join('\n') : null;
  }

  function buildTeacherCollabSheetText() {
    var s  = loadState();
    var st = s.student || {};
    var kw = s.keyword  || {};
    var iq = s.inquiry  || {};
    var te = s.teacher  || {};
    var L  = [];

    var label = [st.grade && st.grade+'학년', st.className && st.className+'반', st.number && st.number+'번'].filter(Boolean).join(' ');
    L.push('교과교사 협조 시트');
    L.push('────────────────────────────────');
    L.push('학생명: '         + (st.name          || ''));
    L.push('학년/반/번호: '   + label);
    L.push('희망/관심 진로: ' + (st.careerInterest || ''));
    L.push('희망 학과: '      + (kw.department     || ''));
    L.push('핵심 키워드: '    + (kw.keywords || []).filter(Boolean).join(', '));
    L.push('');
    L.push('[학생 생성 질문]');
    (kw.questions || []).filter(function(q){ return q && String(q).trim(); })
      .forEach(function(q, i){ L.push('Q'+(i+1)+'. '+String(q).trim()); });
    L.push('');
    L.push('[탐구 설계 요약]');
    L.push('탐구 주제: '       + (iq.title          || ''));
    L.push('선택 질문: '       + (iq.selectedQuestion || ''));
    L.push('탐구 동기: '       + (iq.motive          || ''));
    L.push('관련 교과: '       + (iq.relatedSubjects || []).filter(Boolean).join(', '));
    L.push('관련 개념: '       + (iq.relatedConcepts || []).filter(Boolean).join(', '));
    L.push('탐구 방법: '       + (iq.method          || ''));
    L.push('산출물: '          + (iq.outputFormat    || ''));
    L.push('학생부 기록 근거: '+ (iq.expectedEvidence || ''));
    L.push('성찰/후속 질문: '  + [iq.reflection, iq.nextQuestion].filter(Boolean).join(' / '));
    L.push('');
    // 교과별 맞춤 관찰 포인트 (v5 신규)
    var subjectObs = _getSubjectObs(iq.relatedSubjects || []);
    L.push('[교과별 관찰 포인트]');
    L.push(subjectObs || te.observationPoint ||
      '수업 중 질문 형성, 자료 수집·분석 방식, 교과 개념 적용, 피드백 반영, 산출물 완성도');
    L.push('');
    L.push('[세특 방향]');
    L.push(te.seTeukDirection ||
      '학생의 질문 형성 과정, 교과 개념 적용, 자료 기반 분석, 성찰과 후속 탐구로 이어지는 성장 흐름 중심 기록');
    L.push('');
    L.push('[교과교사 협조 요청]');
    L.push(te.collaborationNote ||
      '위 탐구 주제와 연결되는 수업·발표 장면에서 학생의 자료 분석, 개념 적용, 질문 심화 과정을 관찰해 주시면 학생부 기록 근거로 활용하겠습니다. 감사합니다.');
    return L.join('\n');
  }

  function buildTeacherCollabSheetHtml() {
    var text = buildTeacherCollabSheetText();
    var s    = loadState();
    var name = escapeHtml(s.student.name || '학생');
    return '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
      + '<title>교과교사 협조 시트 — ' + name + '</title>'
      + '<style>body{font-family:Apple SD Gothic Neo,Noto Sans KR,sans-serif;line-height:1.85;padding:40px;color:#1e293b;max-width:720px;margin:0 auto}'
      + 'h1{font-size:20px;font-weight:900;margin-bottom:6px}p.sub{color:#64748b;font-size:13px;margin-bottom:24px}'
      + '.box{border:1px solid #e2e8f0;border-radius:12px;padding:28px 32px;white-space:pre-wrap;font-size:14px;line-height:1.9;background:#f8fafc}'
      + '@media print{.box{border:none;padding:0}}</style>'
      + '</head><body>'
      + '<h1>📋 교과교사 협조 시트</h1>'
      + '<p class="sub">진로탐구 성장 플랫폼 · 자동 생성</p>'
      + '<div class="box">' + escapeHtml(text) + '</div>'
      + '</body></html>';
  }

  /* ─────────────────────────────────────
   * 14. 전역 노출
   *     gyu · 규
   * ───────────────────────────────────── */
  global.CareerPlatform = {
    /* 학생 관리 */
    getStudentList, getCurrentStudentId, setCurrentStudent,
    createStudent, deleteStudent, duplicateStudent,
    importStudentsFromCSV,
    /* 내보내기/가져오기 */
    exportStudentJSON, exportAllJSON, importFromJSON, clearAll,
    /* 설정 */
    setUserMode, getUserMode,
    /* 저장 실패 핸들러 등록 */
    onSaveError: function(fn) { _onSaveError = fn; },
    /* 스토리지 통계 */
    getStorageStats,
    /* 하위 호환 */
    loadState, saveState, updateSection, getDefaultState,
    sendToInquiry, sendToRoadmap, getInquirySummary,
    /* 빌더 */
    buildInquiryPromptContext,
    buildTeacherCollabSheetText,
    buildTeacherCollabSheetHtml,
    /* 유틸 (전역 노출) */
    escapeHtml,
    /* 내부 (테스트용) */
    _loadRecord, _saveRecord, _loadMeta, _merge
  };

})(window);
