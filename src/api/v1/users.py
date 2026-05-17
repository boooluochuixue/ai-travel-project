from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.models.schemas import UserCreate, UserResponse
from src.models.tables import User

router = APIRouter(prefix="/users", tags=["users"])


@router.post("")
async def create_user(
    req: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    user = User(**req.model_dump())
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return {"code": 0, "data": UserResponse.model_validate(user)}


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return {"code": 40400, "message": "用户不存在", "data": None}
    return {"code": 0, "data": UserResponse.model_validate(user)}
