# STATUS — #008 Beyond Tomorrow Summit

> 갱신일: 2026-06-03 · 풀스택 재구축 완료 스냅샷

| 항목 | 내용 |
|------|------|
| 번호 | 008 |
| 해커톤 | Beyond Tomorrow Summit |
| Devpost | https://beyond-tomorrow-summit-30094.devpost.com/ |
| 마감 | 2026-06-05 (D-2) |
| 진행 상태 | 🟢 제출 직전 (SUBMIT-READY, 풀스택) |
| 프로젝트 | ReliefGrid |
| 아키텍처 | 프론트(SPA) + 백엔드(FastAPI) + DB(SQLite/SQLAlchemy) |

## 요약

정적 프로토타입을 **실제 풀스택 애플리케이션으로 전면 재구축**했다. 프론트엔드를 완전히 새로
설계(미션 컨트롤 다크 UI)하고, FastAPI REST 백엔드 + SQLite 영속화 + 서버사이드 스코어링
엔진을 구현했다. 27개 자동 QA 전부 통과.

## 상세

- **프로젝트명:** ReliefGrid
- **진행 단계:** 풀스택 구현 완료 → 브라우저 검증 완료 → QA 그린 → 제출 직전
- **핵심 산출물:**
  - 백엔드: `backend/app/` (FastAPI, ORM 모델, 스코어링 엔진, 라우터, 시드)
  - 프론트: `frontend/` (새 SPA — index.html, css/styles.css, js/*)
  - 실행: `run.sh`, `serve.py` / 품질: `qa.py` (27/27 통과)
  - 데모: `reliefgrid-demo-video.webm`, 피치덱: `reliefgrid-pitch-deck.pptx`
- **제출 문서:** `README.md`, `submission.md`, `DEVPOST_FIELDS.md`, `SUBMIT_RUNBOOK.md`,
  `JUDGE_BRIEF.md`, `demo-script.md`
- **검증:** 백엔드 e2e(curl) + 브라우저 렌더/인터랙션 + `qa.py` 27/27
- **남은 일(사용자 측):**
  1. (선택) 새 UI 기준으로 데모 영상/스크린샷 재촬영 — `demo-script.md` 참고
  2. GitHub 푸시 (origin: `sueun-dev/reliefgrid-beyond-tomorrow`)
  3. Devpost 최종 제출 (마감 D-2)

## 참고

- 구버전 정적 프로토타입은 클린 빌드를 위해 워킹트리에서 제거됨 (git 히스토리 `8dd947e`에 보존, 복구 가능).
- DB(`backend/reliefgrid.db`)는 gitignore이며 최초 부팅 시 자동 생성·시드됨.
