/**
 * Shared approval email helper.
 * Called by both /api/auto-product/generate (AI pipeline)
 * and /api/auto-product/upload (manual upload flow).
 *
 * Requires RESEND_API_KEY in env — get one free at https://resend.com
 * Set EMAIL_DOMAIN to your verified sending domain (theheartwearstore.ca)
 * Set OWNER_EMAIL to where approval emails should land
 */
export async function sendApprovalEmail(params: {
  topic: string
  title: string
  mockupUrl: string
  approveUrl: string
  rejectUrl: string
}): Promise<void> {
  const { topic, title, mockupUrl, approveUrl, rejectUrl } = params

  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping approval email.')
    console.warn('[email] Approve URL:', approveUrl)
    console.warn('[email] Reject URL:', rejectUrl)
    return
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:Georgia,serif;color:#f5f5f4;">
  <div style="max-width:560px;margin:40px auto;padding:32px;background:#1c1917;border-radius:12px;">
    <p style="color:#84a87a;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">New Design Ready for Review</p>
    <h1 style="color:#f5f5f4;font-size:26px;margin:0 0 24px;line-height:1.3">${title}</h1>

    <p style="color:#a8a29e;font-size:14px;margin:0 0 20px">Topic: <strong style="color:#d6d3d1">${topic}</strong></p>

    ${mockupUrl ? `<img src="${mockupUrl}" alt="${title}" style="width:100%;border-radius:8px;margin-bottom:24px;display:block">` : ''}

    <p style="color:#a8a29e;font-size:14px;margin:0 0 28px">Does this design feel right for The Heartwear Store? One click to decide.</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:8px">
          <a href="${approveUrl}" style="display:block;text-align:center;background:#4d7c3e;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600">
            ✓ Approve &amp; Publish
          </a>
        </td>
        <td style="padding-left:8px">
          <a href="${rejectUrl}" style="display:block;text-align:center;background:#292524;color:#a8a29e;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;border:1px solid #44403c">
            ✕ Reject &amp; Delete
          </a>
        </td>
      </tr>
    </table>

    <p style="color:#57534e;font-size:12px;margin:28px 0 0;text-align:center">These links expire in 7 days. Each link can only be used once.</p>
  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `The Heartwear Store <noreply@${process.env.EMAIL_DOMAIN || 'theheartwearstore.ca'}>`,
      to: process.env.OWNER_EMAIL!,
      subject: `New Design Ready: ${title}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Email send failed: ${res.status} - ${err}`)
  }
}
