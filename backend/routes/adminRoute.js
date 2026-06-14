import express from 'express';
import {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    appointmentReschedule,
    addDoctor,
    editDoctor,
    deleteDoctor,
    allDoctors,
    adminDashboard,
    addService,
    deleteService,
    listServices,
    addEmergencyBooking,
    listEmergencyCases,
    listServiceBookings,
    updateServiceBookingStatus,
    listUsers
} from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.post("/edit-doctor", authAdmin, upload.single('image'), editDoctor)
adminRouter.post("/delete-doctor", authAdmin, deleteDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.post("/reschedule-appointment", authAdmin, appointmentReschedule)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)
adminRouter.post("/add-service", authAdmin, upload.single('serviceImage'), addService)
adminRouter.post("/delete-service", authAdmin, deleteService)
adminRouter.get("/services", authAdmin, listServices)
adminRouter.get("/service-bookings", authAdmin, listServiceBookings)
adminRouter.post("/update-service-booking-status", authAdmin, updateServiceBookingStatus)
adminRouter.post("/add-emergency-booking", authAdmin, addEmergencyBooking)
adminRouter.get("/emergency-cases", authAdmin, listEmergencyCases)
adminRouter.get("/users", authAdmin, listUsers)

export default adminRouter;
