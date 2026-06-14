import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import fs from "fs/promises";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import serviceModel from "../models/serviceModel.js";
import serviceBookingModel from "../models/serviceBookingModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import contactModel from "../models/contactModel.js";
import { v2 as cloudinary } from "cloudinary";
import stripe from "stripe";
import razorpay from "razorpay";

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const isStrongPassword = (password) => typeof password === "string" && password.length >= 8;
const isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(String(mobile || ""));
const isValidServiceAge = (age) => age === undefined || age === "" || (Number.isFinite(Number(age)) && Number(age) >= 0);
const MAX_MEDICAL_HISTORY_LENGTH = 2000;

const removeLocalFile = async (filePath) => {
    if (!filePath) return;
    try {
        await fs.unlink(filePath);
    } catch {
        // Temp file may already be removed by the host or upload provider.
    }
};

const getMedicalHistoryFiles = (files) => {
    if (!files) return [];
    if (Array.isArray(files)) return files;
    return [
        ...(files.medicalFiles || []),
        ...(files.medicalPdf || [])
    ];
};

const getAppointmentDateTime = (slotDate, slotTime) => {
    const [day, month, year] = String(slotDate).split("_").map(Number);
    const [time, meridiem = ""] = String(slotTime).trim().split(" ");
    const [hourText, minuteText] = time.split(":");
    let hours = Number(hourText);
    const minutes = Number(minuteText);

    if (meridiem.toLowerCase() === "pm" && hours !== 12) hours += 12;
    if (meridiem.toLowerCase() === "am" && hours === 12) hours = 0;

    return new Date(year, month - 1, day, hours, minutes);
};

const getServiceSlotDateTime = (serviceDate, slotTime) => {
    const [year, month, day] = String(serviceDate).split("-").map(Number);
    const [time, meridiem = ""] = String(slotTime).trim().split(" ");
    const [hourText, minuteText] = String(time || "").split(":");
    let hours = Number(hourText);
    const minutes = Number(minuteText);

    if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
        return new Date("invalid");
    }

    if (meridiem.toLowerCase() === "pm" && hours !== 12) hours += 12;
    if (meridiem.toLowerCase() === "am" && hours === 12) hours = 0;

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const isServiceSlotAvailableForTime = (serviceDate, slotTime) => {
    const slotDateTime = getServiceSlotDateTime(serviceDate, slotTime);
    return !Number.isNaN(slotDateTime.getTime()) && slotDateTime.getTime() > Date.now();
};

const attachReminderMessage = (appointment) => {
    const appObj = appointment.toObject ? appointment.toObject() : appointment;
    appObj.status = appObj.cancelled ? "Cancelled" : appObj.isCompleted ? "Completed" : (appObj.status || "Pending");
    if (appObj.cancelled || appObj.isCompleted || appObj.reminderCancelled) return appObj;

    const appointmentTime = getAppointmentDateTime(appObj.slotDate, appObj.slotTime);
    const minutesLeft = Math.floor((appointmentTime.getTime() - Date.now()) / 60000);

    if (minutesLeft >= 0 && minutesLeft <= 30) {
        const doctorName = appObj.docData?.name || appObj.doctorName;
        appObj.reminderMessage = doctorName
            ? `Reminder: appointment at ${appObj.slotTime} with ${doctorName}`
            : `Reminder: emergency appointment at ${appObj.slotTime}`;
    }

    return appObj;
};

const attachServiceBookingStatus = (booking) => {
    const bookingObj = booking.toObject ? booking.toObject() : booking;
    return {
        ...bookingObj,
        status: bookingObj.cancelled ? "Cancelled" : bookingObj.status || "Pending",
        paymentMethod: bookingObj.paymentMethod || "",
        paymentStatus: bookingObj.paymentStatus || (bookingObj.payment ? "Paid" : "Pending")
    };
};

const reserveDoctorSlot = async (docId, slotDate, slotTime) => {
    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData || !docData.available) {
        return { success: false, message: "Doctor Not Available" };
    }

    const slots_booked = docData.slots_booked || {};
    if (slots_booked[slotDate]?.includes(slotTime)) {
        return { success: false, message: "Slot Not Available" };
    }

    slots_booked[slotDate] = slots_booked[slotDate] || [];
    slots_booked[slotDate].push(slotTime);

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    return { success: true, docData };
};

