import express from 'express';
import {
    loginDoctor,
    forgotDoctorPassword,
    appointmentsDoctor,
    appointmentDoctorDetails,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    listDoctorEmergencyCases,
    listDoctorServiceBookings,
    addPrescription,
    listDoctorPrescriptions
} from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
import upload from '../middleware/multer.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/forgot-password", forgotDoctorPassword)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/appointment/:appointmentId", authDoctor, appointmentDoctorDetails)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, upload.single('image'), updateDoctorProfile)
doctorRouter.get("/emergency-cases", authDoctor, listDoctorEmergencyCases)
doctorRouter.get("/service-bookings", authDoctor, listDoctorServiceBookings)
doctorRouter.post("/add-prescription", authDoctor, addPrescription)
doctorRouter.get("/prescriptions", authDoctor, listDoctorPrescriptions)

export default doctorRouter;
