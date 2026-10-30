# h3clo · 기록과 프로젝트

Obsidian에서 작성한 Markdown을 읽고 검색하는 개인 블로그입니다.

- 블로그: https://h3clo.github.io/
- Sunshine: https://h3clo.github.io/sunshine/

## 글 작성과 발행

주제 폴더에 `.md` 파일을 작성하고 `main`에 push하면 GitHub Actions가 목록과 배포 파일을 자동 생성합니다. 본문 전체 검색, 주제 필터, 다크모드, 글자 크기 조절, 링크 복사를 제공합니다. `[[노트 이름]]`, `[[노트 이름|표시 이름]]`, `![[이미지.png]]`를 지원하며 첨부 파일은 `img/`에 저장합니다. 같은 이름의 파일이 여럿이면 폴더를 포함한 경로를 사용하세요.

공개하지 않을 글은 맨 위에 아래 내용을 넣습니다. 해당 파일과 본문은 배포 결과 및 검색 데이터에서 제외됩니다. **공개 GitHub 저장소에 커밋한 원본 자체는 여전히 공개됩니다. 비밀 정보는 커밋하지 마세요.**

```yaml
---
draft: true
---
```

기존 Markdown 원본과 글 경로는 유지합니다. 비슷한 주제의 폴더는 화면에서 하나의 주제로 묶습니다. 첨부 파일은 모두 배포되므로 비공개 첨부 파일을 `img/`에 넣지 마세요.

## 로컬 확인

```sh
python3 scripts/build.py
python3 -m http.server 8000 --directory dist
```

http://localhost:8000 에서 확인합니다. Docsify와 폰트는 외부 CDN을 사용하므로 인터넷 연결이 필요합니다. `_sidebar.md`, `_generate_sidebar.sh`는 이전 구성의 기록이며 현재 배포에서는 `scripts/build.py`가 메뉴를 생성합니다.
