# Usamos una imagen ligera de Node.js (el motor de React)
FROM node:22-alpine

# Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de "receta" de dependencias
COPY package.json .

# Instalamos las dependencias dentro del contenedor
RUN npm install

# Copiamos el resto del código
COPY . .

# Abrimos el puerto 5173 (donde vive Vite/React)
EXPOSE 5173

# Comando para arrancar el servidor
CMD ["npm", "run", "dev", "--", "--host"]