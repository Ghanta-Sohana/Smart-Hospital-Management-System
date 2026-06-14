import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const DoctorServiceBookings = () => {
  const { dToken, serviceBookings, getServiceBookings } = useContext(DoctorContext)
  const { currency } = useContext(AppContext)

  useEffect(() => {
    if (dToken) getServiceBookings()
  }, [dToken])

  return (
    <div className='m-5 w-full max-w-7xl'>
      <p className='mb-3 text-lg font-medium'>Service Bookings</p>
      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        {serviceBookings.map((item) => (
          <div key={item._id} className='grid md:grid-cols-[1.4fr_1.4fr_1fr_1fr] gap-4 p-5 border-b text-gray-600 hover:bg-gray-50'>
            <div>
              <p className='font-medium text-gray-800'>{item.serviceData?.name || 'Hospital Service'}</p>
              <p>{item.serviceData?.description}</p>
            </div>
            <div>
              <p>{item.patientName || item.userData?.name}</p>
              <p>{item.patientPhone || item.userData?.phone || '-'}</p>
              {item.patientNotes && <p>Notes: {item.patientNotes}</p>}
            </div>
            <p>{item.slotDate}<br />{item.slotTime}</p>
            <div>
              <p>{currency}{item.amount}</p>
              <p className={item.cancelled ? 'text-red-500' : 'text-amber-600'}>{item.cancelled ? 'Cancelled' : 'Pending'}</p>
            </div>
          </div>
        ))}
        {serviceBookings.length === 0 && <p className='text-center text-gray-500 py-12'>No service bookings found.</p>}
      </div>
    </div>
  )
}

export default DoctorServiceBookings
