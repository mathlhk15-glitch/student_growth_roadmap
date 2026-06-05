# 진로탐구 성장 플랫폼 v8
> 규 · gyu-platform-v8

## v8 핵심 변경

### 1. 최근 작업 이어하기 카드 (index.html)
- 첫 화면 상단에 가장 최근 수정한 학생 자동 표시
- 학생명·탐구주제·마지막 수정 시간 (방금 전/n분 전/어제 등) 표시
- [이어서 하기] 버튼: 진행 단계에 따라 STEP1/2/3으로 스마트 이동
  (탐구설계 있음→로드맵, 키워드만→탐구설계, 없음→키워드생성기)

### 2. "3분이면 시작" 안내 (index.html)
- 히어로 하단에 진입 장벽 낮추는 문구 추가

### 3. 결과물 예시 미리보기 (index.html)
- 탐구 질문 예시 / 세특 방향 예시 실제 샘플 텍스트 추가
- "완성하면 이런 것이 나온다"를 추상적 목록이 아닌 실제 예시로 표현

### 4. 진입 버튼 언어 톤 분리 (index.html)
- 학생용: 가볍고 친근하게 ("나만의 탐구 질문을 만들어 봅니다")
- 교사용: 명확하고 전문적으로 ("세특 방향과 성장 로드맵을 설계합니다")

### 5. roadmap.html 디자인 통일 (가장 큰 변화)
- 초록 계열 CSS 변수 전체 → 네이비/청록 통일
  --green → #16a394 (teal)
  --green-dark → #0f1f3d (navy)
  --green-mid → #1b3260 (navy2)
  --green-light → #e7faf7 (teal2)
- 헤더 배경 그라디언트 초록 → 네이비
- 하드코딩 초록 색상값 70여 곳 교체
- index→keyword→inquiry→roadmap 전 페이지 시각 일관성 완성

## 파일 구조
```
career-growth-platform-v8/
├── index.html          허브 (최근작업·예시·3분시작 추가)
├── keyword.html        STEP 1 (네이비/청록 통일)
├── inquiry.html        STEP 2 (네이비/청록 통일)
├── roadmap.html        STEP 3 (v8에서 네이비/청록 통일 완성)
├── guide.html          사용 가이드
├── shared.js           v2.4.0
├── config.js           v8 설정
├── export-import.js    파일 입출력
├── roadmap-bridge.js   로드맵 연동 함수 (v9 분리 준비)
└── assets/common.css
```
