from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ==========================
# ESQUEMAS DE PRODUCTOS
# ==========================
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    stock: int = 10
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass 

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

# ==========================
# ESQUEMAS DE USUARIOS
# ==========================
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool = True
    class Config:
        from_attributes = True

# Alias para compatibilidad con main.py
UserResponse = User

# ==========================
# ESQUEMAS DE INTERACCIONES
# ==========================
class InteractionBase(BaseModel):
    user_id: int
    product_id: int
    action: str 

class InteractionCreate(InteractionBase):
    pass

class Interaction(InteractionBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# ESTA LÍNEA ES LA QUE SOLUCIONA TU ERROR
InteractionResponse = Interaction