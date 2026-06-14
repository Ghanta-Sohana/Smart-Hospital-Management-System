import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Register = () => {

    const navigate = useNavigate()

    const { backendUrl, setToken } = useContext(AppContext)

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: ''
    })

    const onChangeHandler = (event) => {

        const name = event.target.name
        const value = event.target.value

        setForm(form => ({ ...form, [name]: value }))
    }

    const handleSubmit = async (event) => {

        event.preventDefault()

        try {

            const { data } = await axios.post(
                backendUrl + '/api/user/register',
                {
                    name: form.name,
                    email: form.email,
                    password: form.password
                }
            )

            if (data.success) {

                localStorage.setItem('token', data.token)

                setToken(data.token)

                toast.success("Patient account created successfully")

                navigate('/')

            }

            else {

                toast.error(data.message)

            }

        }

        catch (error) {

            toast.error(error.message)

        }
    }

    return (
        <form onSubmit={handleSubmit} className='min-h-[80vh] flex items-center justify-center py-10 px-4'>

            <div className='flex flex-col gap-4 w-full max-w-md items-start p-7 sm:p-9 border border-zinc-100 rounded-2xl text-zinc-600 text-sm bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)] transition-all duration-300'>

                <div className='w-full text-center mb-2'>
                    <p className='text-2xl sm:text-3xl font-semibold text-gray-800'>Create Account</p>
                </div>

                <div className='w-full'>

                    <p className='font-medium text-gray-700'>Full Name</p>

                    <input
                        className='border border-zinc-200 rounded-lg w-full px-4 py-3 mt-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300 bg-white'
                        type='text'
                        name='name'
                        value={form.name}
                        onChange={onChangeHandler}
                        placeholder='Enter patient full name'
                        required
                    />

                </div>

                <div className='w-full'>

                    <p className='font-medium text-gray-700'>Email</p>

                    <input
                        className='border border-zinc-200 rounded-lg w-full px-4 py-3 mt-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300 bg-white'
                        type='email'
                        name='email'
                        value={form.email}
                        onChange={onChangeHandler}
                        placeholder='Enter email address'
                        required
                    />

                </div>

                <div className='w-full'>

                    <p className='font-medium text-gray-700'>Password</p>

                    <input
                        className='border border-zinc-200 rounded-lg w-full px-4 py-3 mt-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300 bg-white'
                        type='password'
                        name='password'
                        value={form.password}
                        onChange={onChangeHandler}
                        placeholder='Enter strong password'
                        required
                    />

                </div>

                <button
                    type='submit'
                    className='bg-primary text-white w-full py-3 rounded-full text-base font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300'
                >
                    Create Account
                </button>

                <p className='w-full text-center text-gray-600'>
                    Already have an account?
                    <span
                        onClick={() => navigate('/login')}
                        className='text-primary underline cursor-pointer ml-1 font-medium hover:text-primary/80 transition-colors'
                    >
                        Login
                    </span>
                </p>

            </div>

        </form>
    )
}

export default Register