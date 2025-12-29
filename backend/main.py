from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import shutil
import os
import uuid
from pydantic import BaseModel
from typing import List, Optional, Any

# Import your database models
from models import Dataset, get_db

# 1. Initialize the App
app = FastAPI()

# 2. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 3. Pydantic Models
class QueryRequest(BaseModel):
    dataset_id: int
    measure_col: str         # The numeric column (e.g., Sales)
    dimension_col: str = "None" # The category column (e.g., City). Default to "None" for KPIs
    aggregation: str         # sum, mean, count, min, max

# 4. API Endpoints

@app.post("/upload")
def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Uploads a CSV and registers it in the DB."""
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    dataset = Dataset(filename=file.filename, filepath=file_path)
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    return {"id": dataset.id, "filename": dataset.filename}

@app.get("/datasets")
def get_datasets(db: Session = Depends(get_db)):
    """Fetch all available datasets."""
    return db.query(Dataset).all()

@app.get("/datasets/{dataset_id}/columns")
def get_columns(dataset_id: int, db: Session = Depends(get_db)):
    """Returns column names and their data types."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        df = pd.read_csv(dataset.filepath)
        return {
            "columns": list(df.columns), 
            "dtypes": df.dtypes.astype(str).to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@app.post("/query")
def query_data(request: QueryRequest, db: Session = Depends(get_db)):
    """
    The Power BI Engine:
    Handles both normal Charts (Group By) and KPIs (Single Value).
    """
    dataset = db.query(Dataset).filter(Dataset.id == request.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = pd.read_csv(dataset.filepath)
        
        # A. Data Cleaning: Force Measure Column to Numeric
        if request.measure_col not in df.columns:
             raise HTTPException(status_code=400, detail=f"Column {request.measure_col} not found.")

        df[request.measure_col] = pd.to_numeric(df[request.measure_col], errors='coerce').fillna(0)
        
        # B. Handle KPI (Single Number) Request
        # If dimension is "None" or empty, just calculate the total
        if not request.dimension_col or request.dimension_col == "None":
            total_value = df[request.measure_col].agg(request.aggregation)
            return [{"name": "Total", "value": round(total_value, 2)}]

        # C. Handle Charts (Group By)
        if request.dimension_col not in df.columns:
             raise HTTPException(status_code=400, detail=f"Column {request.dimension_col} not found.")

        grouped = df.groupby(request.dimension_col)[request.measure_col].agg(request.aggregation).reset_index()
        
        # Rename columns for frontend consistency
        grouped.columns = ["name", "value"] 
        
        # Sort and limit
        grouped["value"] = grouped["value"].round(2)
        grouped = grouped.sort_values(by="value", ascending=False).head(50)

        return grouped.to_dict(orient="records")

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))