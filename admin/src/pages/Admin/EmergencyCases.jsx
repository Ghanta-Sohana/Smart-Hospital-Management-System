import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const EmergencyCases = () => {
  const { aToken, emergencyCases, getEmergencyCases } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) getEmergencyCases()
  }, [aToken])

  return (
    <div className='w-full max-w-[1280px] mx-auto'>
      <p className='mb-3 text-lg font-medium'>Emergency Cases List</p>
      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden lg:grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1.5fr] gap-3 py-3 px-5 border-b font-medium text-gray-700'>
          <p>Patient</p>
          <p>Emergency Details</p>
          <p>Assigned Doctor</p>
          <p>Status</p>
          <p>Date / Contact</p>
        </div>
        {emergencyCases.map((item) => (
          <div key={item._id} className='grid lg:grid-cols-[1.5fr_2fr_1.5fr_1fr_1.5fr] gap-3 py-4 px-5 border-b text-gray-600 hover:bg-gray-50'>
            <div>
              <p className='font-medium text-gray-800'>{item.patientName || item.userData?.name}</p>
              <p>Age: {item.patientAge || '-'}</p>
              <p>Gender: {item.patientGender || item.userData?.gender || '-'}</p>
            </div>
            <p className='whitespace-pre-wrap'>{item.emergencyNotes}</p>
            <p>{item.docData?.name || item.doctorName || 'Not assigned'}</p>
            <p className={item.cancelled ? 'text-red-500' : item.isCompleted ? 'text-green-600' : 'text-amber-600'}>
              {item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending'}
            </p>
            <div>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              <p>{item.patientMobile || item.userData?.phone}</p>
              {item.patientAddress && <p>{item.patientAddress}</p>}
            </div>
          </div>
        ))}
        {emergencyCases.length === 0 && <p className='text-center text-gray-500 py-12'>No emergency cases found.</p>}
      </div>
    </div>
  )
}

export default EmergencyCases
