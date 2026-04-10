import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FROM = process.env.EMAIL_FROM ?? 'hello@dancetify.com'

interface BookedClassEmail {
  emailToken: string
  className: string
  studioName: string
  instructor: string
  classDate: string
  startTime: string
  endTime: string
}

export async function sendAttendanceEmail(to: string, booked: BookedClassEmail) {
  const yesUrl = `${APP_URL}/api/attend?token=${booked.emailToken}&answer=yes`
  const noUrl = `${APP_URL}/api/attend?token=${booked.emailToken}&answer=no`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Did you attend ${booked.className}?`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:40px 0">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
            <h2 style="margin:0 0 8px;color:#374151">Did you make it?</h2>
            <p style="color:#6b7280;margin:0 0 24px">We noticed your class has passed. Did you attend?</p>

            <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin-bottom:28px">
              <p style="margin:0 0 4px;font-weight:700;color:#111827">${booked.className}</p>
              <p style="margin:0 0 2px;color:#6b7280;font-size:14px">${booked.studioName} · with ${booked.instructor}</p>
              <p style="margin:0;color:#9ca3af;font-size:13px">${booked.classDate} · ${booked.startTime}–${booked.endTime}</p>
            </div>

            <div style="display:flex;gap:12px">
              <a href="${yesUrl}" style="flex:1;display:block;text-align:center;padding:14px;background:#a78bfa;color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none">
                Yes, I attended ✓
              </a>
              <a href="${noUrl}" style="flex:1;display:block;text-align:center;padding:14px;background:#f3f4f6;color:#374151;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none">
                No, I didn't go
              </a>
            </div>

            <p style="margin:28px 0 0;font-size:12px;color:#d1d5db;text-align:center">Dancetify · London Dance Classes</p>
            <p style="margin:8px 0 0;font-size:11px;color:#e5e7eb;text-align:center">
              You're receiving this because you booked a class on Dancetify.<br/>
              To stop receiving these emails, reply to this email or contact <a href="mailto:hello@dancetify.com" style="color:#e5e7eb">hello@dancetify.com</a>.
              <br/><a href="${APP_URL}/privacy" style="color:#e5e7eb;text-decoration:underline">Privacy Policy</a>
            </p>
          </div>
        </body>
      </html>
    `,
  })
}
