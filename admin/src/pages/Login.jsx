import axios from 'axios'
import React, { useContext, useState } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Login = () => {

    const navigate = useNavigate()

    const [state, setState] = useState('Admin')

    const [doctorId, setDoctorId] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showForgotPassword, setShowForgotPassword] = useState(false)

    const [forgotForm, setForgotForm] = useState({
        doctorId: '',
        email: '',
        newPassword: '',
        confirmPassword: ''
    })

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const { setDToken } = useContext(DoctorContext)
    const { setAToken } = useContext(AdminContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        if (state === 'Admin') {

            const { data } = await axios.post(
                backendUrl + '/api/admin/login',
                { email, password }
            )

            if (data.success) {
                setAToken(data.token)
                localStorage.setItem('aToken', data.token)

                toast.success('Login successful')

                navigate('/admin-dashboard')
            }
            else {
                toast.error(data.message)
            }

        }
        else {

            const { data } = await axios.post(
                backendUrl + '/api/doctor/login',
                { doctorId, email, password }
            )

            if (data.success) {
                setDToken(data.token)
                localStorage.setItem('dToken', data.token)

                toast.success('Login successful')

                navigate('/doctor-dashboard')
            }
            else {
                toast.error(data.message)
            }
        }
    }

    const onForgotSubmitHandler = async (event) => {
        event.preventDefault()

        if (forgotForm.newPassword !== forgotForm.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        try {

            const { data } = await axios.post(
                backendUrl + '/api/doctor/forgot-password',
                forgotForm
            )

            if (data.success) {
                toast.success(data.message)

                setForgotForm({
                    doctorId: '',
                    email: '',
                    newPassword: '',
                    confirmPassword: ''
                })

                setShowForgotPassword(false)
            }
            else {
                toast.error(data.message)
            }

        }
        catch (error) {
            toast.error(error.message)
        }
    }

    const changeLoginState = (nextState) => {
        setState(nextState)
        setShowForgotPassword(false)
        setDoctorId('')
        setEmail('')
        setPassword('')
    }

    const cardClass = 'flex flex-col gap-4 m-auto items-start p-7 sm:p-9 w-full max-w-md border border-gray-100 rounded-2xl text-[#5E5E5E] text-sm shadow-[0_18px_45px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)] bg-white transition-all duration-300'
    const inputClass = 'border border-[#DADADA] rounded-lg w-full px-4 py-3 mt-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300 bg-white'
    const labelClass = 'font-medium text-gray-700'
    const buttonClass = 'bg-primary text-white w-full py-3 rounded-full text-base font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300'

    if (state === 'Doctor' && showForgotPassword) {

        return (
            <form onSubmit={onForgotSubmitHandler} className='min-h-screen flex items-center bg-[#F8F9FD] px-4 py-10'>

                <div className={cardClass}>

                    <div className='w-full flex flex-col items-center gap-2 mb-3'>
                        <img className='w-44 transition-transform duration-300 hover:scale-[1.02]' src='https://tse2.mm.bing.net/th/id/OIP.mqn9s6I4dsMnxcJTvQ47UgHaDn?rs=1&pid=ImgDetMain&o=7&rm=3' alt='CareSync' />
                    </div>

                    <p className='text-2xl sm:text-3xl font-semibold m-auto text-gray-800'>
                        <span className='text-primary'>Doctor</span> Forgot Password
                    </p>

                    <div className='w-full'>
                        <p className={labelClass}>Doctor ID</p>
                        <input
                            onChange={(e) => setForgotForm(prev => ({ ...prev, doctorId: e.target.value.toUpperCase() }))}
                            value={forgotForm.doctorId}
                            className={inputClass}
                            type='text'
                            required
                        />
                    </div>

                    <div className='w-full'>
                        <p className={labelClass}>Doctor Email</p>
                        <input
                            onChange={(e) => setForgotForm(prev => ({ ...prev, email: e.target.value }))}
                            value={forgotForm.email}
                            className={inputClass}
                            type='email'
                            required
                        />
                    </div>

                    <div className='w-full'>
                        <p className={labelClass}>New Password</p>
                        <input
                            onChange={(e) => setForgotForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            value={forgotForm.newPassword}
                            className={inputClass}
                            type='password'
                            required
                        />
                    </div>

                    <div className='w-full'>
                        <p className={labelClass}>Confirm New Password</p>
                        <input
                            onChange={(e) => setForgotForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            value={forgotForm.confirmPassword}
                            className={inputClass}
                            type='password'
                            required
                        />
                    </div>

                    <button className={buttonClass}>
                        Update Password
                    </button>

                    <p className='w-full text-center text-gray-600'>
                        Back to Doctor Login?
                        <span
                            onClick={() => setShowForgotPassword(false)}
                            className='text-primary underline cursor-pointer ml-1 font-medium hover:text-primary/80 transition-colors'
                        >
                            Click here
                        </span>
                    </p>

                </div>

            </form>
        )
    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-screen flex items-center bg-[#F8F9FD] px-4 py-10'>

            <div className={cardClass}>

                <div className='w-full flex flex-col items-center gap-2 mb-3'>
                    <img className='w-44 transition-transform duration-300 hover:scale-[1.02]' src='https://tse2.mm.bing.net/th/id/OIP.mqn9s6I4dsMnxcJTvQ47UgHaDn?rs=1&pid=ImgDetMain&o=7&rm=3' alt='CareSync' />
                </div>

                <p className='text-2xl sm:text-3xl font-semibold m-auto text-gray-800'>
                    <span className='text-primary'>{state}</span> Login
                </p>

                {
                    state === 'Doctor' &&
                    <div className='w-full'>
                        <p className={labelClass}>Doctor ID</p>
                        <input
                            onChange={(e) => setDoctorId(e.target.value.toUpperCase())}
                            value={doctorId}
                            className={inputClass}
                            type='text'
                            required
                        />
                    </div>
                }

                <div className='w-full'>
                    <p className={labelClass}>{state === 'Doctor' ? 'Doctor Email' : 'Email'}</p>
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        className={inputClass}
                        type='email'
                        required
                    />
                </div>

                <div className='w-full'>
                    <p className={labelClass}>Password</p>
                    <input
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        className={inputClass}
                        type='password'
                        required
                    />
                </div>

                <button className={buttonClass}>
                    Login
                </button>

                {
                    state === 'Doctor' &&
                    <p className='w-full text-right'>
                        <span
                            onClick={() => setShowForgotPassword(true)}
                            className='text-primary underline cursor-pointer font-medium hover:text-primary/80 transition-colors'
                        >
                            Forgot Password?
                        </span>
                    </p>
                }

                <div>
                    {
                        state === 'Admin'
                            ? <p>Doctor Login? <span onClick={() => changeLoginState('Doctor')} className='text-primary underline cursor-pointer font-medium hover:text-primary/80 transition-colors'>Click here</span></p>
                            : <p>Admin Login? <span onClick={() => changeLoginState('Admin')} className='text-primary underline cursor-pointer font-medium hover:text-primary/80 transition-colors'>Click here</span></p>
                    }
                </div>

            </div>

        </form>
    )
}

export default Login
