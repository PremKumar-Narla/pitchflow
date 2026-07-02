from fastapi import APIRouter
from pydantic import BaseModel
from ai.chatbot import get_response

router = APIRouter()

class ChatMessage(BaseModel):
    session_id: str
    message: str
    vendor_name: str
    project_title: str
    quoted_rate: float
    description: str = ""

@router.post("/message")
def send_message(body: ChatMessage):
    result = get_response(
        session_id=body.session_id,
        user_message=body.message,
        vendor_name=body.vendor_name,
        project_title=body.project_title,
        quoted_rate=body.quoted_rate,
    )
    return result
