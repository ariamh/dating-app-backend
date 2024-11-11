# Backend Dating Apps

Backend service untuk aplikasi dating yang dibangun dengan TypeScript, Node.js dan MongoDB. Project ini dibuat sebagai bagian dari technical test untuk posisi Senior Software Engineer.

## Tech Stack
- TypeScript
- Node.js (Express.js)
- MongoDB
- Jest (Testing)
- ESLint & Prettier (Linting & Formatting)

## Struktur Project
```
dating-app-backend/
├── coverage/              # Test coverage reports
├── node_modules/         # Dependencies
├── src/                  # Source code
│   ├── controllers/      # Controller layer
│   │   ├── auth.controller.ts
│   │   ├── premium.controller.ts
│   │   └── swipe.controller.ts
│   ├── middlewares/     # Custom middleware
│   │   └── auth.middlewares.ts
│   ├── models/          # Database models
│   │   ├── seeders/    # Database seeders
│   │   │   └── userSeeder.ts
│   │   └── user.model.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── premium.routes.ts
│   │   └── swipe.routes.ts
│   ├── tests/          # Test files
│   │   ├── auth.test.ts
│   │   ├── premium.test.ts
│   │   └── swipe.test.ts
│   ├── app.ts          # App configuration
│   └── index.ts        # Entry point
├── .gitignore          # Git ignore file
├── eslint.config.mjs   # ESLint configuration
├── jest.setup.ts       # Jest setup file
├── package-lock.json   # Lock file
├── package.json        # Project dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- npm/yarn

## Instalasi

1. Clone repository
```bash
git clone [repository-url]
cd dating-app-backend
```

2. Install dependencies
```bash
npm install
```

3. Setup database MongoDB
- Pastikan MongoDB sudah terinstall dan berjalan
- Database akan dibuat otomatis saat aplikasi pertama kali dijalankan

4. Seed database (optional)
```bash
npm run seed:users
```

## Available Scripts

```json
{
  "scripts": {
    "start": "ts-node src/index.ts",
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "test": "jest",
    "seed:users": "ts-node src/models/seeders/userSeeder.ts",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "coverage": "jest --coverage"
  }
}
```

### Penggunaan Scripts

1. Development
```bash
# Menjalankan aplikasi
npm start

# Menjalankan dengan hot-reload
npm run dev
```

2. Database Seeding
```bash
# Mengisi database dengan data users
npm run seed:users
```

3. Testing
```bash
# Menjalankan semua unit test
npm test

# Melihat coverage report
npm run coverage

# Test file spesifik
npm test -- auth.test.ts
npm test -- premium.test.ts
npm test -- swipe.test.ts
```

4. Code Quality
```bash
# Menjalankan linter
npm run lint

# Memperbaiki lint errors
npm run lint:fix

# Format kode
npm run format
```

5. Production
```bash
# Build project
npm run build
```

## API Endpoints

### Authentication
```typescript
// Register new user
router.post('/register', validateRegister, register);

// Login user
router.post('/login', validateLogin, login);
```

### Swipe Functionality
```typescript
// Swipe action
router.post("/", authenticateToken, swipe);
```

### Premium Features
```typescript
// Purchase premium
router.post("/", authenticateToken, purchasePremium);
```

## Authentication Flow

### Register
1. Validasi input menggunakan middleware
2. Hash password sebelum menyimpan ke database
3. Generate JWT token setelah registrasi berhasil
4. Return token ke client

### Login
1. Validasi credentials
2. Compare password hash
3. Generate JWT token untuk session
4. Return token ke client

### Protected Routes
- Semua routes kecuali register dan login memerlukan authentication
- Validasi JWT token menggunakan authenticateToken middleware
- Token harus disertakan di header: `Authorization: Bearer <token>`

## Testing Strategy

### Unit Tests
- Controllers testing
- Middleware testing
- Routes integration testing
- Mock database calls
- Coverage minimal 80%

### Test Files
- `auth.test.ts`: Authentication test cases
- `premium.test.ts`: Premium features test cases
- `swipe.test.ts`: Swipe functionality test cases

## Development

### Port
Server berjalan pada `http://localhost:5000`

### Code Style
- ESLint untuk linting
- Prettier untuk formatting
- TypeScript strict mode enabled

### Best Practices
- Menggunakan async/await untuk operasi asynchronous
- Error handling menggunakan try-catch
- Validasi input pada middleware
- Penggunaan TypeScript interfaces dan types
- Clean code principles
- Modular structure

## Notes
- Semua endpoints kecuali authentication memerlukan valid JWT token
- Password di-hash menggunakan bcrypt
- Response menggunakan format JSON
- Error handling mencakup validation errors dan server errors
- Testing mencakup positive dan negative test cases