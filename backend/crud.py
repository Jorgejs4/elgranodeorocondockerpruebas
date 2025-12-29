from sqlalchemy.orm import Session
import models, schemas

# --- PRODUCTOS ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        db.delete(db_product)
        db.commit()
    return db_product

# --- USUARIOS ---
def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def delete_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return user

# --- INTERACCIONES ---
def get_interactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Interaction).offset(skip).limit(limit).all()

def delete_interaction(db: Session, interaction_id: int):
    interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
    if interaction:
        db.delete(interaction)
        db.commit()
    return interaction