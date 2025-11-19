FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "start"]
