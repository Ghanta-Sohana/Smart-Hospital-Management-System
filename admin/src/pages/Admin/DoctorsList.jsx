import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const DoctorsList = () => {
  const { doctors, changeAvailability, aToken, getAllDoctors, deleteDoctor } = useContext(AdminContext)
  const { backendUrl } = useContext(AppContext)
  const [editingDoctor, setEditingDoctor] = useState(null)

  const openEdit = (doctor) => {
    setEditingDoctor({
      ...doctor,
      address1: doctor.address?.line1 || '',
      address2: doctor.address?.line2 || '',
      imageFile: false
    })
  }

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target
    if (name === 'fees' && Number(value) < 0) return
    setEditingDoctor(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }))
  }

  const submitEdit = async (event) => {
    event.preventDefault()
    const formData = new FormData()
    formData.append('docId', editingDoctor._id)
    formData.append('name', editingDoctor.name)
    formData.append('email', editingDoctor.email)
    formData.append('speciality', editingDoctor.speciality)
    formData.append('degree', editingDoctor.degree)
    formData.append('experience', editingDoctor.experience)
    formData.append('about', editingDoctor.about)
    formData.append('fees', Number(editingDoctor.fees))
    formData.append('available', editingDoctor.available)
    formData.append('address', JSON.stringify({ line1: editingDoctor.address1, line2: editingDoctor.address2 }))
    editingDoctor.imageFile && formData.append('image', editingDoctor.imageFile)

    try {
      const { data } = await axios.post(backendUrl + '/api/admin/edit-doctor', formData, { headers: { aToken } })
      if (data.success) {
        toast.success(data.message)
        setEditingDoctor(null)
        getAllDoctors()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }
  }, [aToken])

  return (
    <div className='m-5 w-full max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Doctors</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {doctors.map((item, index) => (
          <div className='border border-[#C9D8FF] rounded-xl max-w-60 overflow-hidden group bg-white hover:shadow-lg transition-all' key={index}>
            <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
            <div className='p-4'>
              <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-sm'>Doctor ID: {item.doctorId || 'Not assigned'}</p>
              <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
              <div className='mt-2 flex items-center gap-1 text-sm'>
                <input onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} readOnly />
                <p>Available</p>
              </div>
              <div className='flex gap-2 mt-4'>
                <button onClick={() => openEdit(item)} className='border border-primary text-primary px-4 py-1 rounded-full hover:bg-primary hover:text-white transition-all'>Edit</button>
                <button onClick={() => deleteDoctor(item._id)} className='border border-red-500 text-red-500 px-4 py-1 rounded-full hover:bg-red-600 hover:text-white transition-all'>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingDoctor && (
        <form onSubmit={submitEdit} className='fixed inset-0 bg-black/30 z-30 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-scroll'>
            <div className='flex justify-between items-center mb-4'>
              <p className='text-xl font-semibold'>Edit Doctor</p>
              <button type='button' onClick={() => setEditingDoctor(null)} className='text-gray-500 hover:text-black'>Close</button>
            </div>
            <div className='grid sm:grid-cols-2 gap-4'>
              {['name', 'email', 'degree', 'experience', 'speciality', 'fees', 'address1', 'address2'].map(field => (
                <div key={field}>
                  <p className='capitalize mb-1'>{field}</p>
                  <input name={field} type={field === 'fees' ? 'number' : 'text'} min={field === 'fees' ? '0' : undefined} value={editingDoctor[field]} onChange={handleChange} placeholder={`Enter ${field}`} className='w-full border rounded p-2' required />
                </div>
              ))}
            </div>
            <div className='mt-4'>
              <p className='mb-1'>About</p>
              <textarea name='about' value={editingDoctor.about} onChange={handleChange} className='w-full border rounded p-2' rows={5} required />
            </div>
            <div className='mt-4 flex gap-4 items-center'>
              <input type='checkbox' name='available' checked={editingDoctor.available} onChange={handleChange} />
              <p>Available</p>
            </div>
            <button className='mt-5 bg-primary text-white px-8 py-2 rounded-full hover:shadow-lg transition-all'>Save Doctor</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default DoctorsList
