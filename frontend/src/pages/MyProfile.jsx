import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {
    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const [medicalFiles, setMedicalFiles] = useState([])
    const [errors, setErrors] = useState({})

    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

    const validateField = (name, value) => {
        if ((name === 'name' || name === 'phone') && !String(value).trim()) return 'Required'
        if (name === 'phone' && !/^[6-9]\d{9}$/.test(value)) return 'Enter a valid mobile number'
        if (name === 'manual' && value.length > 2000) return 'Medical history must be under 2000 characters'
        return ''
    }

    const getUploadedFiles = () => {
        const history = userData?.medicalHistory || {}
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

    const formatUploadedAt = (uploadedAt) => {
        if (!uploadedAt) return '-'
        return new Date(uploadedAt).toLocaleDateString()
    }

    const handleChange = (field, value) => {
        setUserData(prev => {
            if (field === 'line1' || field === 'line2') {
                return { ...prev, address: { ...prev.address, [field]: value } }
            }
            if (field === 'manual') {
                return { ...prev, medicalHistory: { ...(prev.medicalHistory || {}), manual: value } }
            }
            return { ...prev, [field]: value }
        })
        setErrors(prev => ({ ...prev, [field]: validateField(field, value) }))
    }

    const updateUserProfileData = async () => {
        try {
            const formData = new FormData()
            formData.append('name', userData.name)
            formData.append('phone', userData.phone)
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)
            image && formData.append('image', image)

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const updateMedicalHistory = async () => {
        try {
            const formData = new FormData()
            formData.append('manual', userData.medicalHistory?.manual || '')
            medicalFiles.forEach((file) => formData.append('medicalFiles', file))

            const { data } = await axios.post(backendUrl + '/api/user/medical-history', formData, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                setMedicalFiles([])
                loadUserProfileData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    return userData ? (
        <div className='w-full grid lg:grid-cols-[0.9fr_1.1fr] gap-8 text-sm pt-5 pb-16'>
            <div className='flex flex-col gap-2'>
                {isEdit
                    ? <label htmlFor='image'>
                        <div className='inline-block relative cursor-pointer'>
                            <img className='w-36 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
                            <img className='w-10 absolute bottom-12 right-12' src={image ? '' : assets.upload_icon} alt="" />
                        </div>
                        <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                    </label>
                    : <img className='w-36 rounded' src={userData.image} alt="" />
                }

                {isEdit
                    ? <input className='bg-gray-50 text-3xl font-medium max-w-80 border rounded p-2' type="text" onChange={(e) => handleChange('name', e.target.value)} value={userData.name} />
                    : <p className='font-medium text-3xl text-[#262626] mt-4'>{userData.name}</p>
                }
                {errors.name && <p className='text-red-500 text-xs'>{errors.name}</p>}

                <hr className='bg-[#ADADAD] h-[1px] border-none' />

                <div>
                    <p className='text-gray-600 underline mt-3'>CONTACT INFORMATION</p>
                    <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-[#363636]'>
                        <p className='font-medium'>Email id:</p>
                        <p className='text-blue-500'>{userData.email}</p>
                        <p className='font-medium'>Phone:</p>
                        {isEdit
                            ? <input className='bg-gray-50 max-w-52 border rounded p-1' type="text" onChange={(e) => handleChange('phone', e.target.value)} value={userData.phone} />
                            : <p className='text-blue-500'>{userData.phone}</p>
                        }
                        <p className='font-medium'>Address:</p>
                        {isEdit
                            ? <p>
                                <input className='bg-gray-50 border rounded p-1 mb-1' type="text" onChange={(e) => handleChange('line1', e.target.value)} value={userData.address.line1} />
                                <br />
                                <input className='bg-gray-50 border rounded p-1' type="text" onChange={(e) => handleChange('line2', e.target.value)} value={userData.address.line2} />
                            </p>
                            : <p className='text-gray-500'>{userData.address.line1} <br /> {userData.address.line2}</p>
                        }
                    </div>
                </div>
                {errors.phone && <p className='text-red-500 text-xs'>{errors.phone}</p>}

                <div>
                    <p className='text-[#797979] underline mt-3'>BASIC INFORMATION</p>
                    <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-gray-600'>
                        <p className='font-medium'>Gender:</p>
                        {isEdit
                            ? <select className='max-w-32 bg-gray-50 border rounded p-1' onChange={(e) => handleChange('gender', e.target.value)} value={userData.gender} >
                                <option value="Not Selected">Not Selected</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            : <p className='text-gray-500'>{userData.gender}</p>
                        }
                        <p className='font-medium'>Birthday:</p>
                        {isEdit
                            ? <input className='max-w-40 bg-gray-50 border rounded p-1' type='date' onChange={(e) => handleChange('dob', e.target.value)} value={userData.dob} />
                            : <p className='text-gray-500'>{userData.dob}</p>
                        }
                    </div>
                </div>

                <div className='mt-8'>
                    {isEdit
                        ? <button disabled={Object.values(errors).some(Boolean)} onClick={updateUserProfileData} className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white disabled:opacity-50 transition-all'>Save information</button>
                        : <button onClick={() => setIsEdit(true)} className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Edit</button>
                    }
                </div>
            </div>

            <div className='border rounded-lg p-6 bg-white h-fit'>
                <p className='text-xl font-semibold text-gray-800'>Medical History</p>
                <p className='text-gray-500 mt-1'>Upload PDF reports and maintain manual history notes for doctors.</p>

                <div className='mt-5'>
                    <p className='font-medium mb-2'>Manual Medical History</p>
                    <textarea value={userData.medicalHistory?.manual || ''} onChange={(e) => handleChange('manual', e.target.value)} rows={8} className='w-full border rounded p-3 focus:outline-primary' placeholder='Allergies, chronic conditions, surgeries, current medicines...' />
                    {errors.manual && <p className='text-red-500 text-xs mt-1'>{errors.manual}</p>}
                </div>

                <div className='mt-5 flex flex-col gap-3'>
                    <label className='border border-dashed rounded p-4 cursor-pointer hover:border-primary transition-all'>
                        <span className='text-gray-700'>{medicalFiles.length ? `${medicalFiles.length} file(s) selected` : 'Upload Medical History Files'}</span>
                        <input type='file' multiple accept='.pdf,.doc,.docx,.txt,.csv,.rtf,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.bmp' onChange={(e) => setMedicalFiles(Array.from(e.target.files || []))} hidden />
                    </label>
                    {medicalFiles.length > 0 && (
                        <div className='grid gap-1 text-sm text-gray-600'>
                            {medicalFiles.map((file, index) => <p key={`${file.name}-${index}`}>{file.name}</p>)}
                        </div>
                    )}
                    <div className='mt-2'>
                        <p className='font-medium mb-2'>Uploaded Files</p>
                        {getUploadedFiles().length
                            ? <div className='grid gap-2'>
                                {getUploadedFiles().map((file, index) => (
                                    <div key={file._id || file.url || index} className='flex flex-wrap items-center justify-between gap-2 border rounded p-3 text-sm'>
                                        <div>
                                            <p className='text-gray-800 font-medium'>{file.name}</p>
                                            <p className='text-gray-500'>{file.type || 'Document'} | {formatUploadedAt(file.uploadedAt)}</p>
                                        </div>
                                        <a className='text-primary underline' href={file.url} target='_blank' rel='noreferrer'>Open</a>
                                    </div>
                                ))}
                            </div>
                            : <p className='text-sm text-gray-500'>No medical history files uploaded.</p>}
                    </div>
                </div>

                <button disabled={Object.values(errors).some(Boolean)} onClick={updateMedicalHistory} className='mt-5 bg-primary text-white px-8 py-3 rounded-full hover:shadow-lg disabled:opacity-50 transition-all'>Save Medical History</button>
            </div>
        </div>
    ) : null
}

export default MyProfile
