import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({ to, subject, html }: { to: string | string[]; subject: string; html: string }) {
  if (!process.env.SMTP_HOST) {
    console.warn('Mock Email sent to:', to, '| Subject:', subject)
    return
  }
  
  try {
    await transporter.sendMail({
      from: '"RISE Research HR" <no-reply@riseresearch.com>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}
