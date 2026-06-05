# 진로탐구 성장 플랫폼 v3

## v3 핵심 개선

- 교사용 협조 시트 빠른 생성 기능 추가
- `shared.js` 공통 스키마 v1.2.0 적용
- `expectedEvidence`를 교과교사 협조 시트와 roadmap 프롬프트에 강제 반영
- keyword에서 최근 선택 키워드 최대 5개 전달
- index 허브에서 협조 시트 텍스트 복사 및 HTML 저장 가능
- roadmap 화면에 플랫폼 협조 시트 빠른 복사/저장 패널 추가
- JSON 백업·복원 및 localStorage 기반 멀티파일 흐름 유지

## 권장 테스트 흐름

1. `index.html` 실행
2. 학생 정보 입력 후 저장
3. 학생 탐구 설계 시작 → `keyword.html`
4. 학과 선택 → 키워드 선택 → 질문 3개 입력 → 탐구 설계로 보내기
5. `inquiry.html`에서 탐구 주제, 방법, 산출물, 학생부 기록 근거 입력
6. 로드맵으로 보내기
7. `roadmap.html`에서 연동 배너와 프롬프트 반영 확인
8. 허브로 돌아와 교과교사 협조 시트 복사/HTML 저장 확인

## 배포

GitHub Pages에 폴더째 업로드하면 됩니다. 외부 API는 사용하지 않습니다. 단, roadmap의 Chart.js/PDF.js CDN 기능은 인터넷 연결이 필요할 수 있습니다.
