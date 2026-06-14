import express from 'express';
import {
    loginUser,
    registerUser,
    forgotPassword,
    getProfile,
    updateProfile,
    updateMedicalHistory,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    cancelReminder,
    listServices,
    bookService,
    listUserServiceBookings,
    cancelServiceBooking,
    payServiceCash,
    paymentServiceRazorpay,
    verifyServiceRazorpay,
    paymentServiceStripe,
    verifyServiceStripe,
    listUserPrescriptions,
    submitContact,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
} from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import { medicalHistoryUpload } from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
const userRouter = express.Router();
const uploadMedicalHistoryFiles = (req, res, next) => {
    medicalHistoryUpload.fields([{ name: 'medicalFiles', maxCount: 10 }, { name: 'medicalPdf', maxCount: 1 }])(req, res, (error) => {
        if (error) {
            return res.json({ success: false, message: error.message });
        }
        if (req.userId) {
            req.body.userId = req.userId;
        }
        next();
    });
};

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/forgot-password", forgotPassword)
userRouter.post("/contact", submitContact)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/medical-history", authUser, uploadMedicalHistoryFiles, updateMedicalHistory)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.post("/cancel-reminder", authUser, cancelReminder)
userRouter.get("/services", listServices)
userRouter.post("/book-service", authUser, bookService)
userRouter.get("/service-bookings", authUser, listUserServiceBookings)
userRouter.post("/cancel-service-booking", authUser, cancelServiceBooking)
userRouter.post("/pay-service-cash", authUser, payServiceCash)
userRouter.post("/payment-service-razorpay", authUser, paymentServiceRazorpay)
userRouter.post("/verifyServiceRazorpay", authUser, verifyServiceRazorpay)
userRouter.post("/payment-service-stripe", authUser, paymentServiceStripe)
userRouter.post("/verifyServiceStripe", authUser, verifyServiceStripe)
userRouter.get("/prescriptions", authUser, listUserPrescriptions)
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)

export default userRouter;
