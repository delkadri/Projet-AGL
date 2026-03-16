FROM node:22-alpine

WORKDIR /app

# Install dependencies first (better Docker cache usage)
COPY package.json package-lock.json ./
RUN npm install

# Copy application source and generate Prisma client for container platform
COPY . .
RUN npx prisma generate

EXPOSE 8000

CMD ["npm", "run", "start:dev"]
