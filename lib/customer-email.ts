/**
 * Customer transactional emails via Resend: order confirmation + shipped.
 * NEVER throws — email failures must not break fulfillment or webhooks.
 * Silently skips (with a console warning) when RESEND_API_KEY is unset.
 */

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn(`[customer-email] RESEND_API_KEY not set — skipped: "${subject}" to ${to}`)
      return
    }
    if (!to) return

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `The Heartwear Store <orders@${process.env.EMAIL_DOMAIN || 'theheartwearstore.ca'}>`,
        to,
        subject,
        html,
      }),
    })
    if (!res.ok) {
      console.warn(`[customer-email] Resend responded ${res.status} for "${subject}"`)
    }
  } catch (err) {
    console.warn(`[customer-email] Failed to send "${subject}":`, err)
  }
}

function shell(inner: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:Georgia,serif;color:#f5f5f4;">
  <div style="max-width:560px;margin:40px auto;padding:32px;background:#1c1917;border-radius:12px;">
    <p style="color:#84a87a;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px">The Heartwear Store</p>
    ${inner}
    <p style="color:#57534e;font-size:12px;margin:28px 0 0;">Questions? Just reply to this email. / Des questions ? Répondez simplement à ce courriel.</p>
  </div>
</body>
</html>`
}

export async function sendOrderConfirmationEmail(params: {
  to: string
  name: string
  orderRef: string
  itemCount: number
}): Promise<void> {
  const { to, name, orderRef, itemCount } = params
  const firstName = name.trim().split(' ')[0] || 'there'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.theheartwearstore.ca'
  await sendEmail(
    to,
    `Order confirmed — #${orderRef}`,
    shell(`
    <h1 style="color:#f5f5f4;font-size:24px;margin:0 0 16px">Thanks, ${firstName} — your order is confirmed.</h1>
    <p style="color:#a8a29e;font-size:14px;line-height:1.6;margin:0 0 12px">
      Order <strong style="color:#d6d3d1">#${orderRef}</strong> (${itemCount} item${itemCount === 1 ? '' : 's'})
      is being printed just for you. Made-to-order production usually takes 2–7 business days,
      and we'll email you tracking the moment it ships.
    </p>
    <p style="color:#a8a29e;font-size:14px;margin:20px 0 0">
      <a href="${siteUrl}/track" style="color:#84a87a">Track your order anytime →</a>
    </p>`)
  )
}

export async function sendShippedEmail(params: {
  to: string
  name: string
  orderRef: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
}): Promise<void> {
  const { to, name, orderRef, carrier, trackingNumber, trackingUrl } = params
  const firstName = name.trim().split(' ')[0] || 'there'
  const trackingLine = trackingUrl
    ? `<a href="${trackingUrl}" style="display:inline-block;background:#4d7c3e;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600">Track your package</a>`
    : trackingNumber
      ? `<p style="color:#d6d3d1;font-size:14px">Tracking number: <strong>${trackingNumber}</strong>${carrier ? ` (${carrier.toUpperCase()})` : ''}</p>`
      : ''
  await sendEmail(
    to,
    `Your order is on its way — #${orderRef}`,
    shell(`
    <h1 style="color:#f5f5f4;font-size:24px;margin:0 0 16px">Good news, ${firstName} — order #${orderRef} has shipped.</h1>
    ${trackingNumber && trackingUrl ? `<p style="color:#a8a29e;font-size:14px;margin:0 0 20px">Tracking: <strong style="color:#d6d3d1">${trackingNumber}</strong>${carrier ? ` via ${carrier.toUpperCase()}` : ''}</p>` : ''}
    ${trackingLine}`)
  )
}
