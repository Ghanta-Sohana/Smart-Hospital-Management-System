import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyAppointments = () => {

    const { backendUrl, token } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [serviceBookings, setServiceBookings] = useState([])
    const [payment, setPayment] = useState('')
    const [activeReminder, setActiveReminder] = useState(null)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const getAppointmentStatus = (item) => item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : (item.status || 'Pending')
    const statusClass = (status) => {
        if (status === 'Completed') return 'text-green-600 bg-green-50 border-green-200'
        if (status === 'Cancelled') return 'text-red-600 bg-red-50 border-red-200'
        return 'text-amber-700 bg-amber-50 border-amber-200'
    }

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
    }

    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            if (data.success) {
                const appointmentList = data.appointments.reverse()
                setAppointments(appointmentList)
                setActiveReminder(appointmentList.find(item => item.reminderMessage && !item.reminderCancelled) || null)
            }
            const serviceData = await axios.get(backendUrl + '/api/user/service-bookings', { headers: { token } })
            if (serviceData.data.success) {
                setServiceBookings(serviceData.data.serviceBookings)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const cancelReminder = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/cancel-reminder', { appointmentId }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                setActiveReminder(null)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const cancelServiceBooking = async (bookingId) => {
        const confirmed = window.confirm('Are you sure you want to cancel this pending service booking?')
        if (!confirmed) return

        try {
            const { data } = await axios.post(backendUrl + '/api/user/cancel-service-booking', { bookingId }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Function to cancel appointment Using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Appointment Payment',
            description: "Appointment Payment",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {

                console.log(response)

                try {
                    const { data } = await axios.post(backendUrl + "/api/user/verifyRazorpay", response, { headers: { token } });
                    if (data.success) {
                        navigate('/my-appointments')
                        getUserAppointments()
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message)
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    // Function to make payment using razorpay
    const appointmentRazorpay = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-razorpay', { appointmentId }, { headers: { token } })
            if (data.success) {
                initPay(data.order)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to make payment using stripe
    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-stripe', { appointmentId }, { headers: { token } })
            if (data.success) {
                const { session_url } = data
                window.location.replace(session_url)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }



    useEffect(() => {
        if (token) {
            getUserAppointments()
            const reminderInterval = setInterval(getUserAppointments, 120000)
            return () => clearInterval(reminderInterval)
        }
    }, [token])

    return (
        <div>
            {activeReminder && (
                <div className='fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4'>
                    <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6 border'>
                        <p className='text-lg font-semibold text-gray-800'>Appointment Reminder</p>
                        <p className='text-sm text-gray-600 mt-2'>{activeReminder.reminderMessage}</p>
                        <div className='mt-4 text-sm text-gray-600'>
                            <p><span className='font-medium'>Patient:</span> {activeReminder.patientName || activeReminder.userData?.name}</p>
                            {(activeReminder.docData?.name || activeReminder.doctorName) && <p><span className='font-medium'>Doctor:</span> {activeReminder.docData?.name || activeReminder.doctorName}</p>}
                            <p><span className='font-medium'>Time:</span> {slotDateFormat(activeReminder.slotDate)} | {activeReminder.slotTime}</p>
                        </div>
                        <div className='flex flex-wrap gap-3 mt-5'>
                            <button onClick={() => setActiveReminder(null)} className='border px-5 py-2 rounded-full text-gray-600 hover:bg-gray-50'>Close</button>
                            <button onClick={() => cancelReminder(activeReminder._id)} className='bg-red-600 text-white px-5 py-2 rounded-full hover:bg-red-700'>Cancel Reminder</button>
                        </div>
                    </div>
                </div>
            )}
            <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
            <div className=''>
                {appointments.map((item, index) => {
                    const status = getAppointmentStatus(item)
                    const isPending = status === 'Pending'

                    return (
                    <div key={index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
                        <div>
                            {item.docData?.image
                                ? <img className='w-36 bg-[#EAEFFF]' src={item.docData.image} alt="" />
                                : <div className='w-36 h-36 bg-red-50 border border-red-100 rounded flex items-center justify-center text-red-600 text-sm text-center px-3'>Emergency Care</div>}
                        </div>
                        <div className='flex-1 text-sm text-[#5E5E5E]'>
                            <p className='text-[#262626] text-base font-semibold'>{item.docData?.name || item.doctorName || 'Emergency Appointment'} {item.isEmergency && <span className='text-red-600 text-xs'>(Emergency)</span>}</p>
                            {item.docData?.speciality && <p>{item.docData.speciality}</p>}
                            {item.reminderMessage && <p className='mt-1 text-primary font-medium'>{item.reminderMessage}</p>}
                            {item.isEmergency && <p className='mt-1 text-red-600'>Emergency notes: {item.emergencyNotes}</p>}
                            {!item.isEmergency && item.bookingReason && <p className='mt-1 text-gray-600'>Reason for booking appointment: {item.bookingReason}</p>}
                            {item.docData?.address && <>
                                <p className='text-[#464646] font-medium mt-1'>Address:</p>
                                <p className=''>{item.docData.address.line1}</p>
                                <p className=''>{item.docData.address.line2}</p>
                            </>}
                            <p className=' mt-1'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} |  {item.slotTime}</p>
                            <p className={`inline-flex mt-2 px-3 py-1 rounded-full border text-xs font-medium ${statusClass(status)}`}>{status}</p>
                        </div>
                        <div></div>
                        <div className='flex flex-col gap-2 justify-end text-sm text-center'>
                            {!item.isEmergency && isPending && !item.payment && payment !== item._id && <button onClick={() => setPayment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>}
                            {!item.isEmergency && isPending && !item.payment && payment === item._id && <button onClick={() => appointmentStripe(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center'><img className='max-w-20 max-h-5' src={assets.stripe_logo} alt="" /></button>}
                            {!item.isEmergency && isPending && !item.payment && payment === item._id && <button onClick={() => appointmentRazorpay(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-gray-100 hover:text-white transition-all duration-300 flex items-center justify-center'><img className='max-w-20 max-h-5' src={assets.razorpay_logo} alt="" /></button>}
                            {!item.cancelled && item.payment && !item.isCompleted && <button className='sm:min-w-48 py-2 border rounded text-[#696969]  bg-[#EAEFFF]'>Paid</button>}

                            {item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}

                            {isPending && <button onClick={() => cancelAppointment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>}
                            {item.cancelled && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>}
                        </div>
                    </div>
                    )
                })}
                {serviceBookings.length > 0 && <div className='pb-3 mt-12 border-b flex flex-wrap justify-between gap-3 items-center'>
                    <p className='text-lg font-medium text-gray-600'>My service bookings</p>
                    <button onClick={() => navigate('/my-service-bookings')} className='border border-primary text-primary px-4 py-2 rounded-full text-sm hover:bg-primary hover:text-white transition-all'>View all service bookings</button>
                </div>}
                {serviceBookings.map((item, index) => (
                    <div key={item._id || index} className='grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 py-4 border-b text-sm text-[#5E5E5E] hover:bg-gray-50 transition-all'>
                        <div>
                            <p className='text-[#262626] text-base font-semibold'>{item.serviceData.name}</p>
                            <p>{item.serviceData.description}</p>
                        </div>
                        <p><span className='font-medium'>Date:</span> {item.slotDate}</p>
                        <p><span className='font-medium'>Time:</span> {item.slotTime}</p>
                        <p><span className='font-medium'>Amount:</span> ₹{item.amount}</p>
                        <p className={`font-medium ${statusClass(item.status || (item.cancelled ? 'Cancelled' : 'Pending'))}`}>{item.status || (item.cancelled ? 'Cancelled' : 'Pending')}</p>
                        {(item.status || (item.cancelled ? 'Cancelled' : 'Pending')) === 'Pending'
                            ? <button onClick={() => cancelServiceBooking(item._id)} className='border border-red-500 text-red-500 px-4 py-2 rounded-full hover:bg-red-600 hover:text-white transition-all'>Cancel</button>
                            : <p className='text-gray-400'>No action</p>}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MyAppointments
