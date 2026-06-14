# Smart Hospital Management System (SHMS)

A comprehensive full-stack hospital management system built with **React**, **Node.js**, **Express**, and **MongoDB**. 
This application enables seamless management of appointments, services, prescriptions, and emergency cases for hospitals.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)

## ✨ Features

### Patient Portal (Frontend)
- **User Authentication**: Secure login and registration
- **Appointment Booking**: Schedule appointments with doctors
- **Service Bookings**: Reserve hospital services
- **Emergency Booking**: Quick emergency case registration
- **Prescriptions**: View and manage medical prescriptions
- **Doctor Directory**: Browse available doctors by specialty
- **Appointment Management**: View and cancel appointments
- **Profile Management**: Update personal information

### Admin Dashboard
- **Doctor Management**: Add, edit, and manage doctors
- **Appointment Management**: View all appointments and handle scheduling
- **Service Management**: Create and manage hospital services
- **Emergency Cases**: Track and manage emergency bookings
- **Appointment Details**: View detailed appointment information
- **Analytics**: Dashboard with key metrics

### Doctor Portal
- **Doctor Dashboard**: Overview of schedule and patients
- **Appointments**: View and manage patient appointments
- **Emergency Cases**: Access emergency patient information
- **Service Bookings**: View booked services
- **Patient Details**: Access appointment details
- **Profile Management**: Update doctor profile

## 🛠 Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Context API** - State management
- **React Router** - Navigation

### Admin Panel
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Context API** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File upload
- **Cloudinary** - Image storage
- **Nodemon** - Development tool

## 📁 Project Structure

```
prescripto-full-stack/
├── frontend/              # Patient portal React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Context API setup
│   │   └── assets/        # Static assets
│   └── package.json
│
├── admin/                 # Admin dashboard React app
│   ├── src/
│   │   ├── components/    # Admin components
│   │   ├── pages/         # Admin pages
│   │   ├── context/       # Context API setup
│   │   └── assets/        # Static assets
│   └── package.json
│
├── backend/               # Express.js API server
│   ├── controllers/       # Route controllers
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/            # Configuration files
│   ├── cron/              # Scheduled jobs
│   ├── server.js          # Entry point
│   └── package.json
│
└── README.md
```

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud - MongoDB Atlas)
- **Cloudinary Account** (for image uploads)
- **Git**

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Ghanta-Sohana/Smart-Hospital-Management-System.git
cd Smart-Hospital-Management-System
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

**Admin:**
```bash
cd ../admin
npm install
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` folder:

```
# Port
PORT=4000

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_secret_key

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (if applicable)
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` folder:

```
VITE_BACKEND_URL=http://localhost:4000
```

### Admin Environment Variables

Create a `.env` file in the `admin` folder:

```
VITE_BACKEND_URL=http://localhost:4000
```

## 🏃 Running the Application

### Backend
```bash
cd backend
npm run server
```
Backend runs on `http://localhost:4000`

### Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### Admin
```bash
cd admin
npm run dev
```
Admin runs on `http://localhost:5174`

## 🔌 API Documentation

### Authentication Endpoints
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/doctors/login` - Doctor login
- `POST /api/admin/login` - Admin login

### User Routes
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments` - Get user appointments
- `POST /api/service-bookings` - Book service

### Doctor Routes
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/appointments` - Get doctor appointments
- `PUT /api/doctors/profile` - Update doctor profile

### Admin Routes
- `POST /api/admin/add-doctor` - Add new doctor
- `GET /api/admin/doctors` - Get all doctors
- `GET /api/admin/appointments` - Get all appointments
- `POST /api/admin/services` - Create service
- `GET /api/admin/services` - Get all services

**Last Updated**: June 2026
