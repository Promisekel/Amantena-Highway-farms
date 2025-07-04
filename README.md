# 🌾 Amantena Highway Farms - Business Management System

A comprehensive business management web application built for **Amantena Highway Farms** to handle inventory management, sales tracking, staff management, and business analytics.

## 🚀 Features

### 📊 **Dashboard & Analytics**
- Real-time sales metrics and revenue tracking
- Interactive charts showing sales trends and top products
- Low stock alerts with visual indicators
- Staff performance analytics (Admin only)

### 📦 **Inventory Management**
- Complete product catalog with categories
- Stock level monitoring with customizable thresholds
- Bulk quantity updates
- Product image management via Cloudinary
- Search and filter functionality

### 💰 **Sales Tracking**
- Quick sale recording interface
- Automatic stock updates on sales
- Comprehensive sales reports
- Transaction history with detailed records

### 👥 **User Management**
- Role-based access control (Admin/Staff)
- User invitation system via email
- Session-based authentication with Passport.js
- User activity tracking

### 🖼️ **Media Gallery**
- Album-based image organization
- Cloudinary integration for image storage
- Bulk image uploads with automatic optimization
- Image descriptions and metadata

### 📅 **Calendar & Events**
- Farm activity scheduling
- Event categories (Meetings, Harvest, Planting, etc.)
- Upcoming events dashboard
- Real-time event notifications

### 📋 **Project Management**
- Kanban-style project boards
- Task creation and assignment
- Project status tracking
- Priority levels and due dates
- Task status workflow (TODO → In Progress → Review → Done)

### 📊 **Reports & Analytics**
- Sales performance reports with date filtering
- Top-selling products analysis
- Monthly revenue trends
- Exportable reports (CSV/PDF ready)
- Custom date range analytics

### 👥 **User Management** (Admin Only)
- Complete user administration
- Role assignment and permissions
- User activity monitoring
- Bulk user operations
- User status management (active/inactive)

### ✉️ **Invitation System** (Admin Only)
- Email-based user invitations
- Role-specific invitation templates
- Invitation tracking and management
- Custom invitation messages
- Invitation link generation

## 🛠️ Tech Stack

### **Frontend**
- ⚛️ **React.js** - Modern UI framework
- 🎨 **Tailwind CSS** - Utility-first styling
- 📊 **Recharts** - Data visualization
- 🔄 **React Query** - Server state management
- 🌐 **React Router** - Client-side routing
- 📱 **Headless UI** - Accessible components

### **Backend**
- 🟢 **Node.js** - Runtime environment
- 🚀 **Express.js** - Web framework
- 🗃️ **PostgreSQL** - Primary database
- 🔒 **Passport.js** - Authentication
- 📧 **Nodemailer** - Email service
- ⚡ **Socket.IO** - Real-time features

### **Database & ORM**
- 🐘 **PostgreSQL** - Production database
- 📋 **Prisma** - Type-safe ORM
- ☁️ **Neon** - Hosted PostgreSQL

### **File Storage & Media**
- ☁️ **Cloudinary** - Image storage and optimization
- 📤 **Multer** - File upload handling

### **Development & Deployment**
- 🚀 **Netlify** - Frontend hosting
- 🚂 **Railway/Render** - Backend hosting
- 🔧 **Concurrently** - Development scripts

## 📁 Project Structure

```
amantena-highway-farms/
├── backend/                 # Express.js API
│   ├── config/             # Database, email, cloudinary configs
│   ├── middleware/         # Auth, validation, error handling
│   ├── routes/            # API endpoints
│   ├── prisma/            # Database schema and migrations
│   └── server.js          # Main server file
├── frontend/              # React.js application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth, Socket)
│   │   ├── pages/         # Application pages
│   │   ├── utils/         # API client and utilities
│   │   └── App.js         # Main application component
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json for scripts
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database (or use provided Neon instance)
- Cloudinary account (or use provided credentials)

### 1. Clone and Install
```bash
git clone <repository-url>
cd amantena-highway-farms
npm run install-all
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Update .env with your values (or use provided demo credentials)
```

### 3. Database Setup
```bash
# Generate Prisma client and setup database
npm run setup

# Seed with demo data
cd backend && npm run seed
```

### 4. Start Development
```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run server  # Backend only (port 5000)
npm run client  # Frontend only (port 3000)
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database Studio**: `cd backend && npx prisma studio`

## 🔐 Demo Credentials

### Admin Account
- **Email**: admin@amantena.com
- **Password**: admin123
- **Permissions**: Full system access

### Staff Account
- **Email**: staff@amantena.com
- **Password**: staff123
- **Permissions**: Sales and inventory access

## 📋 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration (with invite)
POST /api/auth/logout         # User logout
GET  /api/auth/me            # Get current user
GET  /api/auth/status        # Check auth status
```

### Core Business Endpoints
```
# Products
GET    /api/products         # List products
POST   /api/products         # Create product (Admin)
PUT    /api/products/:id     # Update product (Admin)
DELETE /api/products/:id     # Delete product (Admin)

# Sales
GET    /api/sales           # List sales
POST   /api/sales           # Record sale
GET    /api/sales/reports   # Sales analytics

