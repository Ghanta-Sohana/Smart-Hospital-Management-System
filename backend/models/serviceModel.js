import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    availability: { type: Boolean, default: true },
    date: { type: String, required: true },
    timeSlots: { type: [String], required: true, default: [] },
    createdAt: { type: Number, default: Date.now }
}, { minimize: false });

const serviceModel = mongoose.models.service || mongoose.model("service", serviceSchema);
export default serviceModel;
