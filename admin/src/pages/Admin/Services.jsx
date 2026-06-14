import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const initialForm = { name: '', description: '', cost: '', availability: true, date: '', timeSlots: '' }

const Services = () => {
  const { aToken, services, getServices, deleteService } = useContext(AdminContext)
  const { backendUrl, currency } = useContext(AppContext)
  const [form, setForm] = useState(initialForm)
  const [serviceImage, setServiceImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [errors, setErrors] = useState({})

  const validateField = (name, value) => {
    if (name !== 'availability' && !String(value).trim()) return 'Required'
    if (name === 'cost' && Number(value) < 0) return 'Cost cannot be negative'
    return ''
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    if (name === 'cost' && Number(value) < 0) return
    const nextValue = type === 'checkbox' ? checked : value
    setForm(prev => ({ ...prev, [name]: nextValue }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, nextValue) }))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    setServiceImage(file || null)
    setImagePreview(file ? URL.createObjectURL(file) : '')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('cost', form.cost)
      formData.append('availability', form.availability)
      formData.append('date', form.date)
      formData.append('timeSlots', form.timeSlots)
      if (serviceImage) formData.append('serviceImage', serviceImage)

      const { data } = await axios.post(backendUrl + '/api/admin/add-service', formData, { headers: { aToken } })

      if (data.success) {
        toast.success(data.message)
        setForm(initialForm)
        setServiceImage(null)
        setImagePreview('')
        setErrors({})
        getServices()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (aToken) getServices()
  }, [aToken])

  return (
    <div className='w-full max-w-[1280px] mx-auto grid xl:grid-cols-[0.9fr_1.1fr] gap-6 items-stretch'>
      <form onSubmit={handleSubmit} className='bg-white border rounded p-6 h-full min-h-[680px] shadow-sm'>
        <p className='text-lg font-medium mb-4'>Add Service</p>
        <div className='grid sm:grid-cols-2 gap-4'>
          <div>
            <p>Service Name</p>
            <input name='name' value={form.name} onChange={handleChange} placeholder='Enter service name' className='w-full border rounded p-2' required />
            {errors.name && <p className='text-red-500 text-xs'>{errors.name}</p>}
          </div>
          <div>
            <p>Cost</p>
            <div className='flex border rounded overflow-hidden'>
              <span className='px-3 py-2 text-gray-500'>₹</span>
              <input name='cost' min='0' value={form.cost} onChange={handleChange} type='number' placeholder='Enter service cost' className='w-full p-2 outline-none' required />
            </div>
            {errors.cost && <p className='text-red-500 text-xs'>{errors.cost}</p>}
          </div>
          <div>
            <p>Date</p>
            <input name='date' value={form.date} onChange={handleChange} type='date' className='w-full border rounded p-2' required />
          </div>
          <div>
            <p>Time Slots</p>
            <input name='timeSlots' value={form.timeSlots} onChange={handleChange} placeholder='10:00 AM, 10:30 AM' className='w-full border rounded p-2' required />
          </div>
        </div>
        <div className='mt-4'>
          <p>Description</p>
          <textarea name='description' value={form.description} onChange={handleChange} rows={4} placeholder='Enter service description' className='w-full border rounded p-2' required />
        </div>
        <div className='mt-4'>
          <p>Service Image</p>
          <input type='file' accept='image/*' onChange={handleImageChange} className='w-full border rounded p-2' />
          {imagePreview && <img src={imagePreview} alt='Service preview' className='mt-3 w-full h-40 object-cover rounded border' />}
        </div>
        <label className='mt-4 flex gap-2 items-center'>
          <input type='checkbox' name='availability' checked={form.availability} onChange={handleChange} />
          <span>Available</span>
        </label>
        <button disabled={Object.values(errors).some(Boolean)} className='mt-5 bg-primary text-white px-8 py-3 rounded-full hover:shadow-lg disabled:opacity-50 transition-all'>Add Service</button>
      </form>

      <div className='bg-white border rounded p-6 h-full min-h-[680px] max-h-[85vh] overflow-hidden shadow-sm flex flex-col'>
        <p className='text-lg font-medium mb-4'>Services List</p>
        <div className='grid gap-4 overflow-y-auto pr-1'>
          {services.map(service => (
            <div key={service._id} className='border rounded p-4 hover:shadow-md transition-all'>
              {service.image && <img src={service.image} alt={service.name} className='w-full h-32 object-cover rounded border mb-3' />}
              <div className='flex justify-between gap-4 flex-wrap'>
                <div>
                  <p className='font-semibold text-gray-800'>{service.name}</p>
                  <p className='text-sm text-gray-500'>{service.date}</p>
                </div>
                <p className='font-semibold'>{currency}{service.cost}</p>
              </div>
              <p className='text-sm text-gray-600 mt-2'>{service.description}</p>
              <p className='text-sm mt-2'>Slots: {service.timeSlots.join(', ')}</p>
              <button onClick={() => deleteService(service._id)} className='mt-3 border border-red-500 text-red-500 px-4 py-1 rounded-full hover:bg-red-600 hover:text-white transition-all'>Delete</button>
            </div>
          ))}
          {services.length === 0 && <p className='text-gray-500'>No services added.</p>}
        </div>
      </div>
    </div>
  )
}

export default Services
