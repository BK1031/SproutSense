from fastapi import APIRouter

from ingest.config.config import VERSION

router = APIRouter()

@router.get("/ping", tags=["Health"])
async def ping():
    """
    Health check endpoint that returns a simple response to verify the service is running.
    """
    return {"message": f"Ingest v{VERSION} is online!"}
