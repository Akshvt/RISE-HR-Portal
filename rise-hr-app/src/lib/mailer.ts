import nodemailer from 'nodemailer'

/**
 * Sends an email using either Google OAuth2 (if configured) or standard SMTP.
 * Falls back to Mock Mode (console log) if no credentials are found.
 */
export async function sendEmail({ to, subject, html }: { to: string | string[]; subject: string; html: string }) {
  const isGoogleConfigured = process.env.GOOGLE_USER && process.env.GOOGLE_REFRESH_TOKEN;
  const isSMTPConfigured = process.env.SMTP_HOST;

  if (!isGoogleConfigured && !isSMTPConfigured) {
    console.warn('Mock Email sent to:', to, '| Subject:', subject)
    return
  }

  try {
    let transporter;

    if (isGoogleConfigured) {
      // Use Google OAuth2
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GOOGLE_USER,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        },
      })
    } else {
      // Use standard SMTP
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }

    await transporter.sendMail({
      from: `"RISE Research HR" <${process.env.GOOGLE_USER || 'no-reply@riseresearch.com'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    })
    
    console.log(`Successfully sent real email to: ${to}`);
  } catch (error) {
    console.error('Failed to send real email:', error)
    // Fallback to mock log if real send fails
    console.warn('FALLBACK: Mock Email sent to:', to, '| Subject:', subject)
  }
}
