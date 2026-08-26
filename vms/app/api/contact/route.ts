import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json();

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT),
            secure: true,
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        });

        const mailOptions = {
            from: '"Acara VMS Contact Form" <m.thompson06@gmail.com>',
            to: 'm.thompson06@gmail.com',
            replyTo: email,
            subject: `New Contact Form Submission from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Error sending contact email:", error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
