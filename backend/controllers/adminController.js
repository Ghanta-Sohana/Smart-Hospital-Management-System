import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import serviceModel from "../models/serviceModel.js";
import serviceBookingModel from "../models/serviceBookingModel.js";

const isPositiveAmount = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;
const isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(String(mobile || ""));
const isNonNegativeAge = (age) => Number.isFinite(Number(age)) && Number(age) >= 0;
const DOCTOR_ID_RETRY_LIMIT = 8;
const SERVICE_BOOKING_STATUSES = ["Pending", "Completed", "Cancelled"];

const getDoctorIdPrefix = (speciality) => {
    const prefix = String(speciality || "").trim().replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
    return prefix.padEnd(3, "X");
};

const generateDoctorId = async (speciality) => {
    const prefix = getDoctorIdPrefix(speciality);
    const [latestDoctor] = await doctorModel.aggregate([
        {
            $match: {
                speciality,
                doctorId: { $regex: `^${prefix}\\d+$` }
            }
        },
        {
            $project: {
                sequence: { $toInt: { $substr: ["$doctorId", 3, -1] } }
            }
        },
        { $sort: { sequence: -1 } },
        { $limit: 1 }
    ]);

    const nextSequence = (latestDoctor?.sequence || 0) + 1;
    return `${prefix}${String(nextSequence).padStart(2, "0")}`;
};

const saveDoctorWithGeneratedId = async (doctorData) => {
    let lastError;

    for (let attempt = 0; attempt < DOCTOR_ID_RETRY_LIMIT; attempt += 1) {
        const newDoctor = new doctorModel({
            ...doctorData,
            doctorId: await generateDoctorId(doctorData.speciality)
        });

        try {
            return await newDoctor.save();
        } catch (error) {
            if (error.code === 11000 && error.keyPattern?.doctorId) {
                lastError = error;
                continue;
            }
            throw error;
        }
    }

    throw lastError || new Error("Unable to generate doctor ID");
};

const ensureExistingDoctorIds = async () => {
    const doctorsWithoutIds = await doctorModel.find({
        $or: [
            { doctorId: { $exists: false } },
            { doctorId: "" },
            { doctorId: null }
        ]
    }).sort({ date: 1 });

    for (const doctor of doctorsWithoutIds) {
        for (let attempt = 0; attempt < DOCTOR_ID_RETRY_LIMIT; attempt += 1) {
            doctor.doctorId = await generateDoctorId(doctor.speciality);
            try {
                await doctor.save({ validateBeforeSave: false });
                break;
            } catch (error) {
                if (error.code === 11000 && error.keyPattern?.doctorId) continue;
                throw error;
            }
        }
    }
};

