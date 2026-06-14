import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const Services = () => {
  const { backendUrl, currencySymbol } = useContext(AppContext)
  const [services, setServices] = useState([])
  const [selectedSlots, setSelectedSlots] = useState({})
  const navigate = useNavigate()

  const getServices = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/services')
      if (data.success) {
        setServices(data.services)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleSlotChange = (serviceId, slot) => {
    setSelectedSlots(prev => ({ ...prev, [serviceId]: slot }))
  }

  const handleSubmit = (serviceId) => {
    const slot = selectedSlots[serviceId]
    navigate(`/service-booking/${serviceId}${slot ? `?slot=${encodeURIComponent(slot)}` : ''}`)
    scrollTo(0, 0)
  }

  useEffect(() => {
    getServices()
  }, [])

  return (
    <div className='min-h-[70vh] py-8'>
      <div className='mb-8'>
        <p className='text-3xl font-semibold text-gray-800'>CareSync Services</p>
        <p className='text-gray-600 mt-2'>Book diagnostics, procedures and care services from available hospital slots.</p>
      </div>

      <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
        {services.map(service => (
          <div onClick={() => { navigate(`/service-booking/${service._id}`); scrollTo(0, 0) }} key={service._id} className='border rounded-lg p-5 bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer'>
            {service.image && (
              <img
                src={service.image}
                alt={service.name}
                className='w-full h-44 object-cover rounded-md mb-4 border'
              />
            )}
            <div className='flex justify-between items-start gap-4'>
              <div>
                <h2 className='text-xl font-semibold text-gray-800'>{service.name}</h2>
                <p className='text-sm text-gray-500 mt-1'>{service.date}</p>
              </div>
              <p className='text-primary font-semibold'>{currencySymbol}{service.cost}</p>
            </div>
            <p className='text-gray-600 text-sm mt-4 min-h-16'>{service.description}</p>

            <div className='mt-5'>
              <p className='font-medium text-gray-700 mb-2'>Available Slots</p>
              <div className='flex flex-wrap gap-2'>
                {service.availableSlots.length > 0 ? service.availableSlots.map(slot => (
                  <button
                    type='button'
                    key={slot}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleSlotChange(service._id, slot)
                    }}
                    className={`px-4 py-2 rounded-full border text-sm transition-all ${selectedSlots[service._id] === slot ? 'bg-primary text-white border-primary' : 'text-gray-600 hover:border-primary hover:text-primary'}`}
                  >
                    {slot}
                  </button>
                )) : <p className='text-red-500 text-sm'>No slots available</p>}
              </div>
            </div>

            <button
              onClick={(event) => {
                event.stopPropagation()
                handleSubmit(service._id)
              }}
              disabled={!selectedSlots[service._id]}
              className='mt-6 w-full py-3 rounded-full bg-primary text-white hover:shadow-lg disabled:opacity-50 transition-all'
            >
              Book Service
            </button>
          </div>
        ))}
      </div>

      {services.length === 0 && <p className='text-center text-gray-500 py-16'>No services are available right now.</p>}
    </div>
  )
}

export default Services
