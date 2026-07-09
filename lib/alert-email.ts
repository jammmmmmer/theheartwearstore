/**
 * Owner alert emails (via Resend) for operational failures — e.g. a paid
 * order that could not be submitted to Printify.
 *
 * NEVER throws: alerting must not break the flow it is reporting on.
 * Silently skips (with a console warning) when RESEND_API_KEY is unset.
 */
export async function sendOwnerAlert(subject: string, htmlBody: string): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn(`[alert] RESEND_API_KEY not set — alert not emailed: ${subject}`)
      return
    }
    if (!process.env.OWNER_EMAIL) {
      console.warn(`[alert] OWNER_EMAIL not set — alert not emailed: ${subject}`)
      return
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Heartwear Alerts <noreply@${process.env.EMAIL_DOMAIN || 'theheartwearstore.ca'}>`,
        to: process.env.OWNER_EMAIL,
        subject: `[Heartwear] ${subject}`,
        html: htmlBody,
      }),
    })

    if (!res.ok) {
      console.warn(`[alert] Resend responded ${res.status} for alert: ${subject}`)
    }
  } catch (err) {
    console.warn(`[alert] Failed to send alert "${subject}":`, err)
  }
}
