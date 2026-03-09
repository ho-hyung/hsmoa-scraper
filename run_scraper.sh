#!/bin/bash
# ──────────────────────────────────────────────
# 홈쇼핑모아 스크래퍼 실행 스크립트 (서버 cron용)
# ──────────────────────────────────────────────
#
# crontab 등록 예시:
#   0 1 * * * /path/to/hsmoa-scraper/run_scraper.sh >> /path/to/hsmoa-scraper/logs/cron.log 2>&1
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
VENV_DIR="$SCRIPT_DIR/.venv"

mkdir -p "$LOG_DIR"

echo "========================================"
echo "  $(date '+%Y-%m-%d %H:%M:%S') 스크래퍼 실행"
echo "========================================"

# .env 로드
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

# 가상환경 활성화
if [ -d "$VENV_DIR" ]; then
    source "$VENV_DIR/bin/activate"
else
    echo "[오류] 가상환경 없음: $VENV_DIR"
    echo "  python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && playwright install chromium"
    exit 1
fi

# 스크래퍼 실행
cd "$SCRIPT_DIR"
python scraper.py "$@"
EXIT_CODE=$?

echo ""
echo "종료 코드: $EXIT_CODE"
echo "완료 시각: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

exit $EXIT_CODE
