from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base # Ojo: en versiones nuevas es declarative_base directo o desde orm
import os # <--- IMPORTANTE: Necesitamos esto

# 1. INTELIGENCIA:
# Buscamos si existe la variable DATABASE_URL (Docker nos la da).
# Si no existe (estamos en local), usamos la de localhost por defecto.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://user:password@localhost/elgranodeoro"
)

# 2. CREAR EL MOTOR
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. CREAR LA SESIÓN
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. CREAR LA BASE
Base = declarative_base()

# 5. DEPENDENCIA (Para usar en main.py)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()