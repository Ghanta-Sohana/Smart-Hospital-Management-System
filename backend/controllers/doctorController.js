import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import serviceBookingModel from "../models/serviceBookingModel.js";

const releaseDoctorSlot = async (docId, slotDate, slotTime) => {
    if (!docId) return;
    const doctorData = await doctorModel.findById(docId);
    if (!doctorData) return;

    const slots_booked = doctorData.slots_booked || {};
    if (slots_booked[slotDate]) {
        slots_booked[slotDate] = slots_booked[slotDate].filter((slot) => slot !== slotTime);
    }

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
};

const getServiceBookingStatus = (booking) => {
    if (booking.cancelled || booking.status === "Cancelled") return "Cancelled";
    if (booking.status === "Completed") return "Completed";
    return "Pending";
};

const mergeCurrentPatientHistory = async (appointments) => {
    const userIds = [...new Set(appointments.map((appointment) => appointment.userId).filter((userId) => mongoose.Types.ObjectId.isValid(userId)))];
    const users = await userModel.find({ _id: { $in: userIds } }).select("-password");
    const userMap = users.reduce((acc, user) => {
        acc[user._id.toString()] = user.toObject();
        return acc;
    }, {});

    return appointments.map((appointment) => {
        const appObj = appointment.toObject();
        appObj.userData = {
            ...appObj.userData,
            medicalHistory: userMap[appObj.userId]?.medicalHistory || appObj.userData?.medicalHistory
        };
        return appObj;
    });
};

// API for doctor Login
const loginDoctor = async (req, res) => {
    try {
        const { doctorId, email, password } = req.body;

        if (!doctorId || !email || !password) {
            return res.json({ success: false, message: "Doctor ID, email and password are required" });
        }

        const user = await doctorModel.findOne({ doctorId: String(doctorId).trim().toUpperCase(), email });

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
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

// API for doctor forgot password
const forgotDoctorPassword = async (req, res) => {
    try {
        const { doctorId, email, newPassword, confirmPassword } = req.body;

        if (!doctorId || !email || !newPassword || !confirmPassword) {
            return res.json({ success: false, message: "All password fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.json({ success: false, message: "Passwords do not match" });
        }

        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const doctor = await doctorModel.findOne({ doctorId: String(doctorId).trim().toUpperCase() });
        if (!doctor) {
            return res.json({ success: false, message: "Doctor ID does not exist" });
        }

        if (doctor.email !== email) {
            return res.json({ success: false, message: "Email does not match doctor ID" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await doctorModel.findByIdAndUpdate(doctor._id, { password: hashedPassword });

        res.json({ success: true, message: "Password Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });
        const enrichedAppointments = await mergeCurrentPatientHistory(appointments);
        res.json({ success: true, appointments: enrichedAppointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const appointmentDoctorDetails = async (req, res) => {
    try {
        const { docId } = req.body;
        const { appointmentId } = req.params;
        const appointment = await appointmentModel.findById(appointmentId);

        if (!appointment || appointment.docId !== docId) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        const [appointmentData] = await mergeCurrentPatientHistory([appointment]);
        res.json({ success: true, appointment: appointmentData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, status: "Cancelled" });
            await releaseDoctorSlot(docId, appointmentData.slotDate, appointmentData.slotTime);
            return res.json({ success: true, message: "Appointment Cancelled" });
        }

        res.json({ success: false, message: "Appointment not found" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true, status: "Completed" });
            return res.json({ success: true, message: "Appointment Completed" });
        }

        res.json({ success: false, message: "Appointment not found" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(["-password", "-email"]);
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
        res.json({ success: true, message: "Availablity Changed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get doctor profile for Doctor Panel
const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        const profileData = await doctorModel.findById(docId).select("-password");
        res.json({ success: true, profileData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update doctor profile data from Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, address, about, available } = req.body;
        const imageFile = req.file;
        const restrictedFields = ["name", "email", "phone", "speciality", "degree", "experience", "fees", "doctorId", "role", "password"];
        const attemptedRestrictedField = restrictedFields.find((field) => Object.prototype.hasOwnProperty.call(req.body, field));

        if (attemptedRestrictedField || imageFile) {
            return res.json({ success: false, message: "Only address, availability and about doctor can be updated" });
        }

        if (!address || !about) {
            return res.json({ success: false, message: "Address and about doctor are required" });
        }

        const updateData = {
            address: typeof address === "string" ? JSON.parse(address) : address,
            about,
            available: available === "true" || available === true
        };

        await doctorModel.findByIdAndUpdate(docId, updateData);
        res.json({ success: true, message: "Profile Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listDoctorEmergencyCases = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId, isEmergency: true }).sort({ date: -1 });
        const enrichedAppointments = await mergeCurrentPatientHistory(appointments);
        res.json({ success: true, emergencyCases: enrichedAppointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listDoctorServiceBookings = async (req, res) => {
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

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;

        const appointments = await appointmentModel.find({ docId });

        let earnings = 0;
        appointments.forEach((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }
        });

        const patients = [];
        appointments.forEach((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId);
            }
        });

        const enrichedAppointments = await mergeCurrentPatientHistory(appointments);
        const emergencyPatients = enrichedAppointments.filter((item) => item.isEmergency && !item.cancelled);

        const dashData = {
            earnings,
            appointments: appointments.length,
            emergencyPatients: emergencyPatients.length,
            patients: patients.length,
            emergencyList: emergencyPatients.reverse(),
            latestAppointments: enrichedAppointments.reverse()
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for doctor prescriptions
const addPrescription = async (req, res) => {
    try {
        const { docId, appointmentId, diagnosis, medicines, advice } = req.body;

        if (!appointmentId || !diagnosis || !medicines) {
            return res.json({ success: false, message: "Diagnosis and medicines are required" });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData || appointmentData.docId !== docId) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        const prescription = new prescriptionModel({
            appointmentId,
            userId: appointmentData.userId,
            docId,
            doctorName: appointmentData.docData.name,
            patientName: appointmentData.userData.name,
            diagnosis,
            medicines,
            advice: advice || ""
        });

        await prescription.save();
        res.json({ success: true, message: "Prescription Saved" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listDoctorPrescriptions = async (req, res) => {
    try {
        const { docId } = req.body;
        const prescriptions = await prescriptionModel.find({ docId }).sort({ createdAt: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
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
};
