# Dental Clinic Management System

A comprehensive full-stack dental clinic management system with role-based access control, built with modern web technologies.

## Features

### For Administrators
- User management (create, update, delete doctors and receptionists)
- Procedure management with pricing
- Financial overview and statistics
- Calendar view of all appointments
- Payment tracking and reporting
- Complete system oversight

### For Doctors
- Patient management
- Appointment scheduling
- Medical history tracking
- X-ray image uploads and viewing
- Procedure recording
- Patient financial overview

### For Receptionists
- Patient registration
- Appointment booking
- Payment processing
- Basic patient information access

## Tech Stack

**Frontend:**
- React 19
- React Router v7
- Tailwind CSS
- Radix UI Components
- Axios for API calls
- Sonner for notifications

**Backend:**
- FastAPI (Python)
- Motor (Async MongoDB driver)
- JWT authentication
- BCrypt password hashing
- Pydantic for data validation

**Database:**
- MongoDB

## Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.9+
- MongoDB 4.4+

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dental-clinic
```

2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd frontend
yarn install
```

4. Start MongoDB:
```bash
sudo systemctl start mongod
# or
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. Run backend:
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

6. Run frontend:
```bash
cd frontend
yarn start
```

7. Access the application at `http://localhost:3000`

### Default Login
```
Email: admin@clinic.com
Password: admin123
```

**⚠️ Important: Change the default password immediately after first login!**

## Project Structure

```
/app/
├── backend/
│   ├── server.py         # Main FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── .env             # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts (Auth)
│   │   └── App.js       # Main app component
│   ├── public/          # Static files
│   ├── package.json     # Node dependencies
│   └── .env            # Frontend environment variables
└── DEPLOYMENT.md       # Deployment instructions
```

## Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=dental_clinic
CORS_ORIGINS=*
JWT_SECRET_KEY=your-secret-key-change-in-production
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Key Features Implemented

✅ User Authentication & Authorization (JWT)  
✅ Role-Based Access Control (Admin, Doctor, Receptionist)  
✅ Patient Management  
✅ Appointment Scheduling  
✅ Medical History Recording  
✅ X-Ray Image Upload & Management  
✅ Procedure Management  
✅ Payment Processing & Tracking  
✅ Financial Statistics & Reporting  
✅ Calendar View  
✅ Responsive Design  
✅ English Language Support  

## Deployment

For detailed deployment instructions to various platforms (Vercel, Railway, AWS, Docker, Heroku, etc.), see [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

MIT License

## Support

For issues, questions, or contributions, please create an issue in the repository.
