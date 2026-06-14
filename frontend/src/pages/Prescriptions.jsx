import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const Prescriptions = () => {
  const { backendUrl, token } = useContext(AppContext)
  const [prescriptions, setPrescriptions] = useState([])

  const getPrescriptions = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/prescriptions', { headers: { token } })
      if (data.success) {
        setPrescriptions(data.prescriptions)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const downloadPrescription = (item) => {
    const content = [
      'CareSync Prescription',
      `Patient: ${item.patientName}`,
      `Doctor: ${item.doctorName}`,
      `Date: ${new Date(item.createdAt).toLocaleString()}`,
      '',
      `Diagnosis:\n${item.diagnosis}`,
      '',
      `Medicines:\n${item.medicines}`,
      '',
      `Advice:\n${item.advice || 'N/A'}`
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prescription-${item._id}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (token) getPrescriptions()
  }, [token])

  return (
    <div className='min-h-[70vh] py-8'>
      <p className='text-3xl font-semibold text-gray-800'>My Prescriptions</p>
      <div className='grid gap-4 mt-6'>
        {prescriptions.map(item => (
          <div key={item._id} className='border rounded-lg p-5 hover:shadow-lg transition-all bg-white'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div>
                <p className='text-lg font-semibold text-gray-800'>{item.doctorName}</p>
                <p className='text-sm text-gray-500'>{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => downloadPrescription(item)} className='border border-primary text-primary px-5 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Download</button>
            </div>
            <div className='grid md:grid-cols-3 gap-4 mt-5 text-sm text-gray-600'>
              <div><p className='font-medium text-gray-800'>Diagnosis</p><p className='whitespace-pre-wrap'>{item.diagnosis}</p></div>
              <div><p className='font-medium text-gray-800'>Medicines</p><p className='whitespace-pre-wrap'>{item.medicines}</p></div>
              <div><p className='font-medium text-gray-800'>Advice</p><p className='whitespace-pre-wrap'>{item.advice || 'N/A'}</p></div>
            </div>
          </div>
        ))}
        {prescriptions.length === 0 && <p className='text-center text-gray-500 py-16'>No prescriptions available.</p>}
      </div>
    </div>
  )
}

export default Prescriptions
