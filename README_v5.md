# 진로탐구 성장 플랫폼 v5
> 규 · gyu-platform-v5

## v5 핵심 변경 (비판 문서 반영)

### 1. localStorage 안정성 강화 (1순위)
- 학생별 분리 키 구조: `careerPlatform_v5_student_{id}` 개별 저장
- aiResultRaw 50KB 초과 시 자동 truncate (용량 초과 방지)
- 저장 실패 시 토스트 경고 자동 표시
- 저장 용량 감시: 4MB 경고 / 4.5MB 위험 배너 표시
- v3/v4 데이터 자동 마이그레이션

### 2. XSS / 입력값 안전 처리 (2순위)
- `escapeHtml()` shared.js에서 전역 제공
- index.html 학생 카드 innerHTML 모두 escapeHtml 적용
- inquiry.html/keyword.html/roadmap.html 배너도 동일 적용

### 3. setUserMode 구조 수정 (3순위)
- store 레벨 userMode로 이동 (학생 레코드 → meta 키)
- `getUserMode()` 신규 추가

### 4. export-import.js 중복 제거 (4순위)
- `bindImportHandler` / `bindCsvImportHandler` 를 export-import.js에서만 정의
- index.html 내부 중복 정의 제거
- `PlatformIO` 네임스페이스로 통합

### 5. config.js 신설 (학교명 분리)
- `schoolName`, `showSchoolName` 설정으로 학교판/범용판 전환
- 이 파일만 수정하면 학교명 적용 완료

### 6. CSV 학생 명단 일괄 등록
- `명단 불러오기` 버튼으로 CSV 파일 한 번에 등록
- 형식: `학년,반,번호,이름,희망진로`

### 7. 교과별 협조시트 고도화 (7순위)
- 국어/영어/수학/사회/과학/생명과학/화학/물리/지구과학/역사/경제/윤리/정보/미술/음악/체육 16개 교과별 관찰 포인트 자동 분기
- relatedSubjects 기반 맞춤 문장 생성

### 8. roadmap 탐구 고정 요약 섹션 (6순위)
- STEP 3 로드맵 화면 상단에 학생 생성 탐구 데이터 항상 표시
- AI 프롬프트 외에도 화면에서 직접 확인 가능

### 9. 저장 체계 안내 UI
- index.html에 저장 체계 구분 표 삽입
- inquiry.html 상단에 "단독 저장 vs 플랫폼 저장" 안내 배너

### 10. 가이드 페이지 (guide.html)
- 초보 교사 온보딩: 사이드바 네비게이션 + 전 섹션 설명
- 5분 빠른 시작 / 화면별 설명 / 시나리오 / FAQ / 활용 팁

## 파일 구조
```
career-growth-platform-v5/
├── index.html          허브 (학생 관리 + 진입)
├── keyword.html        STEP 1 탐구 질문 생성기
├── inquiry.html        STEP 2 탐구 설계
├── roadmap.html        STEP 3 학생부 성장 로드맵
├── guide.html          사용 가이드 (신규)
├── shared.js           공통 상태 관리 v2.1.0
├── config.js           학교명 설정 (신규)
├── export-import.js    파일 입출력 (중복 제거)
└── assets/common.css
```

## CSV 학생 명단 형식
```csv
학년,반,번호,이름,희망진로
1,3,12,김민준,전자공학
1,3,13,이서연,간호학
2,1,5,박지호,경영학
```

## 마이그레이션
- v3/v4 JSON → 학생 불러오기 → 자동 v5 변환
