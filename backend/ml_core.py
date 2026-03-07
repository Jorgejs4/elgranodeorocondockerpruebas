import pandas as pd
from sklearn.neighbors import NearestNeighbors
import pickle
import os
import models
from sqlalchemy.orm import Session
from sqlalchemy import func

MODEL_PATH = "recommender.pkl"

def train_model(db: Session):
    interactions = db.query(models.Interaction).all()
    if not interactions:
        print("[ML] No hay interacciones para entrenar.")
        return

    data = []
    for i in interactions:
        # Aseguramos compatibilidad si la columna se llama action o action_type
        action = getattr(i, 'action_type', getattr(i, 'action', 'view'))
        score = 1 if action == "view" else 3
        data.append({"user_id": i.user_id, "product_id": i.product_id, "score": score})
    
    df = pd.DataFrame(data)
    user_item_matrix = df.pivot_table(index='user_id', columns='product_id', values='score').fillna(0)
    
    model = NearestNeighbors(metric='cosine', algorithm='brute')
    model.fit(user_item_matrix.values)
    
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump((model, user_item_matrix), f)
    print(f"[ML] Modelo entrenado con {len(interactions)} interacciones.")

def get_recommendations(user_id, db, n=3):
    try:
        if not os.path.exists(MODEL_PATH):
            raise Exception("Modelo no entrenado")

        with open(MODEL_PATH, 'rb') as f:
            model, user_item_matrix = pickle.load(f)

        if user_id not in user_item_matrix.index:
            # Usuario nuevo -> Devolver populares (solo con stock)
            products = db.query(models.Product.id).filter(models.Product.stock > 0).limit(n).all()
            return [p[0] for p in products]

        user_vector = user_item_matrix.loc[user_id].values.reshape(1, -1)
        
        # Evitamos que pete si hay menos productos que n
        n_neighbors = min(n + 1, len(user_item_matrix))
        distances, indices = model.kneighbors(user_vector, n_neighbors=n_neighbors)
        
        if len(indices.flatten()) > 1:
            similar_user_index = user_item_matrix.index[indices.flatten()[1]]
            recommended_products = user_item_matrix.loc[similar_user_index]
            recommended_ids = recommended_products[recommended_products > 0].index.tolist()
        else:
            recommended_ids = []

        # Retornamos recomendaciones asegurando que HAY STOCK
        if recommended_ids:
            products = db.query(models.Product.id).filter(models.Product.id.in_(recommended_ids), models.Product.stock > 0).limit(n).all()
            return [p[0] for p in products]
        else:
            products = db.query(models.Product.id).filter(models.Product.stock > 0).limit(n).all()
            return [p[0] for p in products]

    except Exception as e:
        print(f"[ML] Error en recomendaciones: {e}")
        products = db.query(models.Product.id).filter(models.Product.stock > 0).limit(n).all()
        return [p[0] for p in products]

def generate_business_insights(db: Session):
    interactions = db.query(models.Interaction).all()
    if not interactions:
        return {"mensaje": "Aún no hay suficientes datos para analizar."}
    
    data = []
    for i in interactions:
        action = getattr(i, 'action_type', getattr(i, 'action', 'view'))
        
        # Validación en caso de que alguna fila no tenga hora (seguridad extra)
        hour = i.timestamp.hour if hasattr(i, 'timestamp') and i.timestamp else 12
        day = i.timestamp.weekday() if hasattr(i, 'timestamp') and i.timestamp else 0

        data.append({
            "action": action,
            "product_id": i.product_id,
            "hour": hour,
            "day": day
        })
        
    df = pd.DataFrame(data)
    
    # --- CONCLUSIONES AUTOMÁTICAS ---
    purchases = df[df['action'] == 'purchase']
    if not purchases.empty:
        # AQUÍ ESTÁ LA MAGIA: int() elimina el maldito numpy.int64
        best_hour = int(purchases['hour'].mode()[0])
    else:
        best_hour = "No hay compras"
    
    views = df[df['action'] == 'view']
    if not views.empty:
        most_viewed_id = int(views['product_id'].mode()[0])
    else:
        most_viewed_id = None
    
    total_views = len(views)
    total_purchases = len(purchases)
    conversion_rate = float((total_purchases / total_views) * 100) if total_views > 0 else 0.0
    
    return {
        "hora_pico_ventas": best_hour,
        "producto_mas_visitado_id": most_viewed_id,
        "tasa_conversion": round(conversion_rate, 2),
        "consejo_ia": f"Tus clientes interactúan más a las {best_hour}:00. Te sugiero enviar correos promocionales 1 hora antes." if isinstance(best_hour, int) else "Faltan compras para el análisis."
    }