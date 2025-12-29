import requests # type: ignore
import random
import time

BASE_URL = "http://localhost:8000"

# --- DATOS: PRODUCTOS (20 Items con Stock variado) ---
products = [
    # CAFÉS EN GRANO (Mucha rotación, algunos en alerta)
    {"name": "Etiopía Yirgacheffe", "description": "Notas florales y cítricas.", "price": 18.50, "category": "Café en Grano", "image_url": "https://images.unsplash.com/photo-1611854779393-1b2ae9e07d73?w=500", "stock": 2}, # ALARMA ROJA
    {"name": "Colombia Huila", "description": "Cuerpo medio, notas a caramelo.", "price": 16.00, "category": "Café en Grano", "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500", "stock": 4}, # ALARMA NARANJA/ROJA
    {"name": "Brasil Santos", "description": "Baja acidez, muy dulce.", "price": 14.50, "category": "Café en Grano", "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500", "stock": 45},
    {"name": "Kenya AA", "description": "Intenso, con notas de frutos rojos.", "price": 22.00, "category": "Café en Grano", "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500", "stock": 1}, # ALARMA CRÍTICA
    {"name": "Guatemala Antigua", "description": "Especiado y ahumado.", "price": 19.00, "category": "Café en Grano", "image_url": "https://images.unsplash.com/photo-1510707577719-5d6835698445?w=500", "stock": 12},
    {"name": "Sumatra Mandheling", "description": "Terroso y cuerpo pesado.", "price": 20.50, "category": "Café en Grano", "image_url": "https://images.unsplash.com/photo-1521302080334-4be99c3044a9?w=500", "stock": 8},
    {"name": "Costa Rica Tarrazú", "description": "Limpio y muy equilibrado.", "price": 17.50, "category": "Café en Grano", "image_url": "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500", "stock": 3}, # ALARMA
    {"name": "Espresso Italiano Blend", "description": "Mezcla robusta para espresso.", "price": 13.00, "category": "Café en Grano", "image_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500", "stock": 100},

    # CAFÉS MOLIDO
    {"name": "Descafeinado Suizo", "description": "Proceso al agua, sin químicos.", "price": 15.00, "category": "Café Molido", "image_url": "https://images.unsplash.com/photo-1621262968392-4f3df757279e?w=500", "stock": 20},
    {"name": "Moka Java", "description": "La mezcla más antigua del mundo.", "price": 16.50, "category": "Café Molido", "image_url": "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500", "stock": 4}, # ALARMA
    {"name": "French Roast", "description": "Tueste oscuro, sabor ahumado.", "price": 14.00, "category": "Café Molido", "image_url": "https://images.unsplash.com/photo-1504630083234-141a7a968a57?w=500", "stock": 15},
    {"name": "Breakfast Blend", "description": "Suave y ligero.", "price": 12.50, "category": "Café Molido", "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500", "stock": 30},
    {"name": "Avellana Vainilla", "description": "Aromatizado naturalmente.", "price": 13.50, "category": "Café Molido", "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500", "stock": 2}, # ALARMA
    {"name": "Pack Degustación Molido", "description": "3 variedades de 250g cada una.", "price": 28.00, "category": "Café Molido", "image_url": "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500", "stock": 10},

    # ACCESORIOS (Menos stock por ser productos caros)
    {"name": "Chemex 6 Tazas", "description": "Diseño clásico de filtro.", "price": 48.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1544787210-2213d6429f36?w=500", "stock": 5},
    {"name": "Molinillo Hario Skerton", "description": "Muelas de cerámica.", "price": 35.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1517080315802-196f1b1b22e1?w=500", "stock": 2}, # ALARMA
    {"name": "Aeropress Original", "description": "Versátil y portátil.", "price": 32.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1524350300060-337ce2a057ba?w=500", "stock": 14},
    {"name": "Báscula de Precisión", "description": "Con cronómetro integrado.", "price": 22.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500", "stock": 0}, # SIN STOCK
    {"name": "Tetera Cuello de Cisne", "description": "Control total del vertido.", "price": 40.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1565452347101-79b9ae7d121c?w=500", "stock": 6},
    {"name": "Juego Tazas Espresso", "description": "Cerámica doble pared.", "price": 25.00, "category": "Accesorios", "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500", "stock": 20}
]

users = [
    {"email": "admin@elgranodeoro.com", "password": "admin"},
    {"email": "bot1@test.com", "password": "123"},
    {"email": "bot2@test.com", "password": "123"},
]

def seed():
    print("🚀 Cargando inventario con gestión de stock...")
    
    # Crear Productos
    for p in products:
        requests.post(f"{BASE_URL}/products/", json=p)
    
    # Crear Usuarios
    for u in users:
        requests.post(f"{BASE_URL}/users/", json=u)

    # Crear algunas interacciones para la IA
    # Simulamos que al admin le gusta el café en grano con poco stock
    for pid in [1, 2, 7]:
        requests.post(f"{BASE_URL}/interactions/", json={"user_id": 1, "product_id": pid, "action": "buy"})
    
    # Entrenar IA
    requests.post(f"{BASE_URL}/train")
    print("✅ Sistema listo. Revisa el panel de admin para ver las alertas de stock.")

if __name__ == "__main__":
    seed()