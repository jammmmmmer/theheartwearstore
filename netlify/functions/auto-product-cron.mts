/**
 * Netlify Scheduled Function — runs weekly on Monday at 10am ET (15:00 UTC)
 * Triggers the auto-product generation pipeline
 */

import type { Config } from '@netlify/functions'

export default async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theheartwearstore.netlify.app'
  const syncSecret = process.env.SYNC_SECRET

  if (!syncSecret) {
    console.error('[auto-product-cron] SYNC_SECRET not set')
    return
  }

  try {
    console.log('[auto-product-cron] Triggering auto-product generation...')
    const res = await fetch(`${siteUrl}/api/auto-product/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${syncSecret}`,
        'Content-Type': 'application/json',
      },
    })

    const body = await res.json()
    if (res.ok) {
      console.log(`[auto-product-cron] Success:`, body)
    } else {
      console.error(`[auto-product-cron] Failed ${res.status}:`, body)
    }
  } catch (err) {
    console.error('[auto-product-cron] Error:', err)
  }
}

export const config: Config = {
  schedule: '0 15 * * 1', // Every Monday at 15:00 UTC (11am ET)
}
