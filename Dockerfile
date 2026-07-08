# Backend (Node/Express + TypeScript) — build for Railway
# Includes repo-root database/ so auto-migrations run on startup.
FROM node:20-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src
COPY database ./database
RUN cd backend && npm run build
RUN mkdir -p /app/backend/uploads
WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "start"]
