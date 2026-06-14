import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const DoctorEmergencyCases = () => {
  const { dToken, emergencyCases, getEmergencyCases } = useContext(DoctorContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (dToken) getEmergencyCases()
  }, [dToken])

  return (
    <div className='m-5 w-full max-w-7xl'>
      <p className='mb-3 text-lg font-medium'>Emergency Bookings</p>
      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        {emergencyCases.map((item) => (
          <div key={item._id} className='grid md:grid-cols-[1.3fr_2fr_1fr_1fr] gap-4 p-5 border-b text-gray-600 hover:bg-gray-50'>
            <div>
              <p className='font-medium text-gray-800'>{item.patientName || item.userData?.name}</p>
              <p>{item.patientMobile || item.userData?.phone}</p>
              {item.patientAddress && <p>{item.patientAddress}</p>}
            </div>
            <p className='whitespace-pre-wrap'>{item.emergencyNotes}</p>
            <p>{slotDateFormat(item.slotDate)}<br />{item.slotTime}</p>
            <p className={item.cancelled ? 'text-red-500' : item.isCompleted ? 'text-green-600' : 'text-amber-600'}>
              {item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending'}
            </p>
          </div>
        ))}
        {emergencyCases.length === 0 && <p className='text-center text-gray-500 py-12'>No emergency bookings assigned.</p>}
      </div>
    </div>
  )
}

export default DoctorEmergencyCases
