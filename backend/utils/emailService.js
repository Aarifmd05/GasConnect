import nodemailer from 'nodemailer';

const sendOtpEmail = async (
    email,
    otp,
    purpose = 'password-reset',
    role = ''
) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const isSignup = purpose === 'signup';

        const subject = isSignup
            ? 'GasConnect - Email Verification OTP'
            : 'GasConnect - Password Reset OTP';

        const heading = isSignup
            ? 'Verify Your Email Address'
            : 'Reset Your Password';

        const message = isSignup
            ? 'Use the following OTP to verify your email address and complete your GasConnect registration.'
            : 'Use the following OTP to verify your identity and reset your GasConnect password.';

        const mailOptions = {
            from: `"GasConnect" <gasconnect4@gmail.com>`,
            to: email,
            subject,
            text: `
Your GasConnect verification code is ${otp}.

${message}

This OTP is valid for 5 minutes.
Do not share this code with anyone.
            `,
            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: auto;
                    padding: 25px;
                    border: 1px solid #eeeeee;
                    border-radius: 10px;
                ">
                    <h2 style="color: #0754A0;">GasConnect</h2>

                    <h3>${heading}</h3>

                    <p>${message}</p>

                    <h1 style="
                        color: #F59E0B;
                        letter-spacing: 8px;
                        text-align: center;
                    ">
                        ${otp}
                    </h1>

                    <p>This OTP is valid for <strong>5 minutes</strong>.</p>

                    <p style="color: #777;">
                        Do not share this code with anyone.
                    </p>

                    <hr />

                    <p style="font-size: 12px; color: #999;">
                        This is an automated email from GasConnect.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        console.log(`OTP email sent successfully to ${email}`);

        return true;

    } catch (error) {
        console.error('Email sending failed:', error.message);
        throw new Error('Unable to send OTP email');
    }
};

export default sendOtpEmail;