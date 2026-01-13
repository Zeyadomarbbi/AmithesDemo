from datetime import datetime, timedelta, date
from sqlalchemy import text
from app.db.session import SessionLocal

def create_dim_date(
    date_start: str,
    date_end: str,
    table_name: str = "dim_date"
):
    start = datetime.strptime(date_start, "%d-%m-%Y").date()
    end   = datetime.strptime(date_end, "%d-%m-%Y").date()

    db = SessionLocal()

    try:
        db.execute(text(f"DROP TABLE IF EXISTS {table_name};"))

        db.execute(text(f"""
        CREATE TABLE {table_name} (
            date_id INTEGER PRIMARY KEY,
            full_date DATE NOT NULL UNIQUE,

            day SMALLINT NOT NULL,
            day_name VARCHAR(10) NOT NULL,
            day_of_week SMALLINT NOT NULL,
            day_of_year SMALLINT NOT NULL,

            week SMALLINT NOT NULL,
            iso_week SMALLINT NOT NULL,

            month SMALLINT NOT NULL,
            month_name VARCHAR(10) NOT NULL,

            quarter SMALLINT NOT NULL,

            year SMALLINT NOT NULL,

            month_start DATE NOT NULL,
            month_end DATE NOT NULL,
            quarter_start DATE NOT NULL,
            quarter_end DATE NOT NULL,
            year_start DATE NOT NULL,
            year_end DATE NOT NULL,

            is_weekend BOOLEAN NOT NULL
        );
        """))

        current = start
        rows = []

        while current <= end:
            year = current.year
            month = current.month
            quarter = (month - 1) // 3 + 1

            month_start = date(year, month, 1)
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)

            quarter_start = date(year, (quarter - 1) * 3 + 1, 1)
            quarter_end = (quarter_start.replace(day=28) + timedelta(days=92)).replace(day=1) - timedelta(days=1)

            year_start = date(year, 1, 1)
            year_end = date(year, 12, 31)

            rows.append({
                "date_id": int(current.strftime("%Y%m%d")),
                "full_date": current,
                "day": current.day,
                "day_name": current.strftime("%A"),
                "day_of_week": current.isoweekday(),
                "day_of_year": current.timetuple().tm_yday,
                "week": current.strftime("%U"),
                "iso_week": current.isocalendar().week,
                "month": month,
                "month_name": current.strftime("%B"),
                "quarter": quarter,
                "year": year,
                "month_start": month_start,
                "month_end": month_end,
                "quarter_start": quarter_start,
                "quarter_end": quarter_end,
                "year_start": year_start,
                "year_end": year_end,
                "is_weekend": current.weekday() >= 5
            })

            current += timedelta(days=1)

        db.execute(
            text(f"""
            INSERT INTO {table_name} (
                date_id, full_date,
                day, day_name, day_of_week, day_of_year,
                week, iso_week,
                month, month_name,
                quarter, year,
                month_start, month_end,
                quarter_start, quarter_end,
                year_start, year_end,
                is_weekend
            )
            VALUES (
                :date_id, :full_date,
                :day, :day_name, :day_of_week, :day_of_year,
                :week, :iso_week,
                :month, :month_name,
                :quarter, :year,
                :month_start, :month_end,
                :quarter_start, :quarter_end,
                :year_start, :year_end,
                :is_weekend
            )
            """),
            rows
        )

        db.commit()

    finally:
        db.close()

        
if __name__ == "__main__":
    create_dim_date(
        date_start="01-01-2000",
        date_end="31-12-2035",
        table_name="dim_date"
    )