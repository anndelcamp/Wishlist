FROM node:20-slim

# Build deps for better-sqlite3 native addon
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Data directory for SQLite — mount a volume here in production
RUN mkdir -p /app/data

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
