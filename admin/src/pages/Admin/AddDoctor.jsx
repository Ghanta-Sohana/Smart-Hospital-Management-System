import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const initialForm = {
    name: '',
    email: '',
    password: '',
    experience: '1 Year',
    fees: '',
    about: '',
    speciality: 'General physician',
    degree: '',
    address1: '',
    address2: ''
}

const AddDoctor = () => {
    const [docImg, setDocImg] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [errors, setErrors] = useState({})

    const { backendUrl } = useContext(AppContext)
    const { aToken } = useContext(AdminContext)

    const validateField = (name, value) => {
        if (!String(value).trim()) return 'Required'
        if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email'
        if (name === 'password' && value.length < 8) return 'Password must be at least 8 characters'
        if (name === 'fees' && Number(value) < 0) return 'Fees cannot be negative'
        return ''
    }

    const handleChange = (event) => {
        const { name, value } = event.target
        if (name === 'fees' && Number(value) < 0) return
        setForm(prev => ({ ...prev, [name]: value }))
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {
            if (!docImg) return toast.error('Image Not Selected')

            const formData = new FormData()
            formData.append('image', docImg)
            formData.append('name', form.name)
            formData.append('email', form.email)
            formData.append('password', form.password)
            formData.append('experience', form.experience)
            formData.append('fees', Number(form.fees))
            formData.append('about', form.about)
            formData.append('speciality', form.speciality)
            formData.append('degree', form.degree)
            formData.append('address', JSON.stringify({ line1: form.address1, line2: form.address2 }))

            const { data } = await axios.post(backendUrl + '/api/admin/add-doctor', formData, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                setDocImg(false)
                setForm(initialForm)
                setErrors({})
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fieldClass = 'border rounded px-3 py-2 focus:outline-primary'

    return (
        <form onSubmit={onSubmitHandler} className='w-full max-w-[1280px] mx-auto'>
            <p className='mb-3 text-lg font-medium'>Add Doctor</p>

            <div className='bg-white px-5 sm:px-8 py-8 border rounded w-full max-h-[85vh] overflow-y-scroll shadow-sm'>
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor="doc-img">
                        <img className='w-16 bg-gray-100 rounded-full cursor-pointer hover:scale-105 transition-all' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id="doc-img" hidden required />
                    <p>Upload doctor <br /> picture</p>
                </div>

                <div className='grid lg:grid-cols-2 gap-6 text-gray-600'>
                    {[
                        ['name', 'Doctor Name', 'text', 'Enter doctor full name'],
                        ['email', 'Doctor Email', 'email', 'Enter doctor email address'],
                        ['password', 'Set Password', 'password', 'Enter secure password'],
                        ['degree', 'Degree', 'text', 'Enter medical degree'],
                        ['address1', 'Address 1', 'text', 'Enter clinic address line 1'],
                        ['address2', 'Address 2', 'text', 'Enter clinic address line 2']
                    ].map(([name, label, type, placeholder]) => (
                        <div key={name} className='flex flex-col gap-1'>
                            <p>{label}</p>
                            <input name={name} onChange={handleChange} value={form[name]} className={fieldClass} type={type} placeholder={placeholder} required />
                            {errors[name] && <p className='text-red-500 text-xs'>{errors[name]}</p>}
                        </div>
                    ))}

                    <div className='flex flex-col gap-1'>
                        <p>Experience</p>
                        <select name='experience' onChange={handleChange} value={form.experience} className='border rounded px-2 py-2' required>
                            {['1 Year', '2 Year', '3 Year', '4 Year', '5 Year', '6 Year', '8 Year', '9 Year', '10 Year'].map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>

                    <div className='flex flex-col gap-1'>
                        <p>Fees</p>
                        <div className='flex items-center border rounded overflow-hidden'>
                            <span className='px-3 text-gray-500'>₹</span>
                            <input name='fees' min='0' onChange={handleChange} value={form.fees} className='flex-1 px-3 py-2 outline-none' type="number" placeholder='Doctor fees' required />
                        </div>
                        {errors.fees && <p className='text-red-500 text-xs'>{errors.fees}</p>}
                    </div>

                    <div className='flex flex-col gap-1'>
                        <p>Speciality</p>
                        <select name='speciality' onChange={handleChange} value={form.speciality} className='border rounded px-2 py-2' required>
                            {['General physician', 'Gynecologist', 'Dermatologist', 'Pediatricians', 'Neurologist', 'Gastroenterologist', 'Emergency Department'].map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <p className='mt-4 mb-2'>About Doctor</p>
                    <textarea name='about' onChange={handleChange} value={form.about} className='w-full px-4 pt-2 border rounded focus:outline-primary' rows={5} placeholder='Write about doctor' required />
                    {errors.about && <p className='text-red-500 text-xs'>{errors.about}</p>}
                </div>

                <button disabled={Object.values(errors).some(Boolean)} type='submit' className='bg-primary px-10 py-3 mt-4 text-white rounded-full hover:shadow-lg disabled:opacity-50 transition-all'>Add doctor</button>
            </div>
        </form>
    )
}

export default AddDoctor