const normalizeTimeSlots = (timeSlots) => {
    if (Array.isArray(timeSlots)) return timeSlots.map(slot => String(slot).trim()).filter(Boolean);
    return String(timeSlots || "").split(",").map(slot => slot.trim()).filter(Boolean);
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

const isValidAppointmentDateTime = (slotDate, slotTime) => {
    const date = getAppointmentDateTime(slotDate, slotTime);
    return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now();
};

const releaseDoctorSlot = async (docId, slotDate, slotTime) => {
    const doctorData = await doctorModel.findById(docId);
    if (!doctorData) return;

    const slots_booked = doctorData.slots_booked || {};
    if (slots_booked[slotDate]) {
        slots_booked[slotDate] = slots_booked[slotDate].filter((slot) => slot !== slotTime);
    }
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
};

const reserveDoctorSlot = async (docId, slotDate, slotTime) => {
    const doctorData = await doctorModel.findById(docId).select("-password");

    if (!doctorData || !doctorData.available) {
        return { success: false, message: "Doctor Not Available" };
    }

    const slots_booked = doctorData.slots_booked || {};
    if (slots_booked[slotDate]?.includes(slotTime)) {
        return { success: false, message: "Slot Not Available" };
    }

    slots_booked[slotDate] = slots_booked[slotDate] || [];
    slots_booked[slotDate].push(slotTime);
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    return { success: true, doctorData };
};

const getAppointmentStatus = (appointment) => {
    if (appointment.cancelled || appointment.status === "Cancelled") return "Cancelled";
    if (appointment.isCompleted || appointment.status === "Completed") return "Completed";
    return "Pending";
};

const getServiceBookingStatus = (booking) => {
    if (booking.cancelled || booking.status === "Cancelled") return "Cancelled";
    if (booking.status === "Completed") return "Completed";
    return "Pending";
};

const mergeCurrentAppointmentUsers = async (appointments) => {
    const userIds = [...new Set(
        appointments
            .map((appointment) => appointment.userId)
            .filter((userId) => /^[a-f\d]{24}$/i.test(String(userId || "")))
    )];

    const users = await userModel.find({ _id: { $in: userIds } }).select("-password");
    const userMap = users.reduce((acc, user) => {
        acc[user._id.toString()] = user.toObject();
        return acc;
    }, {});

    return appointments.map((appointment) => {
        const appObj = appointment.toObject ? appointment.toObject() : appointment;
        const currentUser = userMap[appObj.userId];

        return {
            ...appObj,
            status: getAppointmentStatus(appObj),
            userData: currentUser ? { ...appObj.userData, ...currentUser } : appObj.userData
        };
    });
};

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            return res.json({ success: true, token });
        }

        res.json({ success: false, message: "Invalid credentials" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({});
        const enrichedAppointments = await mergeCurrentAppointmentUsers(appointments);
        res.json({ success: true, appointments: enrichedAppointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, status: "Cancelled" });
        await releaseDoctorSlot(appointmentData.docId, appointmentData.slotDate, appointmentData.slotTime);

        res.json({ success: true, message: "Appointment Cancelled" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for appointment reschedule
const appointmentReschedule = async (req, res) => {
    try {
        const { appointmentId, slotDate, slotTime } = req.body;

        if (!appointmentId || !slotDate || !slotTime) {
            return res.json({ success: false, message: "Missing reschedule details" });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData || appointmentData.cancelled || appointmentData.isCompleted) {
            return res.json({ success: false, message: "Appointment cannot be rescheduled" });
        }

        if (appointmentData.slotDate === slotDate && appointmentData.slotTime === slotTime) {
            return res.json({ success: false, message: "Select a different slot" });
        }

        const slotResult = await reserveDoctorSlot(appointmentData.docId, slotDate, slotTime);
        if (!slotResult.success) {
            return res.json({ success: false, message: slotResult.message });
        }

        await releaseDoctorSlot(appointmentData.docId, appointmentData.slotDate, appointmentData.slotTime);
        await appointmentModel.findByIdAndUpdate(appointmentId, { slotDate, slotTime });

        res.json({ success: true, message: "Appointment Rescheduled" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for adding Doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address || !imageFile) {
            return res.json({ success: false, message: "Missing Details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        if (!isPositiveAmount(fees)) {
            return res.json({ success: false, message: "Fees cannot be negative" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees: Number(fees),
            address: JSON.parse(address),
            date: Date.now()
        };

        await saveDoctorWithGeneratedId(doctorData);
        res.json({ success: true, message: "Doctor Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for editing Doctor
const editDoctor = async (req, res) => {
    try {
        const { docId, name, email, speciality, degree, experience, about, fees, address, available } = req.body;
        const imageFile = req.file;

        if (!docId || !name || !email || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (!isPositiveAmount(fees)) {
            return res.json({ success: false, message: "Fees cannot be negative" });
        }

        const doctorUpdate = {
            name,
            email,
            speciality,
            degree,
            experience,
            about,
            fees: Number(fees),
            address: JSON.parse(address),
            available: available === "true" || available === true
        };

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            doctorUpdate.image = imageUpload.secure_url;
        }

        await doctorModel.findByIdAndUpdate(docId, doctorUpdate);
        res.json({ success: true, message: "Doctor Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for deleting Doctor
const deleteDoctor = async (req, res) => {
    try {
        const { docId } = req.body;

        if (!docId) {
            return res.json({ success: false, message: "Doctor id is required" });
        }

        const activeAppointment = await appointmentModel.findOne({ docId, cancelled: false, isCompleted: false });
        if (activeAppointment) {
            return res.json({ success: false, message: "Doctor has active appointments" });
        }

        await doctorModel.findByIdAndDelete(docId);
        res.json({ success: true, message: "Doctor Deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {
        await ensureExistingDoctorIds();
        const doctors = await doctorModel.find({}).select("-password");
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({});
        const users = await userModel.find({});
        const appointments = await appointmentModel.find({});
        const services = await serviceModel.find({});
        const serviceBookings = await serviceBookingModel.find({});

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            emergencyAppointments: appointments.filter((item) => item.isEmergency).length,
            services: services.length,
            serviceBookings: serviceBookings.length,
            patients: users.length,
            latestAppointments: appointments.reverse()
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to add Services
const addService = async (req, res) => {
    try {
        const { name, description, cost, availability, date, timeSlots } = req.body;
        const imageFile = req.file;
        const slots = normalizeTimeSlots(timeSlots);

        if (!name || !description || !cost || !date || slots.length === 0) {
            return res.json({ success: false, message: "Missing service details" });
        }

        if (!isPositiveAmount(cost)) {
            return res.json({ success: false, message: "Cost cannot be negative" });
        }

        let image = "";
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            image = imageUpload.secure_url;
        }

        const service = new serviceModel({
            name,
            description,
            cost: Number(cost),
            image,
            availability: availability === "false" ? false : Boolean(availability ?? true),
            date,
            timeSlots: slots
        });

        await service.save();
        res.json({ success: true, message: "Service Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to delete Services
const deleteService = async (req, res) => {
    try {
        const { serviceId } = req.body;

        if (!serviceId) {
            return res.json({ success: false, message: "Service id is required" });
        }

        const activeBooking = await serviceBookingModel.findOne({ serviceId, cancelled: false });
        if (activeBooking) {
            return res.json({ success: false, message: "Service has active bookings" });
        }

        await serviceModel.findByIdAndDelete(serviceId);
        res.json({ success: true, message: "Service Deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to view Services List
const listServices = async (req, res) => {
    try {
        const services = await serviceModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, services });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for admin-created emergency booking
const addEmergencyBooking = async (req, res) => {
    try {
        const { patientName, age, dob, gender, mobile, address, doctorName, slotDate, slotTime, emergencyNotes } = req.body;

        if (!patientName || !age?.toString() || !gender || !mobile || !address || !slotDate || !slotTime || !emergencyNotes) {
            return res.json({ success: false, message: "Missing emergency booking details" });
        }

        if (!isNonNegativeAge(age)) {
            return res.json({ success: false, message: "Age cannot be negative" });
        }

        if (!isValidMobile(mobile)) {
            return res.json({ success: false, message: "Please enter a valid mobile number" });
        }

        if (!isValidAppointmentDateTime(slotDate, slotTime)) {
            return res.json({ success: false, message: "Emergency date and time cannot be in the past" });
        }

        if (String(emergencyNotes).trim().length < 10) {
            return res.json({ success: false, message: "Describe the emergency in at least 10 characters" });
        }

        let doctorData = null;
        let docData = {};

        if (String(doctorName || "").trim()) {
            doctorData = await doctorModel.findOne({
                name: { $regex: `^${String(doctorName).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
                available: true
            }).select("-password");

            if (!doctorData) {
                return res.json({ success: false, message: "Available doctor not found" });
            }

            const slotResult = await reserveDoctorSlot(doctorData._id.toString(), slotDate, slotTime);
            if (!slotResult.success) {
                return res.json({ success: false, message: slotResult.message });
            }

            docData = slotResult.doctorData.toObject();
            delete docData.slots_booked;
        }

        const userData = {
            name: patientName,
            phone: mobile,
            dob: dob || "Not Selected",
            gender,
            address: { line1: address || "", line2: "" },
            image: "",
            medicalHistory: { manual: "", pdfUrl: "", pdfName: "", updatedAt: 0 }
        };

        const appointmentData = {
            userId: "",
            docId: doctorData ? doctorData._id.toString() : "",
            userData,
            docData,
            amount: docData.fees || 0,
            slotTime,
            slotDate,
            isEmergency: true,
            emergencyNotes,
            patientName,
            patientMobile: mobile,
            patientAddress: address || "",
            patientAge: Number(age),
            patientGender: gender,
            patientDob: dob || "",
            doctorName: docData.name || "",
            status: "Pending",
            date: Date.now()
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        res.json({ success: true, message: "Emergency Booking Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listEmergencyCases = async (req, res) => {
    try {
        const emergencyCases = await appointmentModel.find({ isEmergency: true }).sort({ date: -1 });
        res.json({ success: true, emergencyCases });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listServiceBookings = async (req, res) => {
    try {
        const serviceBookings = await serviceBookingModel.find({}).sort({ date: -1 });
        res.json({
            success: true,
            serviceBookings: serviceBookings.map((booking) => ({
                ...(booking.toObject ? booking.toObject() : booking),
                status: getServiceBookingStatus(booking),
                paymentMethod: booking.paymentMethod || "",
                paymentStatus: booking.paymentStatus || (booking.payment ? "Paid" : "Pending")
            }))
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updateServiceBookingStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body;

        if (!bookingId || !status) {
            return res.json({ success: false, message: "Booking id and status are required" });
        }

        if (!SERVICE_BOOKING_STATUSES.includes(status)) {
            return res.json({ success: false, message: "Invalid booking status" });
        }

        const booking = await serviceBookingModel.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: "Service booking not found" });
        }

        if (getServiceBookingStatus(booking) !== "Pending") {
            return res.json({ success: false, message: "Only pending service bookings can be updated" });
        }

        await serviceBookingModel.findByIdAndUpdate(bookingId, {
            status,
            cancelled: status === "Cancelled"
        });

        res.json({ success: true, message: `Service Booking ${status}` });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listUsers = async (req, res) => {
    try {
        const users = await userModel.find({}).select("-password");
        res.json({ success: true, users });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
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
};
