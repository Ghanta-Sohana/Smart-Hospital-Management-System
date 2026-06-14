import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const MyServiceBookings = () => {
  const { backendUrl, token, currencySymbol } = useContext(AppContext)
  const [serviceBookings, setServiceBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const getServiceBookings = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(backendUrl + '/api/user/service-bookings', { headers: { token } })
      if (data.success) {
        setServiceBookings(data.serviceBookings)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelServiceBooking = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this pending service booking?')
    if (!confirmed) return

    try {
      const { data } = await axios.post(backendUrl + '/api/user/cancel-service-booking', { bookingId }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        getServiceBookings()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const payCash = async (bookingId) => {
    try {
      setActionLoading(bookingId)
      const { data } = await axios.post(backendUrl + '/api/user/pay-service-cash', { bookingId }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        getServiceBookings()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActionLoading('')
    }
  }

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Service Payment',
      description: 'Service Booking Payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(backendUrl + '/api/user/verifyServiceRazorpay', response, { headers: { token } })
          if (data.success) {
            toast.success(data.message)
            getServiceBookings()
          } else {
            toast.error(data.message)
          }
        } catch (error) {
          toast.error(error.message)
        }
      }
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const serviceRazorpay = async (bookingId) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/user/payment-service-razorpay', { bookingId }, { headers: { token } })
      if (data.success) {
        initPay(data.order)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const serviceStripe = async (bookingId) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/user/payment-service-stripe', { bookingId }, { headers: { token } })
      if (data.success) {
        window.location.replace(data.session_url)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const statusClass = (status) => {
    if (status === 'Completed') return 'text-green-600 bg-green-50 border-green-200'
    if (status === 'Cancelled') return 'text-red-600 bg-red-50 border-red-200'
    return 'text-amber-700 bg-amber-50 border-amber-200'
  }

  useEffect(() => {
    if (token) getServiceBookings()
  }, [token])

  return (
    <div className='min-h-[70vh] py-8'>
      <p className='pb-3 text-lg font-medium text-gray-600 border-b'>My Service Bookings</p>

      {loading && <p className='py-10 text-center text-gray-500'>Loading service bookings...</p>}

      <div className='grid gap-4 mt-5'>
        {serviceBookings.map((item) => {
          const status = item.status || (item.cancelled ? 'Cancelled' : 'Pending')
          const isPending = status === 'Pending' && !item.cancelled
          const isPayable = isPending && (item.paymentStatus || 'Pending') !== 'Paid'

          return (
            <div key={item._id} className='bg-white border rounded-lg p-5 grid lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-4 items-center text-sm text-gray-600 hover:shadow-sm transition-all'>
              <div>
                <p className='text-gray-800 text-base font-semibold'>{item.serviceData?.name || 'Hospital Service'}</p>
                <p className='mt-1'>{item.serviceData?.description}</p>
                <p className='mt-2'><span className='font-medium'>Patient:</span> {item.patientName || item.userData?.name}</p>
                <p><span className='font-medium'>Phone:</span> {item.patientPhone || item.userData?.phone || '-'}</p>
              </div>
              <p><span className='font-medium'>Date:</span> {item.slotDate}<br /><span className='font-medium'>Time:</span> {item.slotTime}</p>
              <div>
                <p><span className='font-medium'>Amount:</span> {currencySymbol}{item.amount}</p>
                <p><span className='font-medium'>Payment:</span> {item.paymentStatus || 'Pending'} {item.paymentMethod ? `(${item.paymentMethod})` : ''}</p>
                <p className={`inline-flex mt-2 px-3 py-1 rounded-full border text-xs font-medium ${statusClass(status)}`}>
                  {status}
                </p>
              </div>
              {isPending
                ? <div className='flex flex-col gap-3 min-w-44'>
                  {isPayable && <button disabled={actionLoading === item._id} onClick={() => payCash(item._id)} className='border border-primary text-primary px-5 py-2 rounded-full hover:bg-primary hover:text-white disabled:opacity-50 transition-all'>Pay Cash</button>}
                  {isPayable && payment !== item._id && <button onClick={() => setPayment(item._id)} className='border text-gray-600 px-5 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Pay Online</button>}
                  {isPayable && payment === item._id && <button onClick={() => serviceStripe(item._id)} className='border px-5 py-2 rounded-full hover:bg-gray-100 transition-all flex justify-center'><img className='max-w-20 max-h-5' src={assets.stripe_logo} alt='Stripe' /></button>}
                  {isPayable && payment === item._id && <button onClick={() => serviceRazorpay(item._id)} className='border px-5 py-2 rounded-full hover:bg-gray-100 transition-all flex justify-center'><img className='max-w-20 max-h-5' src={assets.razorpay_logo} alt='Razorpay' /></button>}
                  {!isPayable && <span className='text-green-600 text-center font-medium'>Paid</span>}
                  <button onClick={() => cancelServiceBooking(item._id)} className='border border-red-500 text-red-500 px-5 py-2 rounded-full hover:bg-red-600 hover:text-white transition-all'>Cancel</button>
                </div>
                : <span className='text-gray-400 text-sm'> </span>}   { /*<span className='text-gray-400 text-sm'>No action</span>*/}
            </div>
          )
        })}
      </div>

      {!loading && serviceBookings.length === 0 && <p className='text-center text-gray-500 py-16'>No service bookings found.</p>}
    </div>
  )
}

export default MyServiceBookings
