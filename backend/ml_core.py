import pandas as pd
from sklearn.neighbors import NearestNeighbors
import pickle
import os
import models

MODEL_PATH = "recommender.pkl"

def train_model(db):
    # 1. Obtener datos de la base de datos
    interactions = db.query(models.Interaction).all()
    if not interactions:
        print("[ML] No hay interacciones para entrenar.")
        return

    # 2. Crear un DataFrame
    data = []
    for i in interactions:
        # Asignamos un valor numérico a la acción
        score = 1 if i.action == "view" else 3
        data.append({"user_id": i.user_id, "product_id": i.product_id, "score": score})
    
    df = pd.DataFrame(data)
    
    # 3. Crear matriz Pivot (Usuarios vs Productos)
    user_item_matrix = df.pivot_table(index='user_id', columns='product_id', values='score').fillna(0)
    
    # 4. Entrenar modelo KNN
    model = NearestNeighbors(metric='cosine', algorithm='brute')
    model.fit(user_item_matrix.values)
    
    # 5. Guardar modelo y la estructura de la matriz
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
            # Si el usuario es nuevo, devolvemos productos populares
            print(f"[ML] Usuario {user_id} nuevo. Devolviendo populares.")
            products = db.query(models.Product.id).limit(n).all()
            return [p[0] for p in products]

        # Lógica de recomendación KNN
        user_vector = user_item_matrix.loc[user_id].values.reshape(1, -1)
        distances, indices = model.kneighbors(user_vector, n_neighbors=n+1)
        
        # Obtenemos productos de usuarios similares
        similar_user_index = user_item_matrix.index[indices.flatten()[1]]
        recommended_products = user_item_matrix.loc[similar_user_index]
        recommended_ids = recommended_products[recommended_products > 0].index.tolist()

        return recommended_ids[:n]

    except Exception as e:
        print(f"[ML] Error en recomendaciones: {e}")
        # Si falla algo, devolvemos los primeros productos que existan
        products = db.query(models.Product.id).limit(n).all()
        return [p[0] for p in products]
    
def get_popular_products(db, n=4):
    """Calcula los productos con más interacciones en la base de datos."""
    from sqlalchemy import func
    # Contamos cuántas interacciones tiene cada producto
    popular_ids = db.query(
        models.Interaction.product_id, 
        func.count(models.Interaction.id).label('total')
    ).group_by(models.Interaction.product_id)\
     .order_by(func.count(models.Interaction.id).desc())\
     .limit(n).all()
    
    if not popular_ids:
        # Si no hay interacciones aún, devolvemos los últimos productos añadidos
        return [p.id for p in db.query(models.Product.id).limit(n).all()]
        
    return [p[0] for p in popular_ids]


from sqlalchemy.orm import Session
import pandas as pd
import models

def generate_business_insights(db: Session):
    # Obtener todas las interacciones
    interactions = db.query(models.Interaction).all()
    if not interactions:
        return {"mensaje": "Aún no hay suficientes datos para analizar."}
    
    # Convertir a DataFrame de Pandas para analizar fácilmente
    data = []
    for i in interactions:
        data.append({
            "action": i.action_type,
            "product_id": i.product_id,
            "hour": i.timestamp.hour,
            "day": i.timestamp.weekday() # 0 = Lunes, 6 = Domingo
        })
    df = pd.DataFrame(data)
    
    # --- CONCLUSIONES AUTOMÁTICAS ---
    
    # 1. ¿A qué hora compra más la gente?
    purchases = df[df['action'] == 'purchase']
    best_hour = purchases['hour'].mode()[0] if not purchases.empty else "No hay compras"
    
    # 2. Producto más visto
    views = df[df['action'] == 'view']
    most_viewed_id = views['product_id'].mode()[0] if not views.empty else None
    
    # 3. Tasa de conversión (Vistos vs Comprados)
    total_views = len(views)
    total_purchases = len(purchases)
    conversion_rate = (total_purchases / total_views * 100) if total_views > 0 else 0
    
    return {
        "hora_pico_ventas": int(best_hour) if isinstance(best_hour, (int, float)) else best_hour,
        "producto_mas_visitado_id": int(most_viewed_id) if most_viewed_id else None,
        "tasa_conversion": round(conversion_rate, 2),
        "consejo_ia": f"Tus clientes interactúan más a las {best_hour}:00. Te sugiero enviar correos promocionales 1 hora antes." if isinstance(best_hour, (int, float)) else "Necesitamos más datos."
    }