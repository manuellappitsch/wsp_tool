import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || 're_123456789'; // Dummy key to prevent init crash
export const resend = new Resend(apiKey);

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_123')) {
        console.log('RESEND_API_KEY not set or is dummy. Skipping email send.');
        console.log('--- EMAIL MOCK ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('--- END EMAIL MOCK ---');
        return { success: true };
    }

    try {
        const data = await resend.emails.send({
            from: 'WSP Training <noreply@wsp-training.de>', // Update with verified domain later
            to,
            subject,
            html,
        });
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}
