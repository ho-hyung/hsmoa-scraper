"""
홈쇼핑모아(hsmoa.com) 편성표 스크래퍼
====================================

내일 날짜의 전체 홈쇼핑 채널 편성표를 수집하여
JSON과 Excel 파일로 저장합니다.

동작 방식:
  1. Playwright로 hsmoa.com 접속 (쿠키/세션 확보)
  2. 내부 API를 직접 호출 (/api/hsmoa/v3/schedule?time_size=48)
  3. AES-CBC 암호화 응답을 브라우저 내 CryptoJS로 복호화
  4. zlib 압축 해제 → JSON 파싱
  5. 대상 날짜 필터링 → JSON + Excel 저장

사용법:
  python scraper.py                    # 내일 전체 편성표
  python scraper.py --date 20260225    # 특정 날짜 편성표

필수 패키지:
  pip install playwright pandas openpyxl fake-useragent
  playwright install chromium
"""

import argparse
import asyncio
import base64
import json
import random
import sys
import zlib
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
from fake_useragent import UserAgent
from playwright.async_api import async_playwright


# ──────────────────────────────────────────────
# 상수
# ──────────────────────────────────────────────

BASE_URL = "https://hsmoa.com"
SCHEDULE_API_BASE = f"{BASE_URL}/api/hsmoa/v3/schedule"
AES_KEY = "0b659773-ee62-41f6-9162-5f4217488e2c"
CRYPTOJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"
OUTPUT_DIR = Path(__file__).parent / "output"

# 홈쇼핑 채널 코드 → 한글명 매핑
CHANNEL_MAP = {
    "gsshop": "GS샵",
    "gsmyshop": "GS MY샵",
    "cjmall": "CJ온스타일",
    "cjmyshop": "CJ온스타일+",
    "cjmallplus": "CJ온스타일+",
    "hmall": "현대홈쇼핑",
    "hmallmyshop": "현대홈쇼핑+",
    "hmallplus": "현대홈쇼핑+",
    "lotteimall": "롯데홈쇼핑",
    "lottemyshop": "롯데원TV",
    "lotteonetv": "롯데원TV",
    "immall": "롯데아이몰",
    "nsmall": "NS홈쇼핑",
    "nsmyshop": "NS샵+",
    "nsmallplus": "NS샵+",
    "hns": "홈앤쇼핑",
    "hnsmyshop": "홈앤쇼핑+",
    "hnsmall": "홈앤쇼핑",
    "bshop": "SK스토아",
    "bshopmyshop": "SK스토아+",
    "wshop": "W쇼핑",
    "kshop": "공영쇼핑",
    "kshopplus": "공영쇼핑+",
    "shopnt": "쇼핑엔T",
    "ssgshop": "신세계쇼핑",
}


# ──────────────────────────────────────────────
# 유틸리티
# ──────────────────────────────────────────────

def parse_args():
    """커맨드라인 인자 파싱"""
    parser = argparse.ArgumentParser(description="홈쇼핑모아 편성표 스크래퍼")
    parser.add_argument(
        "--date",
        type=str,
        default=None,
        help="수집할 날짜 (YYYYMMDD). 기본값: 내일",
    )
    return parser.parse_args()


def get_target_date(date_arg: str | None) -> tuple[str, str]:
    """대상 날짜 계산. (YYYYMMDD, YYYY-MM-DD) 반환"""
    KST = timezone(timedelta(hours=9))
    if date_arg:
        dt = datetime.strptime(date_arg, "%Y%m%d")
    else:
        dt = datetime.now(KST) + timedelta(days=1)
    return dt.strftime("%Y%m%d"), dt.strftime("%Y-%m-%d")


def get_random_user_agent() -> str:
    """랜덤 Chrome User-Agent 생성 (봇 탐지 우회)"""
    try:
        return UserAgent().chrome
    except Exception:
        return (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )


def resolve_channel_name(code: str) -> str:
    """채널 코드를 한글명으로 변환"""
    return CHANNEL_MAP.get(code, code)


def to_kst(iso_str: str) -> str:
    """ISO 8601 시간 문자열을 'YYYY-MM-DD HH:MM' KST 형식으로 변환"""
    if not iso_str:
        return ""
    try:
        dt = datetime.fromisoformat(iso_str)
        return dt.strftime("%Y-%m-%d %H:%M")
    except (ValueError, TypeError):
        return iso_str


# ──────────────────────────────────────────────
# API 호출 + 복호화
# ──────────────────────────────────────────────

