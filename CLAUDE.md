# CLAUDE.md — AI PB 저장소 안내 (Claude가 자동으로 읽는 파일)

이 저장소는 개발 경험이 적은 2인 팀(옥경환 koreanchubby, 이유경 yukyung16)의 금융인공지능실습 프로젝트 "범용 AI PB" 웹앱입니다.

- 앱: https://koreanchubby.github.io/ai-pb/ (GitHub Pages, main 브랜치 루트)
- 기준 버전: 태그 `prototype-v4`
- 구조: `index.html`(화면) · `app.js`(계산과 화면 흐름) · `styles.css`, `v3.css`(디자인) · `docs/`(팀 문서)

## 작업 절차

작업 시작·끝·막힘·PR 리뷰·주간 보고서는 `.claude/skills/ai-pb-workflow/SKILL.md`의 절차를 따릅니다. 사람용 설명은 `docs/WORKFLOW.md`, 복사용 문장은 `docs/CLAUDE_PROMPTS.md`에 있습니다.

## 반드시 지킬 규칙

- 시작 전에 `docs/STATUS.md`를 읽고, 시작·끝날 때 갱신합니다.
- `index.html`의 id를 바꾸지 않고, 파일 전체를 덮어쓰지 않습니다.
- `app.js`는 공유 파일입니다. 수정 전에 사용자에게 알리고 팀원 작업과 겹치는지 확인합니다.
- 기능은 이슈에 적힌 브랜치에서, PR로만 main에 합칩니다. 자기 PR은 스스로 Merge하지 않습니다.
- 계산 함수를 바꾸면 같은 입력의 변경 전후 숫자를 PR에 적습니다.
- 모든 기능·파라미터는 논문 또는 공식 실무 자료에 근거하고, 결정은 `docs/DECISIONS.md`에 기록합니다. 인용은 실제로 확인한 서지만 씁니다.
- AI(LLM)는 비중 숫자나 법률·세무 결론을 정하지 않습니다(`docs/PROJECT_BRIEF.md` 4장).
- `.env`와 API 키는 커밋하지 않습니다.
- PR·이슈·리뷰·Merge·배포 상태("누가 무엇을 해야 한다", "아직 반영 안 됐다")를 사용자에게 말하기 **직전에** GitHub에서 현재 상태를 다시 조회합니다(`gh pr list --state all`, `gh issue list`, `gh run list`). 팀원이 그사이 Merge했을 수 있으므로, 앞서 확인한 결과를 그대로 말하지 않습니다. (2026-10-06: 이미 Merge된 PR을 "Merge해야 한다"고 잘못 안내한 일이 있었음)
