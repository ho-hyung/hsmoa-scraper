"""
Slack Webhook 알림 모듈
======================

환경변수 SLACK_WEBHOOK_URL이 설정되어 있으면 알림을 보냅니다.
미설정 시 조용히 건너뜁니다.
"""

import json
import os
import urllib.request
import urllib.error


def send_slack(message: str) -> bool:
    """Slack Incoming Webhook으로 메시지를 전송합니다."""
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    if not webhook_url:
        return False

    payload = json.dumps({"text": message}).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except (urllib.error.URLError, OSError) as e:
        print(f"  [Slack 경고] 알림 전송 실패: {e}")
        return False


def notify_success(target_date_display: str, item_count: int, channel_count: int):
    """스크래핑 성공 알림"""
    send_slack(
        f"[데이터수집] {target_date_display} 편성표 수집 완료\n"
        f"- {item_count}건 / {channel_count}개 채널"
    )


def notify_failure(target_date_display: str, reason: str):
    """스크래핑 실패 알림"""
    send_slack(
        f"[데이터수집] {target_date_display} 편성표 수집 실패\n"
        f"- 원인: {reason}"
    )
