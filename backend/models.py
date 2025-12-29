# backend/models.py
from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import urllib.parse  # <--- Added this to fix the password issue

# 1. Encode the password to handle special characters like '@'
password = urllib.parse.quote_plus("Gani@3010") 

# 2. Insert the encoded password into the URL
DATABASE_URL = f"postgresql://postgres:{password}@localhost/powerbi_clone"

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    filepath = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()