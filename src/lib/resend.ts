import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || 're_123456789'; // Dummy key to prevent init crash
export const resend = new Resend(apiKey);

// Configuration for Email Senders
// Note: These domains must be verified in Resend dashboard.
export const EMAIL_SENDER_SUPPORT = 'WSP Support <support@portal.wsp-graz.com>';
export const EMAIL_SENDER_PARTNER = 'WSP Partner <partner@portal.wsp-graz.com>';

// Default sender
const DEFAULT_SENDER = EMAIL_SENDER_SUPPORT;

export async function sendEmail({
    to,
    subject,
    html,
    from = DEFAULT_SENDER,
}: {
    to: string;
    subject: string;
    html: string;
    from?: string;
}) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_123')) {
        console.log('RESEND_API_KEY not set or is dummy. Skipping email send.');
        console.log('--- EMAIL MOCK ---');
        console.log(`From: ${from}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('--- END EMAIL MOCK ---');
        return { success: true };
    }

    try {
        const data = await resend.emails.send({
            from,
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
