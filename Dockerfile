FROM node:22-alpine

WORKDIR /app

COPY frontend ./frontend
COPY backend ./backend
 
WORKDIR /app/frontend
RUN npm install && npm run build
 
WORKDIR /app/backend
RUN npm install

COPY backend/. .
COPY backend/.ENV .env

CMD ["npm", "run", "dev"]