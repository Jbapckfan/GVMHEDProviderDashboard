FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory with subdirectories for database and uploads
RUN mkdir -p /data/db /data/uploads

EXPOSE 3001

CMD ["npm", "start"]
