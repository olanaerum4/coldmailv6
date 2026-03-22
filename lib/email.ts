import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export function buildEmailBody(
  body: string,
  leadId: string,
  emailSentId: string,
  pixelId: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Replace plain http links with click-tracked redirects
  const trackedBody = body.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match: string, url: string) => {
      const encoded = encodeURIComponent(url)
      return `href="${appUrl}/api/tracking/click?url=${encoded}&eid=${emailSentId}"`
    }
  )

  // Tracking pixel
  const pixel = `<img src="${appUrl}/api/tracking/open/${pixelId}" width="1" height="1" style="display:none;border:0;height:1px;width:1px" alt="" />`

  // Unsubscribe footer
  const unsubFooter = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:11px;color:#9ca3af;text-align:center;">
  Ønsker du ikke å motta flere e-poster?
  <a href="${appUrl}/api/unsubscribe?lead=${leadId}" style="color:#6b7280;text-decoration:underline;">Meld deg av her</a>
</div>`

  return trackedBody + unsubFooter + pixel
}

export function replaceVars(text: string, lead: Record<string, string | null>): string {
  return text
    .replace(/\{\{name\}\}/g, lead.name ?? '')
    .replace(/\{\{company\}\}/g, lead.company ?? '')
    .replace(/\{\{email\}\}/g, lead.email ?? '')
    .replace(/\{\{phone\}\}/g, lead.phone ?? '')
}