# Users (Admin only)
GET    /api/users           # List users
PUT    /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user

# Invitations (Admin only)
POST   /api/invites         # Send invitation
GET    /api/invites         # List invitations
```

## 🌐 Deployment

### Automated Deployment Scripts
The project includes automated deployment scripts for easy setup:

#### Linux/Mac (Bash)
```bash
# Development deployment
./deploy.sh

# Production deployment
./deploy.sh production

# Skip tests
./deploy.sh development --no-tests

# Clean and deploy
./deploy.sh --clean

# Health check
./deploy.sh health
```

#### Windows (PowerShell)
```powershell
# Development deployment
.\deploy.ps1

# Production deployment
.\deploy.ps1 -DeploymentType production

# Skip tests
.\deploy.ps1 -NoTests

# Clean and deploy
.\deploy.ps1 -Clean

# Health check
.\deploy.ps1 -DeploymentType health
```

### Manual Deployment

### Frontend (Netlify)
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `build` folder to Netlify
3. Set environment variables in Netlify dashboard

### Backend (Railway/Render)
1. Connect your repository to Railway/Render
2. Set environment variables
3. Deploy automatically from main branch

### Environment Variables
```bash
# Backend
DATABASE_URL=<neon-postgresql-url>
SESSION_SECRET=<random-string>
CLOUDINARY_CLOUD_NAME=dnerhroxc
CLOUDINARY_API_KEY=668351163117448
CLOUDINARY_API_SECRET=k4T-pGbMEP1GDZEzhQQiFyd5xTQ
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<app-password>

# Frontend
REACT_APP_API_URL=<backend-url>
```

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev          # Start both frontend & backend
npm run server       # Start backend only
npm run client       # Start frontend only

# Building
npm run build        # Build frontend for production
npm run build:backend # Build backend for production

# Setup
npm run setup        # Install deps & setup database
npm run install-all  # Install all dependencies

# Testing
npm run test         # Run all tests
npm run test:frontend # Run frontend tests only
npm run test:backend  # Run backend tests only
npm run test:coverage # Run tests with coverage
npm run test:ci      # Run tests in CI mode

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed with sample data
npm run db:studio    # Open database GUI

# Deployment
npm run deploy:dev   # Deploy for development
npm run deploy:prod  # Deploy for production
```

### Database Commands
```bash
cd backend
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open database GUI
npm run seed         # Seed with sample data
```

## 📊 Features in Detail

### Real-time Updates
- Live stock alerts when inventory runs low
- Real-time sales notifications
- Live connection status indicator
- Automatic data refresh on changes

### Security Features
- Session-based authentication
- Role-based access control
- CSRF protection
- Rate limiting
- Input validation and sanitization

### User Experience
- Responsive design for mobile/tablet
- Loading states and error handling
- Toast notifications for user feedback
- Optimistic UI updates
- Image upload with progress indicators

## 🧪 Testing

### Test Suite Overview
The application includes comprehensive testing for both frontend and backend components:

#### Frontend Tests
- **Unit Tests**: Component behavior and utility functions
- **Integration Tests**: User workflows and API interactions
- **Role-based Access Tests**: Permission and route protection
- **Sales Processing Tests**: Transaction logic and calculations

#### Backend Tests
- **API Endpoint Tests**: Request/response validation
- **Authentication Tests**: Login, logout, and session handling
- **Database Tests**: CRUD operations and data integrity
- **Permission Tests**: Role-based access control

### Running Tests

#### Frontend Testing
```bash
# Run all frontend tests
cd frontend
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (no watch)
npm run test:ci
```

#### Backend Testing
```bash
# Run all backend tests
cd backend
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- --grep "auth"
```

#### Full Test Suite
```bash
# Run all tests from project root
npm run test:all

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage Goals
- **Minimum Coverage**: 70% for lines, functions, branches, and statements
- **Critical Components**: 90%+ coverage for sales processing and authentication
- **Role Protection**: 100% coverage for access control logic

### Mock Data and Testing Utilities
The test suite includes comprehensive mock data and utilities:
- Mock user accounts for different roles (Admin, Manager, User)
- Sample product and sales data
- API response mocking
- Testing utilities for common operations

### Test Examples

#### Sales Processing Test
```javascript
test('calculates correct totals for multiple items', () => {
  const items = [
    { quantity: 2, unitPrice: 5.00 },
    { quantity: 3, unitPrice: 2.50 }
  ];
  const total = calculateTotal(items);
  expect(total).toBe(17.50);
});
```

#### Role-based Access Test
```javascript
test('regular user cannot access admin routes', async () => {
  renderWithAuth(<App />, { user: regularUser });
  fireEvent.click(screen.getByText('Users'));
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

### Demo Features to Test
1. **Login** with demo credentials
2. **Record a sale** - watch stock automatically decrease
3. **Add products** with images (Admin only)
4. **Create calendar events** 
5. **Invite new users** (Admin only)
6. **View analytics** on dashboard
7. **Upload images** to gallery
8. **Monitor low stock alerts**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📧 Support

For questions or issues:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for Amantena Highway Farms** 🌾
