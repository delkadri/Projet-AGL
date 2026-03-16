FROM node:22-alpine

WORKDIR /app

# Install dependencies first (better Docker cache usage)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

EXPOSE 8000

CMD ["npm", "run", "start:dev"]
