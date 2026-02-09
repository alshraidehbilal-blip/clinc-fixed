# Dental Clinic Management System - Deployment Guide

## Project Overview
A full-stack dental clinic management system built with React (Frontend) and FastAPI (Backend) with MongoDB database.

## System Requirements
- Node.js 18+ and Yarn
- Python 3.9+
- MongoDB 4.4+
- Ubuntu/Debian Linux or similar

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Radix UI Components
- **Backend**: FastAPI, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Authentication**: JWT-based auth with BCrypt password hashing

---

## Local Development Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
yarn install
```

### 2. Configure Environment Variables

**Backend (.env file in backend/ directory):**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=dental_clinic
CORS_ORIGINS=*
JWT_SECRET_KEY=your-secret-key-change-in-production
```

**Frontend (.env file in frontend/ directory):**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 3. Start MongoDB
```bash
# Using system service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Application

**Backend:**
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend:**
```bash
cd frontend
yarn start
```

The frontend will be available at `http://localhost:3000`
The backend API will be available at `http://localhost:8001`

### 5. Default Admin Credentials
```
Email: admin@clinic.com
Password: admin123
```

---

## Production Deployment Options

### Option 1: Deploy to Vercel (Frontend) + Railway (Backend)

#### Frontend Deployment to Vercel:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy Frontend:
```bash
cd frontend
vercel --prod
```

4. Set Environment Variables in Vercel Dashboard:
   - `REACT_APP_BACKEND_URL`: Your backend API URL

#### Backend Deployment to Railway:

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize and Deploy:
```bash
cd backend
railway init
railway up
```

4. Add MongoDB service in Railway dashboard
5. Set environment variables in Railway:
   - `MONGO_URL`: MongoDB connection string from Railway
   - `DB_NAME`: dental_clinic
   - `JWT_SECRET_KEY`: Generate a secure random key
   - `CORS_ORIGINS`: Your frontend URL

---

### Option 2: Deploy to DigitalOcean App Platform

1. Create a new app in DigitalOcean App Platform
2. Connect your GitHub repository
3. Configure two components:
   - **Web Service (Backend)**:
     - Build Command: `pip install -r requirements.txt`
     - Run Command: `uvicorn server:app --host 0.0.0.0 --port 8080`
     - Environment Variables: Set all backend env vars
   
   - **Static Site (Frontend)**:
     - Build Command: `yarn && yarn build`
     - Output Directory: `build`
     - Environment Variables: Set REACT_APP_BACKEND_URL

4. Add MongoDB database component
5. Deploy!

---

### Option 3: Deploy to AWS (EC2 + RDS)

#### Backend on EC2:

1. Launch Ubuntu EC2 instance
2. Install Python and dependencies:
```bash
sudo apt update
sudo apt install python3-pip nginx -y
pip3 install -r requirements.txt
```

3. Create systemd service `/etc/systemd/system/clinic-backend.service`:
```ini
[Unit]
Description=Dental Clinic Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/clinic/backend
Environment="PATH=/home/ubuntu/.local/bin"
ExecStart=/home/ubuntu/.local/bin/uvicorn server:app --host 0.0.0.0 --port 8001

[Install]
WantedBy=multi-user.target
```

4. Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl start clinic-backend
sudo systemctl enable clinic-backend
```

5. Configure Nginx as reverse proxy

#### Frontend on S3 + CloudFront:

1. Build frontend:
```bash
cd frontend
yarn build
```

2. Upload to S3:
```bash
aws s3 sync build/ s3://your-bucket-name/
```

3. Setup CloudFront distribution pointing to S3
4. Update REACT_APP_BACKEND_URL to point to backend API

---

### Option 4: Deploy with Docker

#### Create docker-compose.yml:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=dental_clinic
      - JWT_SECRET_KEY=your-secret-key
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

volumes:
  mongodb_data:
```

#### Backend Dockerfile:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### Frontend Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
CMD ["yarn", "start"]
```

Deploy:
```bash
docker-compose up -d
```

---

### Option 5: Deploy to Heroku

#### Backend:
1. Create `Procfile` in backend directory:
```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

2. Deploy:
```bash
cd backend
heroku create your-clinic-backend
heroku addons:create mongolab
git push heroku main
```

#### Frontend:
1. Add to package.json:
```json
{
  "scripts": {
    "heroku-postbuild": "yarn build"
  }
}
```

2. Create `static.json`:
```json
{
  "root": "build/",
  "routes": {
    "/**": "index.html"
  }
}
```

3. Deploy:
```bash
cd frontend
heroku create your-clinic-frontend
heroku buildpacks:add heroku/nodejs
git push heroku main
```

---

## Environment Variables Summary

### Backend Required Variables:
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `CORS_ORIGINS`: Allowed origins (comma-separated)

### Frontend Required Variables:
- `REACT_APP_BACKEND_URL`: Backend API URL (must include '/api' prefix for endpoints)

---

## Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Verify all API endpoints are accessible
- [ ] Check database connections
- [ ] Test creating patients, appointments, and procedures
- [ ] Verify file uploads (X-rays) work correctly
- [ ] Test payment recording
- [ ] Check all user roles (Admin, Doctor, Receptionist)
- [ ] Verify SSL/HTTPS is enabled in production
- [ ] Set up monitoring and logging
- [ ] Configure automated backups for MongoDB
- [ ] Update default admin password

---

## Troubleshooting

### Backend not connecting to MongoDB:
- Check MONGO_URL is correct
- Ensure MongoDB is running
- Verify network/firewall rules

### Frontend can't reach Backend:
- Check REACT_APP_BACKEND_URL is correct
- Verify CORS settings in backend
- Check all API routes include '/api' prefix

### Authentication issues:
- Verify JWT_SECRET_KEY is set
- Check token expiration settings
- Clear browser cookies/localStorage

---

## Monitoring & Maintenance

### Recommended Tools:
- **Monitoring**: New Relic, DataDog, or PM2
- **Logging**: Papertrail, Loggly, or CloudWatch
- **Database Backups**: MongoDB Atlas, or mongodump cron jobs
- **Uptime Monitoring**: UptimeRobot, Pingdom

### Regular Maintenance:
- Monitor database size and performance
- Review and rotate logs
- Update dependencies regularly
- Backup database daily
- Monitor API response times
- Review user activity logs

---

## Support & Documentation

For more information about the application features:
- Admin Dashboard: Manage users, procedures, view statistics
- Doctor Dashboard: View patients, appointments, medical history
- Receptionist Dashboard: Manage patients and appointments

Default procedures are automatically seeded on first startup.

---

## Security Best Practices

1. **Always change default admin password** after first deployment
2. Use strong, random JWT_SECRET_KEY in production
3. Enable HTTPS/SSL for all production deployments
4. Restrict CORS_ORIGINS to your actual frontend domain
5. Keep dependencies updated
6. Use environment variables for sensitive data
7. Implement rate limiting on API endpoints
8. Regular security audits
9. Use secure MongoDB connection strings
10. Implement proper backup and disaster recovery procedures
