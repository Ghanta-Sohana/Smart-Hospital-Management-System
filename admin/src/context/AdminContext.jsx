import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";


export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [services, setServices] = useState([])
    const [serviceBookings, setServiceBookings] = useState([])
    const [emergencyCases, setEmergencyCases] = useState([])
    const [users, setUsers] = useState([])
    const [dashData, setDashData] = useState(false)

    const showError = (message) => {
        if (['jwt expired', 'invalid signature', 'Not Authorized Login Again'].includes(message)) {
            localStorage.removeItem('aToken')
            sessionStorage.clear()
            setAToken('')
        }
        toast.error(message)
    }

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                showError(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                showError(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.filter((item) => !item.isEmergency).reverse())
            } else {
                showError(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                showError(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    const rescheduleAppointment = async (appointmentId, slotDate, slotTime) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/reschedule-appointment', { appointmentId, slotDate, slotTime }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                showError(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const deleteDoctor = async (docId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/delete-doctor', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                showError(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getServices = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/services', { headers: { aToken } })
            if (data.success) {
                setServices(data.services)
            } else {
                showError(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const deleteService = async (serviceId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/delete-service', { serviceId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getServices()
            } else {
                showError(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getUsers = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/users', { headers: { aToken } })
            if (data.success) {
                setUsers(data.users)
            } else {
                showError(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getServiceBookings = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/service-bookings', { headers: { aToken } })
            if (data.success) {
                setServiceBookings(data.serviceBookings)
            } else {
                showError(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const updateServiceBookingStatus = async (bookingId, status) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/update-service-booking-status', { bookingId, status }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getServiceBookings()
                getDashData()
            } else {
                showError(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getEmergencyCases = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/emergency-cases', { headers: { aToken } })
            if (data.success) {
                setEmergencyCases(data.emergencyCases)
            } else {
                showError(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                showError(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const value = {
        aToken, setAToken,
        doctors,
        getAllDoctors,
        changeAvailability,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        rescheduleAppointment,
        deleteDoctor,
        services,
        getServices,
        deleteService,
        serviceBookings,
        getServiceBookings,
        updateServiceBookingStatus,
        emergencyCases,
        getEmergencyCases,
        users,
        getUsers,
        dashData
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider
