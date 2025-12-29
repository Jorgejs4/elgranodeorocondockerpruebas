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