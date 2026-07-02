from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date

router = APIRouter()

_engagement_store: dict[str, dict] = {}
_invoices: dict[str, dict] = {}

class EngagementUpdate(BaseModel):
    session_id: str
    video_id: str
    watch_percent: float

class InvoiceRequest(BaseModel):
    session_id: str
    project_name: str
    vendor_name: str
    agreed_price: float

@router.post("/track")
def track_engagement(update: EngagementUpdate):
    _engagement_store.setdefault(update.session_id, {})
    _engagement_store[update.session_id][update.video_id] = update.watch_percent
    return {"status": "tracked"}

@router.get("/{session_id}")
def get_engagement(session_id: str):
    return _engagement_store.get(session_id, {})

@router.post("/invoice")
def create_invoice(req: InvoiceRequest):
    invoice = {
        "invoice_id": f"INV-{len(_invoices) + 1:04d}",
        "project_name": req.project_name,
        "vendor_name": req.vendor_name,
        "agreed_price": req.agreed_price,
        "date_issued": str(date.today()),
        "status": "issued",
    }
    _invoices[req.session_id] = invoice
    return invoice

@router.get("/invoice/{session_id}")
def get_invoice(session_id: str):
    return _invoices.get(session_id, {"status": "no invoice yet"})
