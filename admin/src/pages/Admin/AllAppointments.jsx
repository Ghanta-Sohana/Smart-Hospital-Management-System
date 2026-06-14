import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {

  const { aToken, appointments, cancelAppointment, rescheduleAppointment, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [reschedule, setReschedule] = useState({})

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  const handleRescheduleChange = (appointmentId, field, value) => {
    setReschedule(prev => ({ ...prev, [appointmentId]: { ...(prev[appointmentId] || {}), [field]: value } }))
  }

  const formatSlotDate = (dateValue) => {
    const date = new Date(dateValue)
    return `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`
  }

  const formatSlotTime = (timeValue) => {
    const [hours, minutes] = timeValue.split(':')
    const date = new Date()
    date.setHours(Number(hours), Number(minutes), 0, 0)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const submitReschedule = (appointmentId) => {
    const item = reschedule[appointmentId]
    if (!item?.date || !item?.time) return
    rescheduleAppointment(appointmentId, formatSlotDate(item.date), formatSlotTime(item.time))
  }

  return (
    <div className='w-full max-w-[1280px] mx-auto'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.4fr_1.7fr_0.8fr_1.7fr_1.7fr_1.7fr_0.8fr_1.8fr] grid-flow-col py-3 px-6 border-b font-medium text-gray-700'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Reason</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.4fr_1.7fr_0.8fr_1.7fr_1.7fr_1.7fr_0.8fr_1.8fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index+1}</p>
            <div className='flex items-center gap-2'>
              {item.userData.image
                ? <img src={item.userData.image} className='w-8 h-8 rounded-full object-cover' alt="" />
                : <div className='w-8 h-8 rounded-full bg-[#EAEFFF] flex items-center justify-center text-primary text-xs'>{item.userData.name?.charAt(0)}</div>}
              <p>{item.userData.name}</p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <p className='text-xs text-gray-600'>{item.bookingReason || item.emergencyNotes || '-'}</p>
            <div className='flex items-center gap-2'>
              {item.docData?.image
                ? <img src={item.docData.image} className='w-8 h-8 rounded-full object-cover bg-gray-200' alt="" />
                : <div className='w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 text-xs'>ER</div>}
              <p>{item.docData?.name || item.doctorName || 'Emergency Appointment'}</p>
            </div>
            <p>{currency}{item.amount}</p>
            {item.cancelled ? <p className='text-red-400 text-xs font-medium'>Cancelled</p> : item.isCompleted ? <p className='text-green-500 text-xs font-medium'>Completed</p> : <div className='flex flex-col gap-2'>
              <div className='flex'>
                <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
              </div>
              <div className='flex flex-wrap gap-1'>
                <input type='date' className='border rounded px-1 py-1 text-xs' onChange={(e) => handleRescheduleChange(item._id, 'date', e.target.value)} />
                <input type='time' className='border rounded px-1 py-1 text-xs' onChange={(e) => handleRescheduleChange(item._id, 'time', e.target.value)} />
                <button onClick={() => submitReschedule(item._id)} className='text-primary border border-primary rounded px-2 text-xs hover:bg-primary hover:text-white transition-all'>Reschedule</button>
              </div>
            </div>}
          </div>
        ))}
      </div>

    </div>
  )
}

export default AllAppointments
