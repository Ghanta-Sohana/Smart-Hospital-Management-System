import mongoose from "mongoose";

const serviceBookingSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    serviceId: { type: String, required: true },
    serviceData: { type: Object, required: true },
    userData: { type: Object, required: true },
    patientName: { type: String, default: "" },
    patientAge: { type: Number, default: null },
    patientGender: { type: String, default: "" },
    patientDob: { type: String, default: "" },
    patientPhone: { type: String, default: "" },
    patientNotes: { type: String, default: "" },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Pending", "Completed", "Cancelled"], default: "Pending" },
    paymentMethod: { type: String, enum: ["", "Cash", "Online"], default: "" },
    paymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    date: { type: Number, required: true }
}, { minimize: false });

serviceBookingSchema.index({ serviceId: 1, slotDate: 1, slotTime: 1, cancelled: 1 });

const serviceBookingModel = mongoose.models.serviceBooking || mongoose.model("serviceBooking", serviceBookingSchema);
export default serviceBookingModel;
