# Real Estate API

## Local run
1. Install deps:
    - npm install
2. Copy env:
    - cp .env.example .env
3. Fill required env values in `.env`.
4. Build and run:
    - npm run build
    - npm run dev

## Docker run
1. Copy env:
    - cp .env.example .env
2. Start services:
    - docker compose up -d --build
3. Tail logs:
    - docker compose logs -f api
4. Health check:
    - curl http://localhost:3000/api/health
5. Stop:
    - docker compose down

## Environment variables
Required:
- MONGO_URI
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET

Optional:
- NODE_ENV
- PORT
- ACCESS_EXPIRESIN
- REFRESH_EXPIRESIN
- ALGORITHM
- ACCESS_COOKIE_NAME
- REFRESH_COOKIE_NAME
- ACCESS_COOKIE_MAX_AGE_MS
- REFRESH_COOKIE_MAX_AGE_MS
- COOKIE_SAMESITE

Docker-specific:
- MONGO_ROOT_USERNAME
- MONGO_ROOT_PASSWORD
- MONGO_DB_NAME
