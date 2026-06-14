import React, { useState } from 'react'
import { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment, addPrescription } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [prescription, setPrescription] = useState({})
  const navigate = useNavigate()

  const handleChange = (appointmentId, field, value) => {
    setPrescription(prev => ({ ...prev, [appointmentId]: { ...(prev[appointmentId] || {}), [field]: value } }))
  }

  const handlePrescriptionSubmit = (appointmentId) => {
    const data = prescription[appointmentId]
    if (!data?.diagnosis || !data?.medicines) return
    addPrescription({ appointmentId, diagnosis: data.diagnosis, medicines: data.medicines, advice: data.advice || '' })
    setPrescription(prev => ({ ...prev, [appointmentId]: { diagnosis: '', medicines: '', advice: '' } }))
  }

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  return (
    <div className='w-full max-w-[1280px] mx-auto'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_2fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => (
          <div onClick={() => navigate(`/doctor-appointments/${item._id}`)} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_2fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50 cursor-pointer' key={index}>
            <p className='max-sm:hidden'>{index+1}</p>
            <div className='flex items-center gap-2'>
              {item.userData.image
                ? <img src={item.userData.image} className='w-8 h-8 rounded-full object-cover' alt="" />
                : <div className='w-8 h-8 rounded-full bg-[#EAEFFF] flex items-center justify-center text-primary text-xs'>{item.userData.name?.charAt(0)}</div>}
              <p>{item.userData.name}</p>
            </div>
            <div>
              <p className='text-xs inline border border-primary px-2 rounded-full'>
                {item.payment?'Online':'CASH'}
              </p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <div>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              {item.bookingReason && <p className='text-primary text-xs'>Reason: {item.bookingReason}</p>}
              {item.isEmergency && <p className='text-red-600 text-xs'>Emergency: {item.emergencyNotes}</p>}
              {item.userData?.medicalHistory?.manual && <p className='text-xs mt-1'>History: {item.userData.medicalHistory.manual}</p>}
              {item.userData?.medicalHistory?.pdfUrl && <a className='text-primary text-xs underline' href={item.userData.medicalHistory.pdfUrl} target='_blank' rel='noreferrer'>View medical PDF</a>}
            </div>
            <p>{currency}{item.amount}</p>
            {item.cancelled
              ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              : item.isCompleted
                ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                : <div className='flex flex-col gap-2' onClick={(event) => event.stopPropagation()}>
                  <div className='flex'>
                  <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                  <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                  </div>
                  <div className='grid gap-1'>
                    <input value={prescription[item._id]?.diagnosis || ''} onChange={(e) => handleChange(item._id, 'diagnosis', e.target.value)} className='border rounded px-2 py-1 text-xs' placeholder='Diagnosis' />
                    <textarea value={prescription[item._id]?.medicines || ''} onChange={(e) => handleChange(item._id, 'medicines', e.target.value)} className='border rounded px-2 py-1 text-xs' placeholder='Medicines' />
                    <input value={prescription[item._id]?.advice || ''} onChange={(e) => handleChange(item._id, 'advice', e.target.value)} className='border rounded px-2 py-1 text-xs' placeholder='Advice' />
                    <button onClick={() => handlePrescriptionSubmit(item._id)} className='border border-primary text-primary rounded px-2 py-1 text-xs hover:bg-primary hover:text-white transition-all'>Save Prescription</button>
                  </div>
                </div>
            }
          </div>
        ))}
      </div>

    </div>
  )
}

export default DoctorAppointments
