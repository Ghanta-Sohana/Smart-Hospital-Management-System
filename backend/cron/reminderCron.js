import cron from "node-cron";
import appointmentModel from "../models/appointmentModel.js";

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

const startReminderScheduler = () => {
    cron.schedule("*/2 * * * *", async () => {
        try {
            const appointments = await appointmentModel.find({
                cancelled: false,
                isCompleted: false,
                reminderCancelled: false
            });

            const now = Date.now();

            for (const appointment of appointments) {
                const appointmentTime = getAppointmentDateTime(appointment.slotDate, appointment.slotTime).getTime();
                const minutesBeforeAppointment = Math.floor((appointmentTime - now) / 60000);

                if (minutesBeforeAppointment >= 0 && minutesBeforeAppointment <= 30) {
                    if (appointment.reminderLastSentAt && now - appointment.reminderLastSentAt < 110000) {
                        continue;
                    }

                    const reminderKey = `${appointment.slotDate}-${appointment.slotTime}-${Math.floor(now / 120000)}`;
                    if (!appointment.reminderLog.includes(reminderKey)) {
                        appointment.reminderLog.push(reminderKey);
                        appointment.reminderLastSentAt = now;
                        await appointment.save();

                        console.log(
                            `Reminder: ${appointment.userData?.name || appointment.patientName || "Patient"} has ${appointment.isEmergency ? "an emergency " : ""}appointment${appointment.docData?.name || appointment.doctorName ? ` with ${appointment.docData?.name || appointment.doctorName}` : ""} at ${appointment.slotTime}`
                        );
                    }
                }
            }
        } catch (error) {
            console.log("Reminder scheduler error:", error.message);
        }
    });
};

export default startReminderScheduler;
