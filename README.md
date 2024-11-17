# Passkey Authentication API

A secure, WebAuthn-based authentication system built with NestJS that implements passwordless authentication using passkeys.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Using Docker](#using-docker)
  - [Without Docker](#without-docker)
- [Development Setup](#development-setup)
  - [HTTPS for localhost](#https-for-localhost)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (v15 or higher)
- Docker & Docker Compose (for containerized setup)
- mkcert (for local HTTPS setup)

## Installation

### Using Docker

1. Clone the repository:

```bash
git clone https://github.com/tarunvaddeSoul/passkey-auth.git
cd passkey-auth
```

2. Create `.env` file:

```bash
cp .env.sample .env
```

3. Start the application:

```bash
# Development mode
docker compose up -d

# Apply prisma generate
docker compose exec api npx prisma generate
docker compose exec api npx prisma db push
```

4. Access the application:

- API: <https://localhost:3000>
- Swagger Documentation: <https://localhost:3000/api>

### Without Docker

1. Clone the repository:

```bash
git clone https://github.com/tarunvaddeSoul/passkey-auth.git
cd passkey-auth
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
# Create a PostgreSQL database
createdb passkey_db

# Apply prisma
npx prisma generate
npx prisma db push
```

4. Create `.env` file:

```bash
cp .env.example .env
```

5. Start the application:

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Development Setup

### HTTPS for localhost

1. Install mkcert:

```bash
# macOS
brew install mkcert
mkcert -install

# Ubuntu/Debian
apt install mkcert
mkcert -install

# Windows (using Chocolatey)
choco install mkcert
mkcert -install
```

2. Generate certificates:

```bash
mkcert localhost
```

3. Update certificate paths in your code:

```typescript
// main.ts
const httpsOptions = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem'),
};
```

4. Trust the certificates:

```bash
# The certificates should be automatically trusted after running mkcert -install
# You can verify by opening https://localhost:3000 in your browser
```

## API Documentation

Once the application is running, visit <https://localhost:3000/api> for the Swagger documentation.

### Authentication Flow

1. Registration
![Registration Flow](docs/registration-flow.png)
2. Authentication
![Authentication Flow](docs/authentication-flow.png)

## Environment Variables

```env
# Application
PORT=3000
RP_NAME=Your App Name
RP_ID=localhost
ORIGIN=https://localhost:3000

# Database
POSTGRES_USER=passkey_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=passkey_db
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}
```
