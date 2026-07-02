FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source code
COPY . .

# Prisma generate (if using Prisma)
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "start"]
