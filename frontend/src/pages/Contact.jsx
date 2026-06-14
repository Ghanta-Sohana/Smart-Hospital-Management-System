import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const initialForm = { name: '', mobile: '', email: '', address: '', message: '' }

const Contact = () => {
  const { backendUrl } = useContext(AppContext)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const validateField = (name, value) => {
    if (!value.trim()) return 'Required'
    if (name === 'mobile' && !/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10 digit mobile number'
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email'
    if (name === 'message' && value.trim().length < 10) return 'Message must be at least 10 characters'
    return ''
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const { data } = await axios.post(backendUrl + '/api/user/contact', form)
      if (data.success) {
        toast.success(data.message)
        setForm(initialForm)
        setErrors({})
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className='py-10'>
      <div className='text-center text-2xl text-[#707070]'>
        <p>CONTACT <span className='text-gray-700 font-semibold'>US</span></p>
      </div>

      <div className='my-10 grid lg:grid-cols-[0.9fr_1.1fr] gap-5 mb-2 text-base items-start'>
        <div className='flex flex-col gap-5'>
          <img className='w-full max-w-[440px] rounded-lg' src={assets.contact_image} alt="" />
          <div className='grid sm:grid-cols-2 gap-4 text-gray-600'>
            <p><span className='font-semibold text-gray-800'>Address:</span><br />CareSync Hospital, 24 Health Avenue, Bengaluru, India</p>
            <p><span className='font-semibold text-gray-800'>Email:</span><br />support@caresync.in</p>
            <p><span className='font-semibold text-gray-800'>Phone:</span><br />+91 98765 43210</p>
            <p><span className='font-semibold text-gray-800'>Fax:</span><br />+91 80 4567 8910</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='border rounded-lg p-6 shadow-sm bg-white'>
          <p className='text-xl font-semibold text-gray-800 mb-5'>Send Query</p>
          <div className='grid sm:grid-cols-2 gap-4'>
            {['name', 'mobile', 'email', 'address'].map(field => (
              <div key={field}>
                <p className='capitalize mb-1'>{field === 'mobile' ? 'Mobile Number' : field}</p>
                <input name={field} value={form[field]} onChange={handleChange} className='w-full border rounded p-3 focus:outline-primary' required />
                {errors[field] && <p className='text-red-500 text-xs mt-1'>{errors[field]}</p>}
              </div>
            ))}
          </div>
          <div className='mt-4'>
            <p className='mb-1'>Query Message</p>
            <textarea name='message' value={form.message} onChange={handleChange} rows={5} className='w-full border rounded p-3 focus:outline-primary' required />
            {errors.message && <p className='text-red-500 text-xs mt-1'>{errors.message}</p>}
          </div>
          <button disabled={Object.values(errors).some(Boolean)} className='mt-5 bg-primary text-white px-8 py-3 rounded-full hover:shadow-lg disabled:opacity-50 transition-all'>Submit</button>
        </form>
      </div>
    </div>
  )
}

export default Contact
