# AI Sticker Generator Backend

A Node.js/Express backend API for the AI Sticker Generator application, providing user authentication and credit management functionality.

## Features

### Authentication System
- **User Registration**: Create new user accounts with email/password
- **User Login**: JWT-based authentication
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Middleware**: Secure route protection
- **Input Validation**: Email format and password strength validation

### Credit Management System
- **Credit Validation**: Check if users have sufficient credits
- **Credit Deduction**: Consume credits for sticker generation
- **Credit Addition**: Purchase credits for user accounts
- **Refund Processing**: Process refunds for failed operations
- **Transaction History**: Track all credit operations
- **Balance Tracking**: Real-time credit balance management

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user profile (requires auth)

### Credits (`/api/credits`)
- `GET /balance` - Get user credit balance (requires auth)
- `POST /validate` - Validate sufficient credits (requires auth)
- `POST /deduct` - Deduct credits (requires auth)
- `POST /add` - Add credits (requires auth)
- `POST /refund` - Process refund (requires auth)
- `GET /transactions` - Get transaction history (requires auth)

### Health Check
- `GET /health` - Server health status

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

## Architecture

### Models
- **User**: User account with authentication and credit balance
- **CreditTransaction**: Credit operation tracking (purchase/consumption/refund)

### Services
- **AuthenticationService**: User registration, login, and management
- **CreditManagementService**: Credit operations and validation

### Middleware
- **AuthMiddleware**: JWT token validation and route protection
- **Security**: Helmet, CORS, rate limiting

## Testing

The backend includes comprehensive test coverage:

- **Unit Tests**: Models and services
- **Integration Tests**: API endpoints
- **Authentication Tests**: JWT and middleware
- **Credit Management Tests**: All credit operations

```bash
# Run all tests
npm test

# Run specific test file
npm test -- User.test.ts

# Run tests with coverage
npm test -- --coverage
```

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable origin restrictions
- **Helmet Security**: Security headers and protections

## Requirements Fulfilled

This implementation satisfies the following requirements from the specification:

### Requirement 7.1 (User Credit Management)
- ✅ New users receive 10 free credits upon registration
- ✅ Credit validation before sticker generation
- ✅ Credit balance tracking and updates

### Requirement 7.2 (Credit Consumption)
- ✅ Credit deduction for sticker generation operations
- ✅ Insufficient credit handling with appropriate error messages

### Requirement 7.3 (Credit Display)
- ✅ Real-time credit balance retrieval
- ✅ Transaction history tracking

### Requirement 8.3 (Authentication)
- ✅ Secure user registration and login
- ✅ JWT-based session management
- ✅ Password security with bcrypt hashing

## Data Storage

Currently uses in-memory storage for development and testing. In production, this should be replaced with:

- **PostgreSQL**: User accounts and credit transactions
- **Redis**: Session management and caching
- **Cloud Storage**: File uploads and sticker storage

## Next Steps

1. **Database Integration**: Replace in-memory storage with PostgreSQL
2. **Payment Integration**: Add Stripe/PayPal for credit purchases
3. **File Upload**: Implement image upload handling
4. **AI Integration**: Connect to Google Vertex AI for sticker generation
5. **Monitoring**: Add logging and error tracking
6. **Deployment**: Docker containerization and cloud deployment