async def fetch_schedule_data(target_date_display: str) -> dict | None:
    """
    Playwright로 hsmoa.com에 접속 후 편성표 API를 직접 호출합니다.

    1. 사이트 접속하여 세션/쿠키 확보
    2. CryptoJS CDN 로드
    3. API를 fetch()로 직접 호출 (time_size=48, direction=down)
    4. AES-CBC 복호화 + zlib 압축 해제
    """
    user_agent = get_random_user_agent()
    print(f"  [UA] {user_agent[:60]}...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=user_agent,
            viewport={"width": 1920, "height": 1080},
            locale="ko-KR",
        )

        page = await context.new_page()

        # 사이트 접속 (세션/쿠키 확보)
        print(f"  [접속] {BASE_URL}")
        try:
            await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
        except Exception:
            pass
        await page.wait_for_timeout(random.randint(3000, 5000))

        # CryptoJS 로드
        await page.add_script_tag(url=CRYPTOJS_CDN)
        await page.wait_for_timeout(1000)

        # API 직접 호출 + 복호화를 브라우저 내에서 수행
        api_url = (
            f"{SCHEDULE_API_BASE}"
            f"?time_size=48"
            f"&direction=down"
            f"&time={target_date_display}T00:00:00"
        )
        print(f"  [API 호출] {api_url}")

        decrypted_result = await page.evaluate("""
        async ([apiUrl, aesKey]) => {
            try {
                // API 호출
                const resp = await fetch(apiUrl);
                if (!resp.ok) return { error: `HTTP ${resp.status}` };

                const data = await resp.json();
                if (!data.results || !data.iv) {
                    return { error: 'results/iv 필드 없음', raw: JSON.stringify(data).substring(0, 200) };
                }

                // AES-CBC 복호화
                const decrypted = CryptoJS.AES.decrypt(
                    data.results,
                    CryptoJS.enc.Utf8.parse(aesKey),
                    {
                        iv: CryptoJS.enc.Hex.parse(data.iv),
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7,
                    }
                );
                const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

                if (!plaintext) return { error: '복호화 결과 비어있음' };
                return { success: true, data: plaintext };

            } catch (e) {
                return { error: e.message };
            }
        }
        """, [api_url, AES_KEY])

        await browser.close()

    if not decrypted_result.get("success"):
        print(f"  [실패] {decrypted_result}")
        return None

    # zlib 압축 해제
    plaintext_b64 = decrypted_result["data"]
    compressed = base64.b64decode(plaintext_b64)
    decompressed = zlib.decompress(compressed)
    json_str = decompressed.decode("utf-8")
    print(f"  [성공] 복호화 데이터: {len(json_str):,} chars")

    return json.loads(json_str)


# ──────────────────────────────────────────────
# 데이터 정제
# ──────────────────────────────────────────────

def extract_schedule_items(raw_data: dict, target_date_display: str) -> list[dict]:
    """
    API 응답에서 대상 날짜의 편성표를 추출합니다.

    API 구조: { before_live, live, after_live }
    각 섹션: [{ time, schedules: [...], count }]
    """
    all_items = []

    for section in ("before_live", "live", "after_live"):
        time_slots = raw_data.get(section, [])
        if not isinstance(time_slots, list):
            continue

        for slot in time_slots:
            schedules = slot.get("schedules", [])
            if not isinstance(schedules, list):
                continue

            for item in schedules:
                all_items.append(_normalize_item(item))

    # 대상 날짜 필터링
    filtered = [
        item for item in all_items
        if item["start_time"].startswith(target_date_display)
    ]

    result = filtered if filtered else all_items

    # 중복 제거
    seen = set()
    unique_items = []
    for item in result:
        key = (item["channel_code"], item["start_time"], item["product_name"])
        if key not in seen:
            seen.add(key)
            unique_items.append(item)

    # 시작 시간 + 채널 순 정렬
    unique_items.sort(key=lambda x: (x["start_time"], x["channel"]))

    return unique_items


def _normalize_item(item: dict) -> dict:
    """개별 편성표 아이템을 표준 형식으로 변환"""
    channel_code = item.get("tv_channel", "") or item.get("site", "")
    return {
        "channel_code": channel_code,
        "channel": resolve_channel_name(channel_code),
        "start_time": to_kst(item.get("start_datetime", "")),
        "end_time": to_kst(item.get("end_datetime", "")),
        "product_name": item.get("name", "") or "",
        "price": item.get("sale_price") or item.get("price") or "",
        "original_price": item.get("price") or "",
        "brand": item.get("brand") or item.get("aplus_brand") or "",
        "category": item.get("category1", "") or "",
        "image_url": item.get("image", "") or "",
        "product_url": item.get("url", "") or "",
        "review_count": item.get("review_count") or 0,
        "review_rating": item.get("review_rating") or 0,
    }


# ──────────────────────────────────────────────
# 저장
# ──────────────────────────────────────────────

