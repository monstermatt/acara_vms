import nodemailer from 'nodemailer';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { email } = await req.json();

    // Call Django endpoint
    const djangoRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/password-reset-request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    const data = await djangoRes.json();

    if (!djangoRes.ok) {
        // Handle Django errors without exposing to client side
        console.error("Django rejected password reset:", await djangoRes.text());
        return NextResponse.json({ error: "Failed to request password reset from backend" }, { status: djangoRes.status });
    }

    // If Django returns a token, send the email
    if (data.token && data.uid) {
        // Construct the frontend URL
        const resetLink = `${process.env.NEXTAUTH_URL}/login/?uid=${data.uid}&token=${data.token}`;

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            //pool: true, //set to true for production to reuse connections
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT),
            secure: true,
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: '"Acara VMS" <noreply@vms.com>',
            to: email,
            subject: "Acara Volunteer Management System",
            html: `<div>
                <p>Greetings Volunteer,</p>
                <p>You are receiving this email because you or someone else has requested to set or reset the password for your Acara Volunteer Management System account.</p>

                <p>Please click on the link below to set or reset your password:</p>
                <p><a href="${resetLink}" style="background-color: #000000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set/Reset Password</a></p>

                <p>If you did not request this change, please disregard this email. Your password will remain unchanged.</p>
                <p>If you have technical questions please reach out.</p>

                <p>Thank you,<br>Acara Volunteer Management System Team</p>
                </div>`,
        });


        return NextResponse.json({ success: true });
    } else {
        console.error("Django returned 200 but was missing token or uid.", data);
        return NextResponse.json({ error: "Invalid response from server" }, { status: 500 });
    }

}