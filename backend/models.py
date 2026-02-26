from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

# --- 1. Tabla de Usuarios ---
class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  
    is_active = Column(Boolean, default=True)
    
    interactions = relationship("Interaction", back_populates="user")

# --- 2. Tabla de Productos ---
class Product(Base):
    __tablename__ = "products"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=10)
    category = Column(String, index=True)
    # Imagen por defecto de café real para que la web luzca bien
    image_url = Column(String, default="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400")

    interactions = relationship("Interaction", back_populates="product")

# --- 3. Tabla de Interacciones ---
class Interaction(Base):
    __tablename__ = "interactions"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) 
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    action = Column(String, default="view") 

    user = relationship("User", back_populates="interactions")
    product = relationship("Product", back_populates="interactions")

# --- 4. Tabla de Pedidos (Añadir al final de models.py) ---
class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    total = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    items_summary = Column(String)  # Guardaremos "2x Café, 1x Prensa"
    address = Column(String)
    status = Column(String, default="pending") # pending, shipped


