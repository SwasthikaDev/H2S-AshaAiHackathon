from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import httpx
import json
from datetime import datetime
from rag_system import AshaRAGSystem

# Load environment variables
load_dotenv()

# Initialize RAG system
rag_system = AshaRAGSystem()

# Define request models
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class FeedbackRequest(BaseModel):
    message_id: str
    rating: int
    comment: Optional[str] = None

# Initialize API clients
async def get_jobs_api():
    return httpx.AsyncClient(base_url=os.getenv("JOBS_API_URL"))

async def get_events_api():
    return httpx.AsyncClient(base_url=os.getenv("EVENTS_API_URL"))

app = FastAPI(
    title="Asha AI Chatbot API",
    description="API for the Asha AI Chatbot - JobsForHer Foundation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/chat")
async def chat(
    request: ChatRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Process user messages and return AI responses with bias detection
    """
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message is required")
            
        # Process message through RAG system
        response = rag_system.process_query(request.message)
        
        return {
            **response,
            "conversation_id": request.conversation_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs")
async def get_jobs(
    query: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    """
    Get job listings based on query
    """
    try:
        async with await get_jobs_api() as client:
            params = {"q": query} if query else {}
            response = await client.get("/jobs", params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events")
async def get_events(
    query: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    """
    Get community events based on query
    """
    try:
        async with await get_events_api() as client:
            params = {"q": query} if query else {}
            response = await client.get("/events", params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Submit user feedback for continuous improvement
    """
    try:
        # TODO: Store feedback in database
        return {"status": "success", "message": "Feedback received"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "rag_system": "initialized" if rag_system.vector_store else "initializing"
    }

@app.get("/")
async def root():
    return {"message": "Welcome to Asha AI Chatbot API"}

@app.get("/mentorship")
async def get_mentorship_programs(
    query: Optional[str] = None,
    token: str = Depends(oauth2_scheme)
):
    """
    Get mentorship programs based on query
    """
    try:
        # TODO: Implement mentorship program search logic
        return {"programs": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)