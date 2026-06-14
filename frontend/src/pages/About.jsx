import React, { useState } from 'react'
import { assets } from '../assets/assets'

const faqs = [
  { question: 'How does CareSync help patients?', answer: 'CareSync connects patients with doctors, service booking, medical history and prescriptions in one responsive hospital system.' },
  { question: 'Can doctors view patient records?', answer: 'Doctors can view manual medical history and uploaded PDF reports for the patients assigned to their appointments.' },
  { question: 'Can patients book hospital services?', answer: 'Yes. Patients can book available services, choose a payment method, and track the booking status from their account.' }
]

const About = () => {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className='py-10'>
      <div className='text-center text-2xl text-[#707070] animate-fade-up'>
        <p>ABOUT <span className='text-gray-700 font-semibold'>CARESYNC</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-28 items-center'>
        <img className='w-full md:max-w-[460px] rounded-lg hover:scale-[1.02] transition-all' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-lg text-gray-600'>
          <p>CareSync is a smart hospital management platform built to simplify patient care, appointment scheduling, service booking and clinical follow-up.</p>
          <p>Our system keeps hospital teams aligned across doctors, patients, services, prescriptions and medical history so care decisions can happen faster.</p>
          <b className='text-gray-800'>Our Vision</b>
          <p>To create a seamless digital healthcare experience where every patient can access timely care and every care team has the information they need.</p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>OUR <span className='text-gray-700 font-semibold'>ACHIEVEMENTS</span></p>
      </div>

      <div className='grid md:grid-cols-3 mb-14'>
        {['Trusted doctor access', 'Unified patient records', 'Integrated service booking'].map(item => (
          <div key={item} className='border px-10 md:px-16 py-8 sm:py-14 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
            <b>{item.toUpperCase()}</b>
            <p>Designed for reliable hospital operations and smooth patient experiences across devices.</p>
          </div>
        ))}
      </div>

      <div className='mb-20'>
        <p className='text-2xl mb-4'>FAQ</p>
        <div className='border rounded-lg overflow-hidden'>
          {faqs.map((faq, index) => (
            <div key={faq.question} className='border-b last:border-b-0'>
              <button onClick={() => setOpenIndex(openIndex === index ? -1 : index)} className='w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-all'>
                <span className='font-medium text-gray-800'>{faq.question}</span>
                <span className='text-primary text-xl'>{openIndex === index ? '^' : 'v'}</span>
              </button>
              {openIndex === index && <p className='px-5 pb-5 text-sm text-gray-600'>{faq.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default About
