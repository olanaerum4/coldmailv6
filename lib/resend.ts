import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export interface SendEmailOptions {
  to: string
  fromEmail: string
  fromName: string
  subject: string
  htmlBody: string
  emailSentId: string
  trackingPixelId: string
}

/**
 * Replace links in body with tracked redirect URLs
 * and inject an open-tracking pixel.
 */
export function buildTrackedHtml(
  html: string,
  emailSentId: string,
  trackingPixelId: string
): string {
  // Replace all http(s) links with tracked redirect
  const trackedHtml = html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_, url) => {
      const redirectUrl = `${APP_URL}/api/tracking/click?id=${emailSentId}&url=${encodeURIComponent(url)}`
      return `href="${redirectUrl}"`
    }
  )

  // Inject open pixel at end of body
  const pixel = `<img src="${APP_URL}/api/tracking/open/${trackingPixelId}" width="1" height="1" style="display:none" alt="" />`

  return trackedHtml + pixel
}

/**
 * Replace {{name}}, {{company}} etc. in subject/body
 */
export function interpolate(
  template: string,
  vars: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

export async function sendEmail(opts: SendEmailOptions) {
  const { to, fromEmail, fromName, subject, htmlBody, emailSentId, trackingPixelId } = opts

  const trackedHtml = buildTrackedHtml(htmlBody, emailSentId, trackingPixelId)

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html: trackedHtml,
  })

  if (error) throw new Error(error.message)
  return data
}

export { resend }
