# CRM Website - Customer Relationship Management System

A comprehensive, full-stack Customer Relationship Management (CRM) application built with React, Node.js, Express, and MySQL. This application provides a complete solution for managing contacts, companies, deals, tasks, invoices, and more.

## 🚀 Features

### User Authentication
- Secure user registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin, Manager, User)
- Protected routes

### Contact Management
- Add, edit, view, and delete contacts
- Comprehensive contact fields (name, email, phone, position, company, address, notes)
- Search and filter contacts
- Contact detail view with activity history
- Associate contacts with companies

### Company/Organization Tracking
- Complete company management (CRUD operations)
- Track company details (name, industry, website, address, phone, email, employee count)
- Associate contacts with companies
- Company detail view showing associated contacts and deals
- Activity tracking for companies

### Deal/Opportunity Pipeline
- Create and manage sales deals
- Six-stage pipeline: Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
- Visual Kanban board for deal pipeline
- Deal fields: title, value, expected close date, probability, stage
- Associate deals with companies and contacts
- Activity timeline for each deal

### Task Management
- Create, assign, and track tasks
- Task priorities: Low, Medium, High, Urgent
- Task statuses: Pending, In Progress, Completed, Cancelled
- Task categories: Call, Email, Meeting, Follow-up, Other
- Due date tracking
- Associate tasks with contacts, companies, or deals

### Tax Invoice Generation
- Create professional invoices
- Auto-generated invoice numbers
- Multiple line items support
- Configurable tax rates (GST, VAT, etc.)
- Invoice statuses: Draft, Sent, Paid, Overdue, Cancelled
- PDF generation for invoices
- Invoice history and tracking

### Notes and Activity Tracking
- Add notes to contacts, companies, and deals
- Automatic activity logging
- Activity timeline view
- Track all interactions and changes

### Dashboard and Analytics
- Overview dashboard with key metrics
- Total counts: contacts, companies, deals, tasks
- Deal pipeline visualization (Pie chart)
- Monthly revenue analytics (Bar chart)
- Conversion rate tracking
- Recent activities feed
- Upcoming tasks overview
- Revenue statistics (paid, pending, overdue)
- Interactive charts using Chart.js

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **mysql2** - MySQL client for Node.js
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **PDFKit** - PDF generation
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Material-UI (MUI)** - UI component library
- **Chart.js & react-chartjs-2** - Data visualization
- **Axios** - HTTP client
- **React Toastify** - Toast notifications
- **Context API** - State management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL** (v5.7 or higher)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/kongkonpratim29/myfirstcrm.git
cd myfirstcrm
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `backend` directory:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_database
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

#### Set Up Database
1. Create a MySQL database:
```sql
CREATE DATABASE crm_database;
```

2. The application will automatically create tables on first run

#### Start Backend Server
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `frontend` directory:
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Start Frontend Development Server
```bash
npm start
```

The frontend application will open at `http://localhost:3000`

## 🗄️ Database Schema

The application uses the following database tables:

- **users** - User accounts with authentication
- **contacts** - Contact information
- **companies** - Company/organization details
- **deals** - Sales opportunities
- **tasks** - Task management
- **invoices** - Invoice records
- **invoice_items** - Invoice line items
- **activities** - Activity logging
- **notes** - Notes attached to records

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Contacts
- `GET /api/contacts` - Get all contacts (Protected)
- `GET /api/contacts/:id` - Get single contact (Protected)
- `POST /api/contacts` - Create contact (Protected)
- `PUT /api/contacts/:id` - Update contact (Protected)
- `DELETE /api/contacts/:id` - Delete contact (Protected)

### Companies
- `GET /api/companies` - Get all companies (Protected)
- `GET /api/companies/:id` - Get single company (Protected)
- `POST /api/companies` - Create company (Protected)
- `PUT /api/companies/:id` - Update company (Protected)
- `DELETE /api/companies/:id` - Delete company (Protected)

### Deals
- `GET /api/deals` - Get all deals (Protected)
- `GET /api/deals/:id` - Get single deal (Protected)
- `POST /api/deals` - Create deal (Protected)
- `PUT /api/deals/:id` - Update deal (Protected)
- `DELETE /api/deals/:id` - Delete deal (Protected)

### Tasks
- `GET /api/tasks` - Get all tasks (Protected)
- `GET /api/tasks/:id` - Get single task (Protected)
- `POST /api/tasks` - Create task (Protected)
- `PUT /api/tasks/:id` - Update task (Protected)
- `DELETE /api/tasks/:id` - Delete task (Protected)

### Invoices
- `GET /api/invoices` - Get all invoices (Protected)
- `GET /api/invoices/:id` - Get single invoice (Protected)
- `GET /api/invoices/:id/pdf` - Download invoice PDF (Protected)
- `POST /api/invoices` - Create invoice (Protected)
- `PUT /api/invoices/:id` - Update invoice (Protected)
- `DELETE /api/invoices/:id` - Delete invoice (Protected)

### Activities & Notes
- `GET /api/activities` - Get activities (Protected)
- `POST /api/activities` - Create activity (Protected)
- `GET /api/notes` - Get notes (Protected)
- `POST /api/notes` - Create note (Protected)
- `PUT /api/notes/:id` - Update note (Protected)
- `DELETE /api/notes/:id` - Delete note (Protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (Protected)

## 👥 User Roles

The application supports three user roles:

1. **User** - Basic access to view and manage own records
2. **Manager** - Extended access to manage team records
3. **Admin** - Full access to all features and settings

## 🔒 Security Features

- JWT-based authentication with token expiration
- Password hashing using bcrypt
- Protected API routes
- Input validation and sanitization
- SQL injection prevention using parameterized queries
- CORS configuration
- Secure environment variable handling

## 🎨 UI Features

- Responsive design (mobile-friendly)
- Material-UI components
- Interactive data visualization
- Toast notifications
- Loading states
- Error boundaries
- Intuitive navigation
- Clean and modern interface

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile devices

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in environment variables
2. Update database credentials
3. Set a strong `JWT_SECRET`
4. Deploy to your preferred hosting service (Heroku, AWS, DigitalOcean, etc.)

### Frontend Deployment

1. Build the production bundle:
```bash
cd frontend
npm run build
```

2. Deploy the `build` folder to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting service

## 📝 Project Structure

```
/
├── backend/
│   ├── config/              # Database configuration
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Custom middleware
│   ├── routes/              # API routes
│   ├── .env.example         # Environment variables template
│   ├── package.json         # Backend dependencies
│   └── server.js            # Express server entry point
├── frontend/
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React context
│   │   ├── services/        # API services
│   │   ├── App.js           # Main app component
│   │   └── index.js         # React entry point
│   ├── .env.example         # Frontend env template
│   └── package.json         # Frontend dependencies
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**kongkonpratim29**

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Happy CRM-ing! 🎉**