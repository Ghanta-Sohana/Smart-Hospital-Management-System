import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const { token, userData, logoutUser } = useContext(AppContext)

  const logout = () => {
    logoutUser()
    navigate('/login', { replace: true })
  }

  const navLinkClass = ({ isActive }) => `relative px-1 py-2 text-gray-700 transition-all duration-300 hover:text-primary hover:scale-[1.03] after:absolute after:left-1/2 after:bottom-0 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:after:w-full ${isActive ? 'text-primary after:w-full' : ''}`
  const mobileLinkClass = ({ isActive }) => `px-5 py-2 rounded-full inline-block transition-all duration-300 ${isActive ? 'text-white bg-primary' : 'text-gray-700 hover:text-primary hover:bg-primary/5'}`

  return (
    <header className='w-full border-b border-gray-300 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)] '>
    <div className='container-fluid w-full px-2 sm:px-8 lg:px-[8%] flex items-center justify-between text-sm py-4 mb-4'>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer transition-transform duration-300 hover:scale-[1.02]' src="https://tse2.mm.bing.net/th/id/OIP.mqn9s6I4dsMnxcJTvQ47UgHaDn?rs=1&pid=ImgDetMain&o=7&rm=3" alt="" />
      <ul className='md:flex items-center gap-6 font-medium hidden'>
        <NavLink to='/' className={navLinkClass}>
          <li>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>  
        <NavLink to='/doctors' className={navLinkClass}>
          <li>ALL DOCTORS</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/services' className={navLinkClass}>
          <li>SERVICES</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' className={navLinkClass}>
          <li>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' className={navLinkClass}>
          <li>CONTACT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4 '>
        {
          token && userData
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-8 rounded-full' src={userData.image} alt="" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
              <div className='min-w-48 bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col gap-3 p-4'>
                  <p onClick={() => navigate('/my-profile')} className='hover:text-primary cursor-pointer transition-colors'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:text-primary cursor-pointer transition-colors'>My Appointments</p>
                  <p onClick={() => navigate('/my-service-bookings')} className='hover:text-primary cursor-pointer transition-colors'>My Service Bookings</p>
                  <p onClick={() => navigate('/prescriptions')} className='hover:text-primary cursor-pointer transition-colors'>Prescriptions</p>
                  <p onClick={logout} className='hover:text-primary cursor-pointer transition-colors'>Logout</p>
                </div>
              </div>
            </div>
            : <div className='hidden md:flex items-center gap-3'>
              <button onClick={() => navigate('/login')} className='border border-primary text-primary px-6 py-3 rounded-full font-medium hover:bg-primary hover:text-white hover:-translate-y-0.5 transition-all duration-300'>Login</button>
              <button onClick={() => navigate('/register')} className='bg-primary text-white px-6 py-3 rounded-full font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300'>Create account</button>
            </div>
        }
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.logo} className='w-36' alt="" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/' className={mobileLinkClass}><p>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors' className={mobileLinkClass}><p>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/services' className={mobileLinkClass}><p>SERVICES</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about' className={mobileLinkClass}><p>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact' className={mobileLinkClass}><p>CONTACT</p></NavLink>
          </ul>
        </div>
      </div>
    </div>
    </header>
  )
}

export default Navbar
