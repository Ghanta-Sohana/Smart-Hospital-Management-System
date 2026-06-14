import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className='w-full bg-primary-100 mt-14 border-t border-gray-200 shadow-[0_-8px_30px_rgba(15,23,42,0.04)]'>
      <div className='container-fluid w-full px-4 sm:px-8 lg:px-[4%]'>
      <div className='flex flex-col sm:grid grid-cols-[2fr_1fr_1.3fr] gap-8 py-10 text-sm'>
        <div>
          <img className='mb-5 w-40' src="https://tse2.mm.bing.net/th/id/OIP.mqn9s6I4dsMnxcJTvQ47UgHaDn?rs=1&pid=ImgDetMain&o=7&rm=3" alt="CareSync" />
          <p className='text-xl font-semibold text-gray-800'>CareSync Hospital</p>
          <p className='w-full md:w-2/3 text-gray-600 leading-6 mt-3'>
            Smart hospital management for appointments, services, medical history and prescriptions.
          </p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>NAVIGATION</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li><Link className='hover:text-primary hover:translate-x-1 inline-block transition-all duration-300' to='/'>Home</Link></li>
            <li><Link className='hover:text-primary hover:translate-x-1 inline-block transition-all duration-300' to='/about'>About Us</Link></li>
            <li><Link className='hover:text-primary hover:translate-x-1 inline-block transition-all duration-300' to='/contact'>Contact Us</Link></li>
            <li><Link className='hover:text-primary hover:translate-x-1 inline-block transition-all duration-300' to='/doctors'>Book Appointment</Link></li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>CareSync Hospital, 24 Health Avenue, Bengaluru, India</li>
            <li>Email: support@caresync.in</li>
            <li>Phone: +91 98765 43210</li>
          </ul>
        </div>
      </div>

      <div>
        <hr className='border-gray-200' />
        <p className='py-5 text-sm text-center'>Copyright 2026 @ CareSync Hospital - All Rights Reserved.</p>
      </div>
      </div>
    </footer>
  )
}

export default Footer
