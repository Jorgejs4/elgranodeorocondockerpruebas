from ml_core import train_model
from database import SessionLocal
import sys
#para que la IA se entrene sola al iniciar Docker
def main():
    try:
        print("--- 🧠 INICIANDO ENTRENAMIENTO AUTOMÁTICO ---")
        db = SessionLocal()
        train_model(db)
        print("--- ✅ ENTRENAMIENTO COMPLETADO ---")
    except Exception as e:
        print(f"--- ⚠️ NO SE PUDO ENTRENAR (Probablemente DB vacía): {e} ---")
        # No detenemos el programa, dejamos que el servidor arranque igual
        pass 

if __name__ == "__main__":
    main()