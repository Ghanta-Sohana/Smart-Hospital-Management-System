import React, { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const initialForm = {
  patientName: '',
  patientAge: '',
  patientGender: '',
  patientDob: '',
  patientPhone: '',
  patientNotes: '',
  slotTime: ''
}

const getServiceSlotDateTime = (serviceDate, slotTime) => {
  const [year, month, day] = String(serviceDate).split('-').map(Number)
  const [time, meridiem = ''] = String(slotTime).trim().split(' ')
  const [hourText, minuteText] = String(time || '').split(':')
  let hours = Number(hourText)
  const minutes = Number(minuteText)

  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null
  if (meridiem.toLowerCase() === 'pm' && hours !== 12) hours += 12
  if (meridiem.toLowerCase() === 'am' && hours === 12) hours = 0

  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

const ServiceBooking = () => {
  const { serviceId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { backendUrl, token, userData, currencySymbol, calculateAge } = useContext(AppContext)
  const [services, setServices] = useState([])
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const service = useMemo(() => services.find(item => item._id === serviceId), [services, serviceId])
  const availableSlots = useMemo(() => {
    if (!service) return []
    return (service.availableSlots || []).filter(slot => {
      const slotDateTime = getServiceSlotDateTime(service.date, slot)
      return slotDateTime && slotDateTime.getTime() > Date.now()
    })
  }, [service])

  const getServices = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/services')
      if (data.success) {
        setServices(data.services)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const validateField = (name, value) => {
    if (['patientName', 'patientAge', 'patientGender', 'patientPhone', 'slotTime'].includes(name) && !String(value || '').trim()) return 'Required'
    if (name === 'patientName' && value.trim().length > 0 && value.trim().length < 3) return 'Enter at least 3 characters'
    if (name === 'patientAge' && (Number(value) < 0 || Number(value) > 120)) return 'Enter a valid age'
    if (name === 'patientPhone' && value && !/^[6-9]\d{0,9}$/.test(value)) return 'Phone must start with 6-9 and contain digits only'
    if (name === 'patientPhone' && value.length === 10 && !/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10 digit phone number'
    if (name === 'patientNotes' && value.length > 500) return 'Notes must be under 500 characters'
    return ''
  }

  const notifyFieldError = (name, error) => {
    if (error && error !== 'Required') {
      toast.error(error, { toastId: `service-booking-${name}` })
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name === 'patientAge' && Number(value) < 0) return
    if (name === 'patientDob') {
      const calculatedAge = calculateAge(value)
      setForm(prev => ({ ...prev, patientDob: value, patientAge: calculatedAge }))
      setErrors(prev => ({ ...prev, patientAge: validateField('patientAge', String(calculatedAge)) }))
      return
    }
    const error = validateField(name, value)
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: error }))
    notifyFieldError(name, error)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!token) {
      toast.warning('Login to book services')
      navigate('/login')
      return
    }

    const nextErrors = {
      patientName: validateField('patientName', form.patientName),
      patientAge: validateField('patientAge', String(form.patientAge)),
      patientGender: validateField('patientGender', form.patientGender),
      patientPhone: validateField('patientPhone', form.patientPhone),
      slotTime: validateField('slotTime', form.slotTime),
      patientNotes: validateField('patientNotes', form.patientNotes)
    }
    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) {
      toast.error('All booking fields are required')
      return
    }

    if (!/^[6-9]\d{9}$/.test(form.patientPhone)) {
      toast.error('Enter a valid 10 digit phone number')
      return
    }

    try {
      const { data } = await axios.post(backendUrl + '/api/user/book-service', {
        serviceId,
        slotTime: form.slotTime,
        patientName: form.patientName,
        patientAge: form.patientAge,
        patientGender: form.patientGender,
        patientDob: form.patientDob,
        patientPhone: form.patientPhone,
        patientNotes: form.patientNotes
      }, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        navigate('/my-service-bookings')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    getServices()
  }, [])

  useEffect(() => {
    if (userData) {
      setForm(prev => ({
        ...prev,
        patientName: prev.patientName || userData.name || '',
        patientGender: prev.patientGender || (userData.gender === 'Not Selected' ? '' : userData.gender || ''),
        patientPhone: prev.patientPhone || userData.phone || '',
        patientDob: prev.patientDob || (userData.dob === 'Not Selected' ? '' : userData.dob || ''),
        patientAge: prev.patientAge || calculateAge(userData.dob)
      }))
    }
  }, [userData])

  useEffect(() => {
    const selectedSlot = searchParams.get('slot')
    if (selectedSlot) {
      setForm(prev => ({ ...prev, slotTime: selectedSlot }))
    }
  }, [searchParams])

  if (!service) {
    return (
      <div className='min-h-[60vh] py-10'>
        <p className='text-gray-600'>Loading service details...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='min-h-[70vh] py-8'>
      <div className='mb-8'>
        <p className='text-3xl font-semibold text-gray-800'>Service Booking</p>
        <p className='text-gray-600 mt-2'>Complete patient details for the selected hospital service.</p>
      </div>

      <div className='grid lg:grid-cols-2 gap-8 items-stretch'>
      <div className='bg-white border rounded-lg p-5 w-full shadow-sm'>
        <div className='grid sm:grid-cols-2 gap-5 text-gray-700'>
          <div>
            <p className='font-medium mb-2'>Patient Name</p>
            <input name='patientName' value={form.patientName} onChange={handleChange} placeholder='Enter patient full name' className='w-full border rounded p-3 focus:outline-primary' type='text' required />
            {errors.patientName && <p className='text-red-500 text-xs mt-1'>{errors.patientName}</p>}
          </div>
          <div>
            <p className='font-medium mb-2'>Age</p>
            <input name='patientAge' value={form.patientAge} onChange={handleChange} placeholder='Enter patient age' className='w-full border rounded p-3 focus:outline-primary' type='number' min='0' required />
            {errors.patientAge && <p className='text-red-500 text-xs mt-1'>{errors.patientAge}</p>}
          </div>
          <div>
            <p className='font-medium mb-2'>Date of Birth</p>
            <input name='patientDob' value={form.patientDob} onChange={handleChange} className='w-full border rounded p-3 focus:outline-primary' type='date' />
          </div>
          <div>
            <p className='font-medium mb-2'>Gender</p>
            <select name='patientGender' value={form.patientGender} onChange={handleChange} className='w-full border rounded p-3 focus:outline-primary' required>
              <option value=''>Select Gender</option>
              <option value='Male'>Male</option>
              <option value='Female'>Female</option>
              <option value='Other'>Other</option>
            </select>
            {errors.patientGender && <p className='text-red-500 text-xs mt-1'>{errors.patientGender}</p>}
          </div>
          <div>
            <p className='font-medium mb-2'>Phone</p>
            <input name='patientPhone' value={form.patientPhone} onChange={handleChange} placeholder='Enter patient contact number' inputMode='numeric' maxLength={10} className='w-full border rounded p-3 focus:outline-primary' required />
            {errors.patientPhone && <p className='text-red-500 text-xs mt-1'>{errors.patientPhone}</p>}
          </div>
          <div>
            <p className='font-medium mb-2'>Date</p>
            <input value={service.date} className='w-full border rounded p-3 bg-gray-50 text-gray-600' type='text' readOnly />
          </div>
          <div>
            <p className='font-medium mb-2'>Available Time Slot</p>
            <select name='slotTime' value={form.slotTime} onChange={handleChange} className='w-full border rounded p-3 focus:outline-primary' required>
              <option value=''>Select Time Slot</option>
              {availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
            {errors.slotTime && <p className='text-red-500 text-xs mt-1'>{errors.slotTime}</p>}
          </div>
          <div>
            <p className='font-medium mb-2'>Service Name</p>
            <input value={service.name} className='w-full border rounded p-3 bg-gray-50 text-gray-600' type='text' readOnly />
          </div>
        </div>

        <div className='mt-5'>
          <p className='font-medium mb-2'>Notes / Details</p>
          <textarea name='patientNotes' value={form.patientNotes} onChange={handleChange} rows={4} placeholder='Enter service notes or patient details' className='w-full border rounded p-3 focus:outline-primary' />
          {errors.patientNotes && <p className='text-red-500 text-xs mt-1'>{errors.patientNotes}</p>}
        </div>

        <div className='mt-5 text-gray-600'>
          <p>{service.description}</p>
          <p className='text-primary font-semibold mt-2'>{currencySymbol}{service.cost}</p>
        </div>

        <button disabled={availableSlots.length === 0} className='mt-6 bg-primary text-white px-10 py-3 rounded-full hover:shadow-lg disabled:opacity-50 transition-all'>Book Service</button>
      </div>
      <div className='bg-[#EAEFFF] rounded-lg overflow-hidden min-h-[320px] lg:min-h-[520px] flex items-end justify-center border'>
        <img src={assets.appointment_img} alt='Hospital patient care' className='w-full h-full object-cover object-center' />
      </div>
      </div>
    </form>
  )
}

export default ServiceBooking
