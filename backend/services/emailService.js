import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = parseInt(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";

let transporter = null;

if (user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export const sendOtpEmail = async (email, otp) => {
  console.log(`[ConnectAlum Email Service] 🔑 6-Digit OTP for ${email}: [ ${otp} ] (Valid for 10 minutes)`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"ConnectAlum Security" <${user}>`,
        to: email,
        subject: "ConnectAlum Verification Code: " + otp,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb;">ConnectAlum Verification</h2>
            <p>Your one-time email verification code is:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1e293b; padding: 12px; background: #f8fafc; text-align: center; border-radius: 6px;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 13px; margin-top: 15px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      return true;
    } catch (err) {
      console.warn("Failed to dispatch SMTP email, using console OTP:", err.message);
      return false;
    }
  }
  return true;
};

export const sendEventReminderEmail = async (studentEmail, studentName, eventTitle, eventDate, meetingLink) => {
  console.log(`[ConnectAlum Email Service] 📅 Event Reminder sent to ${studentEmail} for "${eventTitle}"`);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"ConnectAlum Events" <${user}>`,
        to: studentEmail,
        subject: `Upcoming Event Reminder: ${eventTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #059669;">Event Reminder: ${eventTitle}</h2>
            <p>Hi ${studentName || "Scholar"},</p>
            <p>This is a friendly reminder that your registered alumni session <strong>${eventTitle}</strong> is scheduled soon!</p>
            <p><strong>Date & Time:</strong> ${eventDate}</p>
            ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
            <p style="color: #64748b; font-size: 13px;">See you there!</p>
          </div>
        `,
      });
      return true;
    } catch (err) {
      console.warn("SMTP reminder error:", err.message);
      return false;
    }
  }
  return true;
};
