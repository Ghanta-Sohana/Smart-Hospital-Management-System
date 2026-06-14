import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, default: "" },
    docId: { type: String, default: "" },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, default: {} },
    amount: { type: Number, default: 0 },
    date: { type: Number, required: true },
    isEmergency: { type: Boolean, default: false },
    emergencyNotes: { type: String, default: "" },
    bookingReason: { type: String, default: "" },
    patientName: { type: String, default: "" },
    patientMobile: { type: String, default: "" },
    patientAddress: { type: String, default: "" },
    patientAge: { type: Number, min: 0 },
    patientGender: { type: String, default: "" },
    patientDob: { type: String, default: "" },
    doctorName: { type: String, default: "" },
    reminderLog: { type: [String], default: [] },
    reminderCancelled: { type: Boolean, default: false },
    reminderLastSentAt: { type: Number, default: 0 },
    status: { type: String, enum: ["Pending", "Completed", "Cancelled"], default: "Pending" },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false }
}, { minimize: false })

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel
