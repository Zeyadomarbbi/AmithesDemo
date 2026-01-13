from sqlalchemy import create_engine

DATABASE_URL = "postgresql+psycopg2://postgres:Apc389jc@localhost:5432/amethis_test"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True
)