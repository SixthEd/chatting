# Use Node base image
FROM node:lts

# Set working directory
WORKDIR /app

# Copy package files and install dependencies separately for better caching
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN cd backend && npm install && \
    cd ../frontend && npm install

# Copy all project files
COPY . .

# Install nodemon globally for backend
RUN npm install -g nodemon

# Expose backend (3000) and frontend (4000) ports
EXPOSE 4000 3000

# Start both frontend and backend concurrently
RUN true

CMD ["sh", "-c", "sleep 30 && cd backend && nodemon index.js & cd frontend/src && npm start index.js"]
