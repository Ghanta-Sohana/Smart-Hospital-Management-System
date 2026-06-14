import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    doctorName: { type: String, required: true },
    patientName: { type: String, required: true },
    diagnosis: { type: String, required: true, trim: true },
    medicines: { type: String, required: true, trim: true },
    advice: { type: String, default: "", trim: true },
    createdAt: { type: Number, default: Date.now }
}, { minimize: false });

const prescriptionModel = mongoose.models.prescription || mongoose.model("prescription", prescriptionSchema);
export default prescriptionModel;
