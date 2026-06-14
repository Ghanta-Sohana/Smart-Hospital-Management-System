import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Banner = () => {

    const navigate = useNavigate()

    return (
        
        <div className='w-screen flex bg-primary rounded-lg  px-6 sm:px-10 md:px-14 lg:px-12 my-20 overflow'>

            {/* ------- Left Side ------- */}
            <div className='flex-1 py-8 sm:py-10 md:py-16 lg:py-24 lg:pl-5 '>
                <div className='text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-white'>
                    <p>Book Appointment</p>
                    <p className='mt-4'>With 100+ Trusted Doctors</p>
                </div>
                <div className='flex gap-4 mt-6'>
                <button onClick={() => { navigate('/register'); scrollTo(0, 0) }} className='bg-white text-sm sm:text-base text-[#595959] px-8 py-3 feft-10 rounded-full mt-6 hover:scale-105 transition-all'>Create account</button>
                <button onClick={() => { navigate('/services'); scrollTo(0, 0) }} className='bg-white text-sm sm:text-base text-[#595959] px-8 py-3 feft-10 rounded-full mt-6 hover:scale-105 transition-all '>Book Services</button>
                </div>
            </div>

            {/* ------- Right Side ------- */}
            <div className='hidden md:block md:w-1/2 relative'>
                <img className='w-full max-w-md translate-x-[100px]' src={assets.appointment_img} alt="" />
            </div>
        </div>
    )
}

export default Banner
