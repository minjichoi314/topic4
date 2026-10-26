# 건강하고 지속가능한 식생활 설계 — STEP별 독립 화면

중학교 1학년 대상 식생활교육·진로체험 웹앱입니다. **1~5단계가 한 페이지에 동시에 나오지 않으며**, 각 단계로 이동하면 해당 활동만 나타납니다.

## 수정된 부분

- `#/step/1` ~ `#/step/5`의 개별 학습 화면. 상단 단계 이동 및 이전/다음 버튼 제공.
- 이미지가 텍스트나 인접 이미지 위로 겹치지 않도록 3열 히어로 구성. 그림 전체를 `object-fit: contain`으로 표시.
- 원본 카드에 중복 삽입된 제목 일부가 나타나지 않도록 학습 일러스트 전용 파일 추가.
- 10가지 가족 요청, 한국영양학회 식사구성안의 6개 식품군 × 각 5개 식재료, 4가지 직무, 5가지 돌발 상황, 성찰 및 3일 실천 티켓.
- 단계별 필수 입력이 완료되면 CLEAR 자동 표시.
- 진행 상황 자동 저장(`localStorage`) 및 활동 기록 TXT 다운로드.
- 자연공원체 웹폰트 **사용 경로만 제공**. 사용권이 있는 `public/assets/210-naturepark.woff2`를 추가해야 실제 자연공원체가 보이며 없을 경우 Jua 글꼴 적용.

## 폴더 구성

```
.github/workflows/main.yml   # GitHub Pages 자동 배포
src/main.tsx                # 단계별 인터랙션
src/data.ts                 # 시나리오·식품군·직무·돌발 상황
src/style.css               # 동화풍 UI / 반응형
src/vite-env.d.ts           # ImportMeta.env 타입 정의
public/assets/             # 이미지: 원본과 카드용 시각 자산
public/.nojekyll
index.html
package.json
vite.config.ts                # base: /topic4/
tsconfig.json
```

## GitHub에 업데이트

1. ZIP을 압축 해제하고 **안의 파일/폴더**를 `minjichoi314/topic4` 저장소 최상위에 업로드합니다. ZIP 자체를 업로드하지 마세요.
2. `src`와 `public`의 폴더 구조를 보존하세요. 기존 파일을 업데이트하거나 같은 경로에서 덮어씁니다.
3. `.github/workflows/main.yml`이 다른 배포 워크플로와 중복되지 않도록 유의하세요. 현재 이 파일 하나로 배포할 수 있습니다.
4. Actions에서 **build → deploy** 성공을 확인합니다.
5. 접속: https://minjichoi314.github.io/topic4/
6. 예전 CSS가 계속 보이면 Ctrl+Shift+R로 강력 새로고침을 합니다.

## 로컬 테스트

```bash
npm install
npm run dev
npm run build
```

## 유의점

- 비용은 학습용 가상 데이터입니다. 식단이 모든 영양소 요구량을 충족한다는 판정은 제공하지 않습니다.
- 원본 그림 자산 자체가 일부 화면에서 잘린 캡처로 제작되어 있으므로 `contain` 배치는 추가 잘림을 방지하지만, **그림 파일 내부에 원래부터 없는 부분까지 복원하지는 못합니다**.
- 생성 과정에서 TypeScript 문법을 확인했습니다. 이 실행 환경에서는 npm 레지스트리 DNS 연결이 되지 않아 `npm install` 및 Vite 빌드 검증은 수행하지 못했습니다.