const createDoctorAppointment = async ({ userId, docId, slotDate, slotTime, isEmergency = false, emergencyNotes = "", bookingReason = "" }) => {
    if (!docId || !slotDate || !slotTime) {
        return { success: false, message: "Missing appointment details" };
    }

    const slotResult = await reserveDoctorSlot(docId, slotDate, slotTime);
    if (!slotResult.success) return slotResult;

    const userData = await userModel.findById(userId).select("-password");
    if (!userData) {
        return { success: false, message: "User not found" };
    }

    const docData = slotResult.docData.toObject();
    delete docData.slots_booked;

    const appointmentData = {
        userId,
        docId,
        userData,
        docData,
        amount: docData.fees,
        slotTime,
        slotDate,
        isEmergency,
        emergencyNotes,
        bookingReason,
        status: "Pending",
        date: Date.now()
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    return { success: true, message: isEmergency ? "Emergency Booking Added" : "Appointment Booked" };
};

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (!isStrongPassword(password)) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({ name, email, password: hashedPassword });
        const user = await newUser.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            return res.json({ success: true, token });
        }

        res.json({ success: false, message: "Invalid credentials" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to reset password
const forgotPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.json({ success: false, message: "All password fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.json({ success: false, message: "Passwords do not match" });
        }

        if (!isStrongPassword(newPassword)) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

        res.json({ success: true, message: "Password Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId).select("-password");
        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender });

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            const imageURL = imageUpload.secure_url;
            await userModel.findByIdAndUpdate(userId, { image: imageURL });
        }

        res.json({ success: true, message: "Profile Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update medical history
const updateMedicalHistory = async (req, res) => {
    const medicalFiles = getMedicalHistoryFiles(req.files);
    try {
        const { userId, manual } = req.body;

        if (manual && String(manual).length > MAX_MEDICAL_HISTORY_LENGTH) {
            await Promise.all(medicalFiles.map((file) => removeLocalFile(file.path)));
            return res.json({ success: false, message: "Medical history must be under 2000 characters" });
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            await Promise.all(medicalFiles.map((file) => removeLocalFile(file.path)));
            return res.json({ success: false, message: "User not found" });
        }

        const uploadedFiles = [];

        for (const file of medicalFiles) {
            try {
                const fileUpload = await cloudinary.uploader.upload(file.path, {
                    resource_type: "auto",
                    folder: "medical_history"
                });

                uploadedFiles.push({
                    url: fileUpload.secure_url,
                    publicId: fileUpload.public_id,
                    name: file.originalname,
                    type: file.mimetype,
                    size: file.size,
                    resourceType: fileUpload.resource_type || "raw",
                    uploadedAt: Date.now()
                });
            } finally {
                await removeLocalFile(file.path);
            }
        }

        const updateQuery = {
            $set: {
                "medicalHistory.manual": manual || "",
                "medicalHistory.updatedAt": Date.now()
            }
        };

        if (uploadedFiles.length) {
            updateQuery.$push = {
                "medicalHistory.files": { $each: uploadedFiles }
            };
            updateQuery.$set["medicalHistory.pdfUrl"] = uploadedFiles[0].url;
            updateQuery.$set["medicalHistory.pdfName"] = uploadedFiles[0].name;
        }

        const updatedUser = await userModel.findByIdAndUpdate(userId, updateQuery, { new: true }).select("medicalHistory");
        res.json({ success: true, message: "Medical History Updated", medicalHistory: updatedUser.medicalHistory });
    } catch (error) {
        await Promise.all(medicalFiles.map((file) => removeLocalFile(file.path)));
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to book appointment
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime, bookingReason } = req.body;

        if (!bookingReason || String(bookingReason).trim().length < 3) {
            return res.json({ success: false, message: "Reason for booking appointment is required" });
        }

        const result = await createDoctorAppointment({ userId, docId, slotDate, slotTime, bookingReason: String(bookingReason).trim() });
        res.json(result);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to book emergency appointment
const bookEmergencyAppointment = async (req, res) => {
    try {
        res.json({ success: false, message: "Emergency booking is restricted to admin users" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, status: "Cancelled" });

        const { docId, slotDate, slotTime } = appointmentData;
        if (docId) {
            const doctorData = await doctorModel.findById(docId);
            const slots_booked = doctorData?.slots_booked || {};

            if (slots_booked[slotDate]) {
                slots_booked[slotDate] = slots_booked[slotDate].filter((slot) => slot !== slotTime);
            }

            await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        }

        res.json({ success: true, message: "Appointment Cancelled" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const cancelReminder = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { reminderCancelled: true });
        res.json({ success: true, message: "Reminder Cancelled" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId });
        res.json({ success: true, appointments: appointments.map(attachReminderMessage) });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to list active services for users
const listServices = async (req, res) => {
    try {
        const services = await serviceModel.find({ availability: true }).sort({ createdAt: -1 });
        const serviceIds = services.map((service) => service._id.toString());
        const bookings = await serviceBookingModel.find({ serviceId: { $in: serviceIds }, cancelled: false });

        const servicesWithSlots = services.map((service) => {
            const bookedSlots = bookings
                .filter((booking) => booking.serviceId === service._id.toString())
                .map((booking) => booking.slotTime);

            return {
                ...service.toObject(),
                availableSlots: service.timeSlots.filter((slot) => !bookedSlots.includes(slot) && isServiceSlotAvailableForTime(service.date, slot))
            };
        });

        res.json({ success: true, services: servicesWithSlots });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to book service
const bookService = async (req, res) => {
    try {
        const { userId, serviceId, slotTime, patientName, patientAge, patientGender, patientDob, patientPhone, patientNotes } = req.body;

        if (!serviceId || !slotTime || !patientName || !patientAge?.toString() || !patientGender || !patientPhone) {
            return res.json({ success: false, message: "Missing service booking details" });
        }

        if (String(patientName).trim().length < 3) {
            return res.json({ success: false, message: "Enter a valid patient name" });
        }

        if (!isValidServiceAge(patientAge)) {
            return res.json({ success: false, message: "Age cannot be negative" });
        }

        if (Number(patientAge) > 120) {
            return res.json({ success: false, message: "Enter a valid age" });
        }

        if (!isValidMobile(patientPhone)) {
            return res.json({ success: false, message: "Please enter a valid mobile number" });
        }

        if (String(patientNotes || "").length > 500) {
            return res.json({ success: false, message: "Notes must be under 500 characters" });
        }

        const serviceData = await serviceModel.findById(serviceId);
        if (!serviceData || !serviceData.availability) {
            return res.json({ success: false, message: "Service Not Available" });
        }

        if (!serviceData.timeSlots.includes(slotTime)) {
            return res.json({ success: false, message: "Invalid service slot" });
        }

        if (!isServiceSlotAvailableForTime(serviceData.date, slotTime)) {
            return res.json({ success: false, message: "This service slot has expired" });
        }

        const existingBooking = await serviceBookingModel.findOne({
            serviceId,
            slotDate: serviceData.date,
            slotTime,
            cancelled: false
        });

        if (existingBooking) {
            return res.json({ success: false, message: "Slot Not Available" });
        }

        const userData = await userModel.findById(userId).select("-password");
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        const booking = new serviceBookingModel({
            userId,
            serviceId,
            serviceData,
            userData,
            patientName: String(patientName || userData.name || "").trim(),
            patientAge: patientAge === undefined || patientAge === "" ? null : Number(patientAge),
            patientGender: String(patientGender || userData.gender || "").trim(),
            patientDob: String(patientDob || "").trim(),
            patientPhone: String(patientPhone || "").trim(),
            patientNotes: String(patientNotes || "").trim(),
            slotDate: serviceData.date,
            slotTime,
            amount: serviceData.cost,
            status: "Pending",
            paymentStatus: "Pending",
            paymentMethod: "",
            date: Date.now()
        });

        await booking.save();
        res.json({ success: true, message: "Service Booked" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listUserServiceBookings = async (req, res) => {
    try {
        const { userId } = req.body;
        const serviceBookings = await serviceBookingModel.find({ userId }).sort({ date: -1 });
        res.json({
            success: true,
            serviceBookings: serviceBookings.map(attachServiceBookingStatus)
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const cancelServiceBooking = async (req, res) => {
    try {
        const { userId, bookingId } = req.body;
        const booking = await serviceBookingModel.findById(bookingId);

        if (!booking || booking.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        if (booking.cancelled) {
            return res.json({ success: false, message: "Service booking is already cancelled" });
        }

        await serviceBookingModel.findByIdAndUpdate(bookingId, { cancelled: true, status: "Cancelled" });
        res.json({ success: true, message: "Service Booking Cancelled" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const payServiceCash = async (req, res) => {
    try {
        const { userId, bookingId } = req.body;
        const booking = await serviceBookingModel.findById(bookingId);

        if (!booking || booking.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        if (booking.cancelled || booking.status === "Cancelled") {
            return res.json({ success: false, message: "Service booking is cancelled" });
        }

        if (booking.status === "Completed") {
            return res.json({ success: false, message: "Service booking is already completed" });
        }

        await serviceBookingModel.findByIdAndUpdate(bookingId, {
            payment: true,
            paymentMethod: "Cash",
            paymentStatus: "Paid"
        });

        res.json({ success: true, message: "Cash payment selected" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const paymentServiceRazorpay = async (req, res) => {
    try {
        const { userId, bookingId } = req.body;
        const booking = await serviceBookingModel.findById(bookingId);

        if (!booking || booking.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        if (booking.cancelled || booking.status === "Cancelled") {
            return res.json({ success: false, message: "Service booking is cancelled" });
        }

        const options = {
            amount: booking.amount * 100,
            currency: process.env.CURRENCY,
            receipt: bookingId,
        };

        const order = await razorpayInstance.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const verifyServiceRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === "paid") {
            await serviceBookingModel.findByIdAndUpdate(orderInfo.receipt, {
                payment: true,
                paymentMethod: "Online",
                paymentStatus: "Paid"
            });
            return res.json({ success: true, message: "Payment Successful" });
        }

        res.json({ success: false, message: "Payment Failed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const paymentServiceStripe = async (req, res) => {
    try {
        const { userId, bookingId } = req.body;
        const { origin } = req.headers;
        const booking = await serviceBookingModel.findById(bookingId);

        if (!booking || booking.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        if (booking.cancelled || booking.status === "Cancelled") {
            return res.json({ success: false, message: "Service booking is cancelled" });
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase();
        const serviceName = booking.serviceData?.name || "Hospital Service";

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: serviceName
                },
                unit_amount: booking.amount * 100
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&serviceBookingId=${booking._id}`,
            cancel_url: `${origin}/verify?success=false&serviceBookingId=${booking._id}`,
            line_items,
            mode: "payment",
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const verifyServiceStripe = async (req, res) => {
    try {
        const { serviceBookingId, success } = req.body;

        if (success === "true") {
            await serviceBookingModel.findByIdAndUpdate(serviceBookingId, {
                payment: true,
                paymentMethod: "Online",
                paymentStatus: "Paid"
            });
            return res.json({ success: true, message: "Payment Successful" });
        }

        res.json({ success: false, message: "Payment Failed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listUserPrescriptions = async (req, res) => {
    try {
        const { userId } = req.body;
        const prescriptions = await prescriptionModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const submitContact = async (req, res) => {
    try {
        const { name, mobile, email, address, message } = req.body;

        if (!name || !mobile || !email || !address || !message) {
            return res.json({ success: false, message: "All contact fields are required" });
        }

        if (!isValidMobile(mobile)) {
            return res.json({ success: false, message: "Please enter a valid mobile number" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        const contact = new contactModel({ name, mobile, email, address, message });
        await contact.save();

        res.json({ success: true, message: "Query Submitted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: "Appointment Cancelled or not found" });
        }

        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        };

        const order = await razorpayInstance.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === "paid") {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
            return res.json({ success: true, message: "Payment Successful" });
        }

        res.json({ success: false, message: "Payment Failed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const { origin } = req.headers;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: "Appointment Cancelled or not found" });
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase();

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items,
            mode: "payment",
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const verifyStripe = async (req, res) => {
    try {
        const { appointmentId, success } = req.body;

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
            return res.json({ success: true, message: "Payment Successful" });
        }

        res.json({ success: false, message: "Payment Failed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginUser,
    registerUser,
    forgotPassword,
    getProfile,
    updateProfile,
    updateMedicalHistory,
    bookAppointment,
    bookEmergencyAppointment,
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
};
