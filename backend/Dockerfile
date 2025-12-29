# Usamos Python 3.10 como base
FROM python:3.10

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# 1. Copiamos solo el archivo de requisitos primero (para aprovechar la caché de Docker)
COPY requirements.txt .

# 2. Instalamos las dependencias (FastAPI, Pandas, SQLAlchemy, etc.)
# Añadimos --no-cache-dir para que la imagen sea más ligera
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copiamos el resto del código (main.py, ml_core.py, etc.)
COPY . .

# 1. Damos permisos de ejecución al script (por si acaso se perdieron)
RUN chmod +x start.sh

# 2. Le decimos a Docker que ejecute el script en lugar de uvicorn directo
CMD ["./start.sh"]