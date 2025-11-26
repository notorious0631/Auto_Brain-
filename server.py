from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from langchain_helper import create_vector_db, get_qa_chain
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str

from fastapi import File, UploadFile
import shutil

@app.post("/create_knowledge")
async def create_knowledge_endpoint(file: UploadFile = File(...)):
    try:
        # Save the uploaded file locally
        file_location = f"uploaded_{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        create_vector_db(file_path=file_location)
        return {"status": "success", "message": "Knowledge base created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question_endpoint(request: QuestionRequest):
    try:
        chain = get_qa_chain()
        response = chain.invoke(request.question)
        return {"answer": response["result"]}
    except Exception as e:
        # If the vector DB hasn't been created yet, this might fail
        if "faiss_index" not in str(e) and not os.path.exists("faiss_index"):
             raise HTTPException(status_code=400, detail="Knowledge base not found. Please create knowledge first.")
        raise HTTPException(status_code=500, detail=str(e))

# Serve static files (frontend)
# We mount the 'frontend' directory to the root '/'
# This expects a 'frontend' directory to exist in the same folder
if os.path.exists("frontend"):
    app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
