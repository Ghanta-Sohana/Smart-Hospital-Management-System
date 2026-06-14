import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Login = () => {
    const navigate = useNavigate()
    const { backendUrl, setToken } = useContext(AppContext)
    const [mode, setMode] = useState('login')
    const [form, setForm] = useState({
        email: '',
        password: '',
        newPassword: '',
        confirmPassword: ''
    })

    const onChangeHandler = (event) => {
        const { name, value } = event.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleLogin = async () => {
        const { data } = await axios.post(backendUrl + '/api/user/login', {
            email: form.email,
            password: form.password
        })

        if (data.success) {
            localStorage.setItem('token', data.token)
            setToken(data.token)
            toast.success('Logged in successfully')
            navigate('/')
        } else {
            toast.error(data.message)
        }
    }

    const handleForgotPassword = async () => {
        const { data } = await axios.post(backendUrl + '/api/user/forgot-password', {
            email: form.email,
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword
        })

        if (data.success) {
            toast.success(data.message)
            setMode('login')
            setForm(prev => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }))
        } else {
            toast.error(data.message)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        try {
            if (mode === 'login') {
                await handleLogin()
            } else {
                await handleForgotPassword()
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className='min-h-[80vh] flex items-center justify-center py-10'>
            <form onSubmit={handleSubmit} className='w-full max-w-md bg-white border border-gray-100 shadow-xl rounded-2xl p-8 text-zinc-600'>
                <div className='text-center mb-7'>
                    <p className='text-3xl font-semibold text-gray-800'>{mode === 'login' ? 'Patient Login' : 'Reset Password'}</p>
                    <p className='text-sm text-gray-500 mt-2'>{mode === 'login' ? 'Access your hospital appointments and services.' : 'Enter your registered email and set a new password.'}</p>
                </div>

                <div className='grid gap-4 text-sm'>
                    <div>
                        <p className='font-medium mb-1'>Email</p>
                        <input className='border border-zinc-300 rounded-lg w-full p-3 outline-none focus:border-primary' type='email' name='email' value={form.email} onChange={onChangeHandler} placeholder='Enter registered email address' required />
                    </div>

                    {mode === 'login' ? (
                        <div>
                            <p className='font-medium mb-1'>Password</p>
                            <input className='border border-zinc-300 rounded-lg w-full p-3 outline-none focus:border-primary' type='password' name='password' value={form.password} onChange={onChangeHandler} placeholder='Enter your password' required />
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className='font-medium mb-1'>New Password</p>
                                <input className='border border-zinc-300 rounded-lg w-full p-3 outline-none focus:border-primary' type='password' name='newPassword' value={form.newPassword} onChange={onChangeHandler} placeholder='Enter new password' required />
                            </div>
                            <div>
                                <p className='font-medium mb-1'>Confirm Password</p>
                                <input className='border border-zinc-300 rounded-lg w-full p-3 outline-none focus:border-primary' type='password' name='confirmPassword' value={form.confirmPassword} onChange={onChangeHandler} placeholder='Confirm new password' required />
                            </div>
                        </>
                    )}
                </div>

                {mode === 'login' && (
                    <button type='button' onClick={() => setMode('forgot')} className='text-primary text-sm mt-3 hover:underline'>
                        Forgot Password?
                    </button>
                )}

                <button type='submit' className='bg-primary text-white w-full py-3 rounded-lg text-base mt-6 hover:shadow-lg transition-all'>
                    {mode === 'login' ? 'Login' : 'Reset Password'}
                </button>

                {mode === 'login' ? (
                    <p className='text-center text-sm mt-5'>
                        Create a new account?
                        <span onClick={() => navigate('/register')} className='text-primary underline cursor-pointer ml-1'>Click here</span>
                    </p>
                ) : (
                    <p className='text-center text-sm mt-5'>
                        Remember password?
                        <span onClick={() => setMode('login')} className='text-primary underline cursor-pointer ml-1'>Back to login</span>
                    </p>
                )}
            </form>
        </div>
    )
}

export default Login
