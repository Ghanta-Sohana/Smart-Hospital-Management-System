import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, useParams } from 'react-router-dom'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointmentDetails = () => {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { dToken, backendUrl, cancelAppointment, completeAppointment, addPrescription } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [appointment, setAppointment] = useState(null)
  const [prescription, setPrescription] = useState({ diagnosis: '', medicines: '', advice: '' })
  const [viewer, setViewer] = useState(null)

  const getAppointment = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/appointment/${appointmentId}`, { headers: { dToken } })
      if (data.success) {
        setAppointment(data.appointment)
      } else {
        toast.error(data.message)
        navigate('/doctor-appointments')
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handlePrescriptionSubmit = async () => {
    if (!prescription.diagnosis || !prescription.medicines) return
    await addPrescription({ appointmentId, ...prescription })
    setPrescription({ diagnosis: '', medicines: '', advice: '' })
  }

  const handleCancel = async () => {
    await cancelAppointment(appointmentId)
    getAppointment()
  }

  const handleComplete = async () => {
    await completeAppointment(appointmentId)
    getAppointment()
  }

  const isImage = (file = {}) => {
    const type = file.type || ''
    return type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(file.url || '')
  }

  const isPdf = (file = {}) => file.type === 'application/pdf' || /\.pdf(\?|$)/i.test(file.url || file.name || '')

  const canPreview = (file = {}) => isImage(file) || isPdf(file)

  const formatUploadedAt = (uploadedAt) => {
    if (!uploadedAt) return '-'
    return new Date(uploadedAt).toLocaleDateString()
  }

  const getUploadedFiles = (history = {}) => {
    if (history.files?.length) return history.files
    if (history.pdfUrl) {
      return [{
        url: history.pdfUrl,
        name: history.pdfName || 'Medical document',
        type: 'application/pdf',
        uploadedAt: history.updatedAt
      }]
    }
    return []
  }

  useEffect(() => {
    if (dToken) getAppointment()
  }, [dToken, appointmentId])

  if (!appointment) {
    return <div className='m-5 w-full bg-white border rounded p-6 text-gray-500'>Loading appointment details...</div>
  }

  const history = appointment.userData?.medicalHistory || {}
  const uploadedFiles = getUploadedFiles(history)

  return (
    <div className='w-full max-w-[1280px] mx-auto'>
      {viewer && (
        <div className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden border shadow-xl'>
            <div className='flex justify-between items-center px-5 py-3 border-b'>
              <p className='font-medium'>{viewer.name}</p>
              <button onClick={() => setViewer(null)} className='border rounded-full px-4 py-1 text-sm hover:bg-gray-50'>Close</button>
            </div>
            <div className='h-[75vh] bg-gray-50'>
              {canPreview(viewer)
                ? isImage(viewer)
                  ? <img src={viewer.url} alt={viewer.name} className='w-full h-full object-contain' />
                  : <iframe title={viewer.name} src={viewer.url} className='w-full h-full' />
                : <div className='h-full flex flex-col items-center justify-center text-center px-6'>
                  <p className='text-gray-700 font-medium'>Preview is not available for this file type.</p>
                  <p className='text-sm text-gray-500 mt-2'>You can download or open the file in a supported application.</p>
                  <a href={viewer.url} target='_blank' rel='noreferrer' className='mt-4 bg-primary text-white rounded-full px-5 py-2 text-sm'>Download File</a>
                </div>}
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/doctor-appointments')} className='mb-4 border rounded-full px-5 py-2 text-sm text-gray-600 bg-white hover:bg-gray-50'>Back to appointments</button>

      <div className='bg-white border rounded p-6'>
        <div className='flex flex-wrap justify-between gap-4 border-b pb-5'>
          <div className='flex items-center gap-4'>
            {appointment.userData?.image
              ? <img src={appointment.userData.image} className='w-20 h-20 rounded-full object-cover bg-[#EAEFFF]' alt="" />
              : <div className='w-20 h-20 rounded-full bg-[#EAEFFF] flex items-center justify-center text-primary font-medium'>{appointment.userData?.name?.charAt(0)}</div>}
            <div>
              <p className='text-2xl font-semibold text-gray-800'>{appointment.userData?.name}</p>
              <p className='text-gray-500'>{appointment.userData?.phone || appointment.patientMobile}</p>
              {appointment.isEmergency && <p className='text-red-600 text-sm font-medium mt-1'>Emergency appointment</p>}
            </div>
          </div>
          <div className='text-sm text-gray-600'>
            <p><span className='font-medium'>Status:</span> {appointment.cancelled ? 'Cancelled' : appointment.isCompleted ? 'Completed' : 'Active'}</p>
            <p><span className='font-medium'>Payment:</span> {appointment.payment ? 'Online' : 'CASH'}</p>
            <p><span className='font-medium'>Fees:</span> {currency}{appointment.amount}</p>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-5 mt-5'>
          <section className='border rounded p-4'>
            <p className='font-semibold text-gray-800 mb-3'>Patient Details</p>
            <div className='grid gap-2 text-sm text-gray-600'>
              <p><span className='font-medium'>Age:</span> {appointment.patientAge ?? calculateAge(appointment.userData?.dob)}</p>
              <p><span className='font-medium'>Gender:</span> {appointment.patientGender || appointment.userData?.gender || 'Not Selected'}</p>
              <p><span className='font-medium'>Date of Birth:</span> {appointment.patientDob || appointment.userData?.dob}</p>
              <p><span className='font-medium'>Mobile:</span> {appointment.patientMobile || appointment.userData?.phone}</p>
            </div>
          </section>

          <section className='border rounded p-4'>
            <p className='font-semibold text-gray-800 mb-3'>Appointment Details</p>
            <div className='grid gap-2 text-sm text-gray-600'>
              <p><span className='font-medium'>Date:</span> {slotDateFormat(appointment.slotDate)}</p>
              <p><span className='font-medium'>Time:</span> {appointment.slotTime}</p>
              <p><span className='font-medium'>Doctor:</span> {appointment.docData?.name || appointment.doctorName}</p>
              <p><span className='font-medium'>Speciality:</span> {appointment.docData?.speciality || '-'}</p>
            </div>
          </section>

          <section className='border rounded p-4'>
            <p className='font-semibold text-gray-800 mb-3'>Status Update</p>
            {appointment.cancelled
              ? <p className='text-red-500 text-sm font-medium'>Cancelled</p>
              : appointment.isCompleted
                ? <p className='text-green-600 text-sm font-medium'>Completed</p>
                : <div className='flex gap-3'>
                  <img onClick={handleCancel} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                  <img onClick={handleComplete} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                </div>}
          </section>
        </div>

        <div className='grid lg:grid-cols-2 gap-5 mt-5'>
          <section className='border rounded p-4'>
            <p className='font-semibold text-gray-800 mb-3'>Reason For Booking Appointment</p>
            <p className='text-sm text-gray-600 whitespace-pre-wrap'>{appointment.bookingReason || appointment.emergencyNotes || 'No reason recorded.'}</p>
          </section>

          <section className='border rounded p-4'>
            <p className='font-semibold text-gray-800 mb-3'>Medical History</p>
            <p className='text-sm text-gray-600 whitespace-pre-wrap'>{history.manual || 'No medical history added.'}</p>
          </section>
        </div>

        <section className='border rounded p-4 mt-5'>
          <p className='font-semibold text-gray-800 mb-3'>Uploaded Documents</p>
          {uploadedFiles.length
            ? <div className='grid gap-3'>
              {uploadedFiles.map((file, index) => (
                <div key={file._id || file.url || index} className='flex flex-wrap items-center justify-between gap-3 border rounded p-3 text-sm'>
                  <div>
                    <p className='font-medium text-gray-800'>{file.name}</p>
                    <p className='text-gray-500'>{file.type || 'Document'} | Uploaded: {formatUploadedAt(file.uploadedAt)}</p>
                  </div>
                  <div className='flex gap-2'>
                    <button onClick={() => setViewer(file)} className='border border-primary text-primary rounded-full px-5 py-2 text-sm hover:bg-primary hover:text-white transition-all'>View</button>
                    {!canPreview(file) && <a href={file.url} target='_blank' rel='noreferrer' className='border rounded-full px-5 py-2 text-sm text-gray-600 hover:bg-gray-50'>Download</a>}
                  </div>
                </div>
              ))}
            </div>
            : <p className='text-sm text-gray-500'>No uploaded documents.</p>}
        </section>

        <section className='border rounded p-4 mt-5'>
          <p className='font-semibold text-gray-800 mb-3'>Prescription Section</p>
          <div className='grid md:grid-cols-3 gap-3'>
            <input value={prescription.diagnosis} onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))} className='border rounded px-3 py-2 text-sm' placeholder='Diagnosis' />
            <textarea value={prescription.medicines} onChange={(e) => setPrescription(prev => ({ ...prev, medicines: e.target.value }))} className='border rounded px-3 py-2 text-sm' placeholder='Medicines' />
            <input value={prescription.advice} onChange={(e) => setPrescription(prev => ({ ...prev, advice: e.target.value }))} className='border rounded px-3 py-2 text-sm' placeholder='Advice' />
          </div>
          <button onClick={handlePrescriptionSubmit} className='mt-3 border border-primary text-primary rounded-full px-5 py-2 text-sm hover:bg-primary hover:text-white transition-all'>Save Prescription</button>
        </section>

        <section className='border rounded p-4 mt-5'>
          <p className='font-semibold text-gray-800 mb-3'>Notes</p>
          <p className='text-sm text-gray-600 whitespace-pre-wrap'>{appointment.emergencyNotes || history.manual || 'No notes added.'}</p>
        </section>
      </div>
    </div>
  )
}

export default DoctorAppointmentDetails
