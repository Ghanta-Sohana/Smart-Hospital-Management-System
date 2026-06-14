import React, { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext'
import { AdminContext } from './context/AdminContext'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

import Dashboard from './pages/Admin/Dashboard'
import AllAppointments from './pages/Admin/AllAppointments'
import AddDoctor from './pages/Admin/AddDoctor'
import DoctorsList from './pages/Admin/DoctorsList'
import Services from './pages/Admin/Services'
import EmergencyBooking from './pages/Admin/EmergencyBooking'
import EmergencyCases from './pages/Admin/EmergencyCases'
import ServiceBookings from './pages/Admin/ServiceBookings'

import Login from './pages/Login'

import DoctorAppointments from './pages/Doctor/DoctorAppointments'
import DoctorAppointmentDetails from './pages/Doctor/DoctorAppointmentDetails'
import DoctorDashboard from './pages/Doctor/DoctorDashboard'
import DoctorProfile from './pages/Doctor/DoctorProfile'

const App = () => {

  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)

  return (
    <>

      <ToastContainer />

      {(dToken || aToken) ? (
        <div className="bg-[#F8F9FD] min-h-screen w-full">
          <Navbar />
          <div className="flex items-start w-full">
            <Sidebar />
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-6">
              <Routes>
                <Route path="/" element={<Navigate to={aToken ? '/admin-dashboard' : '/doctor-dashboard'} replace />} />
                <Route path="/login" element={<Navigate to={aToken ? '/admin-dashboard' : '/doctor-dashboard'} replace />} />

                <Route path="/admin-dashboard" element={<Dashboard />} />
                <Route path="/all-appointments" element={<AllAppointments />} />
                <Route path="/add-doctor" element={<AddDoctor />} />
                <Route path="/doctor-list" element={<DoctorsList />} />
                <Route path="/services" element={<Services />} />
                <Route path="/emergency-booking" element={<EmergencyBooking />} />
                <Route path="/emergency-cases" element={<EmergencyCases />} />
                <Route path="/service-bookings" element={<ServiceBookings />} />

                <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="/doctor-appointments" element={<DoctorAppointments />} />
                <Route path="/doctor-appointments/:appointmentId" element={<DoctorAppointmentDetails />} />
                <Route path="/doctor-profile" element={<DoctorProfile />} />

                <Route path="*" element={<Navigate to={aToken ? '/admin-dashboard' : '/doctor-dashboard'} replace />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}

    </>
  )
}

export default App
