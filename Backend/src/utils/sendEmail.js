import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        console.log("Attempting to send email to:", to);
        console.log("Using email user:", process.env.EMAIL_USER);

        const info = await transporter.sendMail({
            from: `"Temple Fund System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: text,
        });

        console.log("Email sent successfully:", info.response);
        return info;
    } catch (error) {
        console.error("Error sending email:", error.message);
        console.error("Full error:", error);
        throw new Error("Failed to send email: " + error.message);
    }
};

export { sendEmail };