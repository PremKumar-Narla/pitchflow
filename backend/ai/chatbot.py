from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from .prompts import NEGOTIATION_SYSTEM_PROMPT, DEAL_MARKER
from .knowledge_base import retrieve_context
from dotenv import load_dotenv
import os
import re

load_dotenv()

conversation_store: dict[str, list] = {}

def get_llm():
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

def get_response(
    session_id: str,
    user_message: str,
    vendor_name: str,
    project_title: str,
    quoted_rate: float,
) -> dict:
    target_budget = quoted_rate * 0.80
    max_budget = quoted_rate * 0.90

    context = retrieve_context(f"{project_title} budget negotiation vendor")

    system_prompt = NEGOTIATION_SYSTEM_PROMPT.format(
        vendor_name=vendor_name,
        project_title=project_title,
        quoted_rate=quoted_rate,
        target_budget=round(target_budget),
        max_budget=round(max_budget),
        context=context,
    )

    if session_id not in conversation_store:
        conversation_store[session_id] = []

    history = conversation_store[session_id]
    history.append(HumanMessage(content=user_message))

    messages = [SystemMessage(content=system_prompt)] + history
    llm = get_llm()
    response = llm.invoke(messages)
    reply = response.content

    history.append(AIMessage(content=reply))
    conversation_store[session_id] = history

    deal_reached = DEAL_MARKER in reply
    agreed_price = None
    clean_reply = reply

    if deal_reached:
        match = re.search(r"DEAL_CONFIRMED:\$?([\d,]+)", reply)
        if match:
            agreed_price = float(match.group(1).replace(",", ""))
        clean_reply = reply.replace(f"{DEAL_MARKER}${int(agreed_price)}", "").strip()

    return {
        "reply": clean_reply,
        "deal_reached": deal_reached,
        "agreed_price": agreed_price,
    }