def save_json(items: list[dict], target_date: str, target_date_display: str) -> Path:
    """JSON 파일로 저장"""
    filepath = OUTPUT_DIR / f"schedule_{target_date}.json"
    payload = {
        "date": target_date_display,
        "collected_at": datetime.now().isoformat(),
        "total_count": len(items),
        "items": items,
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"  [JSON] {filepath} ({len(items)}건)")
    return filepath


def save_excel(items: list[dict], target_date: str) -> Path:
    """Excel 파일로 저장 (한글 헤더 + 컬럼 자동 조정)"""
    filepath = OUTPUT_DIR / f"schedule_{target_date}.xlsx"

    # channel_code는 Excel에서 제외
    display_columns = [
        "channel", "start_time", "end_time", "product_name",
        "price", "original_price", "brand", "category",
        "image_url", "product_url", "review_count", "review_rating",
    ]
    column_labels = {
        "channel": "채널명",
        "start_time": "방송 시작",
        "end_time": "방송 종료",
        "product_name": "상품명",
        "price": "판매가(원)",
        "original_price": "정가(원)",
        "brand": "브랜드",
        "category": "카테고리",
        "image_url": "이미지 URL",
        "product_url": "상품 URL",
        "review_count": "리뷰 수",
        "review_rating": "평점",
    }

    df = pd.DataFrame(items)
    existing = [c for c in display_columns if c in df.columns]
    df = df[existing]
    df = df.sort_values(by=["channel", "start_time"]).reset_index(drop=True)
    df = df.rename(columns=column_labels)

    with pd.ExcelWriter(filepath, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="편성표")

        # 컬럼 너비 자동 조정
        worksheet = writer.sheets["편성표"]
        from openpyxl.utils import get_column_letter
        for col_idx, col_name in enumerate(df.columns, 1):
            max_len = max(
                df[col_name].astype(str).str.len().max(),
                len(col_name),
            )
            worksheet.column_dimensions[get_column_letter(col_idx)].width = min(max_len + 4, 60)

    print(f"  [Excel] {filepath} ({len(items)}건)")
    return filepath


# ──────────────────────────────────────────────
# 메인
# ──────────────────────────────────────────────

async def main():
    args = parse_args()
    target_date, target_date_display = get_target_date(args.date)

    print("=" * 60)
    print("  홈쇼핑모아 편성표 스크래퍼")
    print(f"  대상 날짜: {target_date_display}")
    print("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1단계: API 데이터 수집 + 복호화
    print("\n[1/3] 편성표 데이터 수집 중...")
    raw_data = await fetch_schedule_data(target_date_display)

    if not raw_data:
        print("\n[실패] 편성표 데이터를 가져올 수 없습니다.")
        sys.exit(1)

    # 2단계: 데이터 정제
    print("\n[2/3] 데이터 정제 중...")
    items = extract_schedule_items(raw_data, target_date_display)
    print(f"  {target_date_display} 편성표: {len(items)}건")

    if not items:
        print("\n[경고] 해당 날짜의 편성표 데이터가 없습니다.")
        debug_path = OUTPUT_DIR / f"raw_{target_date}.json"
        with open(debug_path, "w", encoding="utf-8") as f:
            json.dump(raw_data, f, ensure_ascii=False, indent=2)
        print(f"  원본 데이터 저장됨: {debug_path}")
        sys.exit(0)

    # 3단계: 파일 저장
    print("\n[3/3] 파일 저장 중...")
    json_path = save_json(items, target_date, target_date_display)
    excel_path = save_excel(items, target_date)

    # 결과 요약
    channels = sorted(set(item["channel"] for item in items))
    categories = sorted(set(item["category"] for item in items if item["category"]))
    priced_items = [item for item in items if item["price"]]
    avg_price = sum(int(item["price"]) for item in priced_items) / len(priced_items) if priced_items else 0

    print(f"\n{'=' * 60}")
    print(f"  수집 완료!")
    print(f"  날짜: {target_date_display}")
    print(f"  총 {len(items)}건 / {len(channels)}개 채널")
    print(f"  채널: {', '.join(channels)}")
    print(f"  카테고리: {', '.join(categories)}")
    print(f"  평균 판매가: {avg_price:,.0f}원 (가격 있는 {len(priced_items)}건 기준)")
    print(f"  JSON: {json_path}")
    print(f"  Excel: {excel_path}")
    print(f"{'=' * 60}")

    # 샘플 출력
    print(f"\n[샘플 데이터 (상위 5건)]")
    for i, item in enumerate(items[:5], 1):
        price_str = f"{int(item['price']):,}원" if item["price"] else "미정"
        brand_str = f" ({item['brand']})" if item["brand"] else ""
        print(
            f"  {i}. [{item['channel']}] "
            f"{item['start_time'][11:16]}~{item['end_time'][11:16]} | "
            f"{item['product_name'][:45]}{brand_str} | "
            f"{price_str}"
        )


if __name__ == "__main__":
    asyncio.run(main())
