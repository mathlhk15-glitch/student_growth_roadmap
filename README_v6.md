# 진로탐구 성장 플랫폼 v6
> 규 · gyu-platform-v6

## v6 핵심 변경 (v5 비판 문서 반영)

### 1. 남은 innerHTML escape 완성 [1순위]
- **inquiry.html** `loadKeywordBannerFromPlatform()` —
  `kw.track / kw.department / kw.keywords / questions` 모두 `escapeHtml` 적용
- **roadmap.html** `loadInquiryBannerFromPlatform()` 내 `row()` 함수 —
  label·val 배열·문자열 전체 `_esc6()` 적용
- `_renderGYUInquirySummary()`는 v5에서 이미 적용됨 (유지)

### 2. index.html 학생 카드 이벤트 처리 구조 개선 [2순위]
- inline `onclick="confirmDel(...)"` → `data-id / data-name` 속성 + `addEventListener`
- `duplicateSt / exportSt / confirmDel` 모두 `e.stopPropagation()` 제거 (리스너에서 처리)
- 특수문자 이름('O\'Neil' 등)에서 이벤트 깨짐 문제 구조적 차단

### 3. showToast에서 불필요한 escapeHtml 제거 [추가]
- `showToast(t.textContent = msg)` 방식 → HTML 해석 없음
- `showToast(_e(name) + ...)` → `showToast(name + ...)` 로 수정
- `&lt;` 같은 entity가 토스트에 그대로 보이는 현상 해결

### 4. CSV 파서 보강 [3순위]
- 단순 `split(',')` → 따옴표 필드(`"전자공학, 반도체"`) 처리 파서로 교체
- 이중 따옴표 이스케이프(`""`) 지원
- 이름 없는 행 자동 건너뜀
- guide.html에 CSV 형식 안내 및 주의사항 추가

### 5. roadmap-bridge.js 분리 준비 [4순위]
- 플랫폼 연동 함수 4개를 `roadmap-bridge.js` 로 추출 (문서화)
  - `_renderGYUInquirySummary()`
  - `_buildInquiryPromptSection()`
  - `loadInquiryBannerFromPlatform()`
  - `injectPlatformCollabQuickPanel()`
- v6 현재는 roadmap.html 내 원본 유지 (파손 방지)
- **v7 계획**: roadmap.html 내 함수 제거 후 `<script src="roadmap-bridge.js">` 교체

### 6. shared.js v2.2.0
- `_parseCSVLine()` 내부 헬퍼 추가 (따옴표 필드 CSV 파서)
- 버전: `2.1.0` → `2.2.0`

## 파일 구조
```
career-growth-platform-v6/
├── index.html              허브 (학생 관리 + 진입)
├── keyword.html            STEP 1 탐구 질문 생성기
├── inquiry.html            STEP 2 탐구 설계
├── roadmap.html            STEP 3 학생부 성장 로드맵
├── guide.html              사용 가이드 (CSV 안내 추가)
├── shared.js               공통 상태 관리 v2.2.0
├── config.js               학교명 설정
├── export-import.js        파일 입출력
├── roadmap-bridge.js       ★ 플랫폼 연동 함수 분리 (신규, v7 이전 준비)
└── assets/common.css
```

## v7 권고 작업 목록
```
1. roadmap.html 내 플랫폼 연동 함수 제거 → roadmap-bridge.js 로 완전 분리
2. 파일 크기 최적화: keyword-data.js / roadmap-db.js / inquiry-core.js 분리 검토
3. 실제 브라우저 E2E 테스트 17개 항목 통과 확인
4. 완전 오프라인 환경용 CDN 로컬화 (assets/vendor/)
```

## E2E 테스트 체크리스트 (배포 전 필수)
```
 1. 학생 추가 (이름·특수문자 포함)
 2. 학생 선택 전환
 3. keyword.html → 학과 선택 → 키워드 선택
 4. 질문 3개 입력 (특수문자 포함)
 5. inquiry.html → 배너 표시 확인 (escapeHtml)
 6. 탐구 설계 전 항목 작성
 7. expectedEvidence 입력
 8. roadmap.html → 탐구 요약 섹션 표시 확인
 9. AI 프롬프트 연동 데이터 삽입 확인
10. 교과교사 협조 시트 복사/HTML 저장
11. 학생 JSON 저장
12. 전체 JSON 저장
13. 새 브라우저에서 JSON 불러오기
14. CSV 명단 불러오기 (따옴표 필드 포함)
15. 학생 삭제 (특수문자 이름)
16. 저장 용량 경고 확인
17. 학생 복제 후 데이터 독립성 확인
```

## CSV 학생 명단 형식
```csv
학년,반,번호,이름,희망진로
1,3,12,김민준,전자공학
1,3,13,이서연,간호학
2,1,5,"박지호","경영학, 창업"
```
