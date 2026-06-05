# 진로탐구 성장 플랫폼 v2

## v2 보완 내용

1. `expectedEvidence`를 실제 입력 필드로 분리했습니다.
   - `inquiry.html` STEP 7에 **학생부 기록 근거** 입력칸을 추가했습니다.
   - 로드맵 전송 시 `expectedEvidence`가 별도 저장됩니다.
   - `roadmap.html`의 탐구 설계 연동 배너와 AI 프롬프트 섹션에 기록 근거가 반영됩니다.

2. 공통 브랜딩 CSS를 각 페이지에 연결했습니다.
   - `assets/common.css`를 `index.html`, `keyword.html`, `inquiry.html`, `roadmap.html`에 연결했습니다.
   - 기존 내부 CSS가 우선 적용되도록 공통 CSS는 내부 스타일보다 먼저 로드됩니다.

3. JSON 백업·복원 안정성을 유지했습니다.
   - `export-import.js`는 MIME type이 비어 있는 로컬 JSON 파일도 확장자 기준으로 불러올 수 있습니다.
   - JSON 복원 시 기본 스키마 기준으로 병합하여 다른 학생 데이터 혼입 가능성을 줄였습니다.

4. 상태 스키마 버전을 `1.1.0`으로 올렸습니다.

## 사용 흐름

1. `index.html` 실행
2. 학생 정보 입력 또는 JSON 불러오기
3. 학생 탐구 설계 시작: `keyword.html` → `inquiry.html` → `roadmap.html`
4. 교사 진단 시작: `roadmap.html` 직접 진입
5. 수업 종료 전 `index.html`에서 JSON 저장

## 운영 주의

- GitHub Pages 배포를 권장합니다.
- 로컬 폴더에서도 실행 가능하지만, 인터넷이 없는 환경에서는 `roadmap.html`의 Chart.js/PDF.js CDN 기능이 제한될 수 있습니다.
- 완전 오프라인 운영이 필요하면 추후 `assets/vendor/`에 Chart.js와 PDF.js를 로컬 저장하는 방식으로 전환하세요.
