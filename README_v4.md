# 진로탐구 성장 플랫폼 v4

## v4 핵심 변경

### 1. 다중 학생 관리 (가장 중요)
- 학생을 N명 동시에 저장·관리 (localStorage 다중 키 구조)
- 허브(index.html)에서 학생 목록 드롭다운으로 즉시 전환
- 학생별 개별 JSON 내보내기 / 전체 내보내기
- JSON 파일 불러오기 시 기존 학생 목록 유지 (덮어쓰기 방지)
- v3 JSON 자동 마이그레이션 (기존 데이터 손실 없음)

### 2. 학교명 제거
- 모든 파일에서 특정 학교명 제거 → 범용 플랫폼

### 3. UX 개선
- 각 STEP 페이지에 "허브로 돌아가기" 링크 추가
- 학생 진행 상태 시각화 (진행도 바)
- 학생 없을 때 자동 추가 안내 모달
- 협조시트 패널: 탐구 데이터 입력 시에만 노출

### 4. shared.js v2.0.0
- 다중 학생 API: `getStudentList`, `setCurrentStudent`, `createStudent`, `deleteStudent`, `duplicateStudent`, `exportStudentJSON`, `exportAllJSON`, `importFromJSON`
- 기존 v3 API 완전 하위 호환 (`loadState`, `saveState`, `updateSection` 등)

## 파일 구조
```
career-growth-platform-v4/
├── index.html          허브 (학생 관리 + 진입)
├── keyword.html        STEP 1 학과별 탐구 질문 생성기
├── inquiry.html        STEP 2 나만의 탐구 설계 기록하기
├── roadmap.html        STEP 3 학생부 성장 로드맵
├── shared.js           공통 상태 관리 v2.0.0
├── export-import.js    파일 가져오기 헬퍼
└── assets/
    └── common.css      공통 CSS
```

## 권장 사용 흐름

### 교사 (상담 시간 순회 모드)
1. `index.html` 실행
2. 학생 추가 또는 목록에서 학생 클릭
3. **교사 진단 시작** → STEP 3 로드맵 직행
4. 상담 완료 후 **현재 학생 저장** (JSON)
5. 다음 학생 선택 → 반복

### 학생 (탐구 활동 순서)
1. `index.html` → 학생 선택
2. **학생 탐구 시작** → STEP 1 키워드 생성기
3. 학과·키워드 선택 → 질문 3개 → 탐구 설계로 보내기
4. STEP 2 탐구 설계 → 모든 항목 작성 → 로드맵으로 보내기
5. STEP 3 로드맵 → AI 프롬프트 활용

## 배포
GitHub Pages 폴더째 업로드. 외부 API 없음.
※ roadmap.html의 Chart.js·PDF.js는 CDN 연결 필요.
   완전 오프라인 환경은 assets/vendor/ 로컬 번들 필요.

## 데이터 마이그레이션
v3 JSON 파일 → '학생 불러오기'로 자동 v4 변환 적용.
