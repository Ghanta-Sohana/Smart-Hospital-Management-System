import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const ServiceBookings = () => {
  const { aToken, serviceBookings, getServiceBookings, updateServiceBookingStatus } = useContext(AdminContext)
  const { currency } = useContext(AppContext)
  const [updating, setUpdating] = useState('')

  useEffect(() => {
    if (aToken) getServiceBookings()
  }, [aToken])

  const handleStatusUpdate = async (bookingId, status) => {
    setUpdating(`${bookingId}-${status}`)
    await updateServiceBookingStatus(bookingId, status)
    setUpdating('')
  }

  const statusClass = (status) => {
    if (status === 'Completed') return 'text-green-600 bg-green-50 border-green-200'
    if (status === 'Cancelled') return 'text-red-600 bg-red-50 border-red-200'
    return 'text-amber-700 bg-amber-50 border-amber-200'
  }

  return (
    <div className='w-full max-w-[1280px] mx-auto'>
      <p className='mb-3 text-lg font-medium'>Service Bookings</p>
      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden lg:grid grid-cols-[1.3fr_1.3fr_1fr_1fr_0.8fr_1.2fr] gap-3 py-3 px-5 border-b font-medium text-gray-700'>
          <p>Service</p>
          <p>Patient</p>
          <p>Date & Time</p>
          <p>Status</p>
          <p>Amount</p>
          <p>Action</p>
        </div>
        {serviceBookings.map((item) => {
          const status = item.status || (item.cancelled ? 'Cancelled' : 'Pending')
          const isPending = status === 'Pending'

          return (
          <div key={item._id} className='grid lg:grid-cols-[1.3fr_1.3fr_1fr_1fr_0.8fr_1.2fr] gap-3 py-4 px-5 border-b text-gray-600 hover:bg-gray-50'>
            <div>
              <p className='font-medium text-gray-800'>{item.serviceData?.name || 'Hospital Service'}</p>
              <p>{item.serviceData?.description}</p>
            </div>
            <div>
              <p>{item.patientName || item.userData?.name}</p>
              <p>{item.patientPhone || item.userData?.phone || '-'}</p>
              {item.patientNotes && <p className='mt-1'>Notes: {item.patientNotes}</p>}
            </div>
            <p>{item.slotDate}<br />{item.slotTime}</p>
            <p className={`w-fit h-fit px-3 py-1 rounded-full border text-xs font-medium ${statusClass(status)}`}>{status}</p>
            <p>{currency}{item.amount}</p>
            {isPending
              ? <div className='flex flex-wrap gap-2'>
                <button disabled={Boolean(updating)} onClick={() => handleStatusUpdate(item._id, 'Completed')} className='border border-green-500 text-green-600 px-3 py-1 rounded-full hover:bg-green-600 hover:text-white disabled:opacity-50 transition-all'>Complete</button>
                <button disabled={Boolean(updating)} onClick={() => handleStatusUpdate(item._id, 'Cancelled')} className='border border-red-500 text-red-500 px-3 py-1 rounded-full hover:bg-red-600 hover:text-white disabled:opacity-50 transition-all'>Cancel</button>
              </div>
              : <span className='text-gray-400'>No action</span>}
          </div>
          )
        })}
        {serviceBookings.length === 0 && <p className='text-center text-gray-500 py-12'>No service bookings found.</p>}
      </div>
    </div>
  )
}

export default ServiceBookings
