import React, { useContext, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const getTodayDateValue = () => {
  const date = new Date()
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().split('T')[0]
}

const EmergencyBooking = () => {
  const { aToken } = useContext(AdminContext)
  const { backendUrl, calculateAge } = useContext(AppContext)
  const today = getTodayDateValue()
  const initialForm = { patientName: '', age: '', dob: '', gender: '', mobile: '', address: '', doctorName: '', slotDate: today, slotTime: '', emergencyNotes: '' }
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const isPastAppointment = (slotDate, slotTime) => {
    if (!slotDate || !slotTime) return false
    return new Date(`${slotDate}T${slotTime}`).getTime() < Date.now()
  }

  const validateField = (name, value) => {
    if (name === 'dob' && !value) return ''
    if (name === 'doctorName' && !value) return ''
    if (!value) return 'Required'
    if (name === 'age' && Number(value) < 0) return 'Age cannot be negative'
    if (name === 'mobile' && !/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10 digit mobile number'
    if ((name === 'slotDate' || name === 'slotTime') && isPastAppointment(name === 'slotDate' ? value : form.slotDate, name === 'slotTime' ? value : form.slotTime)) return 'Emergency date and time cannot be in the past'
    if (name === 'emergencyNotes' && value.trim().length < 10) return 'Describe the emergency in at least 10 characters'
    return ''
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name === 'age' && Number(value) < 0) return
    if (name === 'dob') {
      setForm(prev => ({ ...prev, dob: value, age: calculateAge(value) }))
      setErrors(prev => ({ ...prev, dob: '', age: '' }))
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/add-emergency-booking', {
        ...form,
        slotDate: formatSlotDate(form.slotDate),
        slotTime: formatSlotTime(form.slotTime)
      }, { headers: { aToken } })

      if (data.success) {
        toast.success(data.message)
        setForm(initialForm)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className='w-full max-w-[1280px] mx-auto'>
      <form onSubmit={handleSubmit} className='bg-white border border-red-100 rounded p-6 shadow-sm'>
        <p className='text-xl font-semibold text-red-600 mb-5'>Add Emergency Booking</p>
        <div className='grid md:grid-cols-2 gap-4'>
          <div>
            <p>Patient Name</p>
            <input name='patientName' value={form.patientName} onChange={handleChange} placeholder='Enter patient full name' className='w-full border rounded p-3' required />
            {errors.patientName && <p className='text-red-500 text-xs'>{errors.patientName}</p>}
          </div>
          <div>
            <p>Age</p>
            <input name='age' value={form.age} onChange={handleChange} placeholder='Enter patient age' min='0' type='number' className='w-full border rounded p-3' required />
            {errors.age && <p className='text-red-500 text-xs'>{errors.age}</p>}
          </div>
          <div>
            <p>Date of Birth</p>
            <input name='dob' value={form.dob} onChange={handleChange} max={today} type='date' className='w-full border rounded p-3' />
            {errors.dob && <p className='text-red-500 text-xs'>{errors.dob}</p>}
          </div>
          <div>
            <p>Gender</p>
            <select name='gender' value={form.gender} onChange={handleChange} className='w-full border rounded p-3' required>
              <option value=''>Select gender</option>
              <option value='Male'>Male</option>
              <option value='Female'>Female</option>
              <option value='Other'>Other</option>
            </select>
            {errors.gender && <p className='text-red-500 text-xs'>{errors.gender}</p>}
          </div>
          <div>
            <p>Mobile Number</p>
            <input name='mobile' value={form.mobile} onChange={handleChange} placeholder='Enter emergency contact number' inputMode='numeric' maxLength={10} className='w-full border rounded p-3' required />
            {errors.mobile && <p className='text-red-500 text-xs'>{errors.mobile}</p>}
          </div>
          <div>
            <p>Address</p>
            <input name='address' value={form.address} onChange={handleChange} placeholder='Enter patient address' className='w-full border rounded p-3' required />
            {errors.address && <p className='text-red-500 text-xs'>{errors.address}</p>}
          </div>
          <div>
            <p>Doctor Name <span className='text-gray-400 text-xs'>(Optional)</span></p>
            <input name='doctorName' value={form.doctorName} onChange={handleChange} placeholder='Enter assigned doctor name' className='w-full border rounded p-3' />
            {errors.doctorName && <p className='text-red-500 text-xs'>{errors.doctorName}</p>}
          </div>
          <div>
            <p>Emergency Date</p>
            <input name='slotDate' value={form.slotDate} onChange={handleChange} min={today} type='date' className='w-full border rounded p-3' required />
            {errors.slotDate && <p className='text-red-500 text-xs'>{errors.slotDate}</p>}
          </div>
          <div>
            <p>Emergency Time</p>
            <input name='slotTime' value={form.slotTime} onChange={handleChange} type='time' className='w-full border rounded p-3' required />
            {errors.slotTime && <p className='text-red-500 text-xs'>{errors.slotTime}</p>}
          </div>
        </div>
        <div className='mt-4'>
          <p>Reason for Emergency</p>
          <textarea name='emergencyNotes' value={form.emergencyNotes} onChange={handleChange} rows={5} placeholder='Enter emergency details and immediate concern' className='w-full border rounded p-3' required />
          {errors.emergencyNotes && <p className='text-red-500 text-xs'>{errors.emergencyNotes}</p>}
        </div>
        <button disabled={Object.values(errors).some(Boolean)} className='mt-5 bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700 disabled:opacity-50 transition-all'>Create Emergency Booking</button>
      </form>
    </div>
  )
}

export default EmergencyBooking
