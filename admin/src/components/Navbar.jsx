import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {

  const { dToken, setDToken } = useContext(DoctorContext)
  const { aToken, setAToken } = useContext(AdminContext)

  const navigate = useNavigate()

  const logout = () => {
    localStorage.clear()
    sessionStorage.clear()
    dToken && setDToken('')
    aToken && setAToken('')
    navigate('/login', { replace: true })
  }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
      <div className='flex items-center gap-2 text-xs'>
        <img onClick={() => navigate('/login')} className='w-36 sm:w-40 cursor-pointer' src="https://tse2.mm.bing.net/th/id/OIP.mqn9s6I4dsMnxcJTvQ47UgHaDn?rs=1&pid=ImgDetMain&o=7&rm=3" alt="" />
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>{aToken ? 'Admin' : 'Doctor'}</p>
      </div>
      <div className='flex items-center gap-3'>
        {aToken && (
          <div className='hidden sm:flex items-center gap-2'>
            <button
              onClick={() => navigate('/emergency-cases')}
              className='border border-red-500 text-red-600 text-sm px-4 py-2 rounded-full hover:bg-red-600 hover:text-white transition-all'
            >
              Emergency
            </button>
          </div>
        )}
        <button onClick={() => logout()} className='bg-primary text-white text-sm px-6 sm:px-10 py-2 rounded-full'>Logout</button>
      </div>
    </div>
  )
}

export default Navbar
