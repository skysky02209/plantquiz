#!/bin/zsh
# 식물생산 퀴즈 재배포: 더블클릭하면 GitHub Pages로 올라갑니다.
cd "$(dirname "$0")"
git add -A
git commit -m "update $(date '+%Y-%m-%d %H:%M')" >/dev/null 2>&1 || echo "변경 사항 없음"
git push origin main
echo ""
echo "✅ 배포 완료: https://skysky02209.github.io/plantquiz/"
echo "   (반영까지 1~2분 걸릴 수 있어요)"
sleep 3
