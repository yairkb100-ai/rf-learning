# Backend (Node/Express + TypeScript) - build for Railway
# Includes repo-root database/ so auto-migrations run on startup.
FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./backend/
RUN cd backend && npm install
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src
COPY database ./database
COPY backend/uploads ./backend/uploads
RUN cd backend && npm run build
WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "start"]
