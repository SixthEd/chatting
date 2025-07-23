FROM node:lts AS frontend

WORKDIR /app/frontend
COPY frontend/ ./
RUN npm install
RUN npm run build

# --- Backend Stage ---
FROM node:lts AS backend

WORKDIR /app/backend
COPY backend/ ./
RUN npm install

# Copy built frontend from frontend stage
RUN mkdir -p /app/frontend/build
COPY --from=frontend /app/frontend/build /app/frontend/build

CMD ["/bin/bash", "-c", "node index.js"]
