import axios from 'axios';
import React, { useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const Verify = () => {

    const [searchParams] = useSearchParams()

    const success = searchParams.get("success")
    const appointmentId = searchParams.get("appointmentId")
    const serviceBookingId = searchParams.get("serviceBookingId")

    const { backendUrl, token } = useContext(AppContext)

    const navigate = useNavigate()

    const verifyStripe = async () => {

        try {

            const endpoint = serviceBookingId ? "/api/user/verifyServiceStripe" : "/api/user/verifyStripe"
            const payload = serviceBookingId ? { success, serviceBookingId } : { success, appointmentId }
            const { data } = await axios.post(backendUrl + endpoint, payload, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }

            navigate(serviceBookingId ? "/my-service-bookings" : "/my-appointments", { replace: true })

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    useEffect(() => {
        if (token && success && (appointmentId || serviceBookingId)) {
            verifyStripe()
        }
    }, [token, appointmentId, serviceBookingId, success])

    return (
        <div className='min-h-[60vh] flex items-center justify-center'>
            <div className="w-20 h-20 border-4 border-gray-300 border-t-4 border-t-primary rounded-full animate-spin"></div>
        </div>
    )
}

export default Verify
