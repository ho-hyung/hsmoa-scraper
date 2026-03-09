"""
MySQL 데이터베이스 연동 모듈
============================

스크래핑 데이터를 MySQL에 저장합니다.
환경변수로 접속 정보를 설정합니다:
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

테이블 자동 생성 (없을 경우):
  moa_schedule - 홈쇼핑 편성표 데이터
"""

import os
from datetime import datetime

import pymysql
from pymysql.cursors import DictCursor


def get_connection():
    """환경변수 기반 MySQL 커넥션 반환"""
    return pymysql.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "hsmoa"),
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=False,
    )


def ensure_table(conn):
    """moa_schedule 테이블이 없으면 생성"""
    ddl = """
    CREATE TABLE IF NOT EXISTS moa_schedule (
        id            BIGINT AUTO_INCREMENT PRIMARY KEY,
        date          DATE NOT NULL,
        channel_code  VARCHAR(50) NOT NULL,
        channel       VARCHAR(100) NOT NULL,
        start_time    VARCHAR(20) NOT NULL,
        end_time      VARCHAR(20) NOT NULL,
        product_name  VARCHAR(500) NOT NULL,
        price         INT DEFAULT NULL,
        original_price INT DEFAULT NULL,
        brand         VARCHAR(200) DEFAULT '',
        category      VARCHAR(100) DEFAULT '',
        image_url     TEXT,
        product_url   TEXT,
        review_count  INT DEFAULT 0,
        review_rating FLOAT DEFAULT 0,
        collected_at  DATETIME NOT NULL,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY uq_schedule (date, channel_code, start_time, product_name(200)),
        INDEX idx_date (date),
        INDEX idx_channel (channel_code),
        INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    with conn.cursor() as cur:
        cur.execute(ddl)
    conn.commit()


def save_to_db(items: list[dict], target_date_display: str) -> int:
    """
    스크래핑 데이터를 DB에 저장합니다.

    - 중복 키 충돌 시 UPDATE (가격, 리뷰 등 최신 데이터로 갱신)
    - 배치 INSERT로 성능 최적화
    - 실패 시 롤백 후 예외를 상위로 전파

    Returns:
        저장된 레코드 수
    """
    if not items:
        return 0

    conn = get_connection()
    try:
        ensure_table(conn)

        sql = """
        INSERT INTO moa_schedule
            (date, channel_code, channel, start_time, end_time,
             product_name, price, original_price, brand, category,
             image_url, product_url, review_count, review_rating, collected_at)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            price = VALUES(price),
            original_price = VALUES(original_price),
            brand = VALUES(brand),
            image_url = VALUES(image_url),
            product_url = VALUES(product_url),
            review_count = VALUES(review_count),
            review_rating = VALUES(review_rating),
            collected_at = VALUES(collected_at)
        """

        collected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        rows = [
            (
                target_date_display,
                item["channel_code"],
                item["channel"],
                item["start_time"],
                item["end_time"],
                item["product_name"],
                int(item["price"]) if item["price"] else None,
                int(item["original_price"]) if item["original_price"] else None,
                item.get("brand", ""),
                item.get("category", ""),
                item.get("image_url", ""),
                item.get("product_url", ""),
                item.get("review_count", 0),
                item.get("review_rating", 0),
                collected_at,
            )
            for item in items
        ]

        with conn.cursor() as cur:
            cur.executemany(sql, rows)

        conn.commit()
        return len(rows)

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
