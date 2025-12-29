#!/bin/sh

echo "⏳ Esperando 10 segundos a que la base de datos despierte..."
sleep 10


# 1. Ejecutamos el script de entrenamiento que acabamos de crear
python train.py

# 2. Una vez termine, arrancamos la API
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload