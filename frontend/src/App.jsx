import React from 'react'
import Navbar from './components/Navbar'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'
import Contact from './pages/Contact'
import Appointment from './pages/Appointment'
import MyAppointments from './pages/MyAppointments'
import MyProfile from './pages/MyProfile'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verify from './pages/Verify'
import Services from './pages/Services'
import ServiceBooking from './pages/ServiceBooking'
import Prescriptions from './pages/Prescriptions'
import MyServiceBookings from './pages/MyServiceBookings'
import ProtectedRoute from './components/ProtectedRoute'

const App = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className='min-h-screen w-full flex flex-col bg-white'>
      <ToastContainer />
      <Navbar />
      <main className={`flex-1 w-full ${isHomePage ? '': 'px-4 sm:px-8 lg:px-[8%]'}`}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/doctors' element={<Doctors />} />
          <Route path='/doctors/:speciality' element={<Doctors />} />
          <Route path='/services' element={<Services />} />
          <Route path='/service-booking/:serviceId' element={<ProtectedRoute><ServiceBooking /></ProtectedRoute>} />
          <Route path='/emergency' element={<Navigate to='/' replace />} />
          <Route path='/login' element={<Login />} />
          <Route path='/Register' element={<Register />} />
          <Route path='/register' element={<Register />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/appointment/:docId' element={<ProtectedRoute><Appointment /></ProtectedRoute>} />
          <Route path='/my-appointments' element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
          <Route path='/my-service-bookings' element={<ProtectedRoute><MyServiceBookings /></ProtectedRoute>} />
          <Route path='/my-profile' element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
          <Route path='/prescriptions' element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
          <Route path='/verify' element={<ProtectedRoute><Verify /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
