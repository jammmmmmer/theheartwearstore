/**
 * Netlify Scheduled Function — daily at 09:00 UTC.
 * Reconciles the Supabase product cache with Printify: upserts every live
 * product and disables cached products deleted from Printify. Keeps the
 * storefront honest even if a webhook was missed.
 */

import type { Config } from '@netlify/functions'

export default async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theheartwearstore.netlify.app'
  const syncSecret = process.env.SYNC_SECRET

  if (!syncSecret) {
    console.error('[product-sync-cron] SYNC_SECRET not set')
    return
  }

  try {
    console.log('[product-sync-cron] Reconciling products with Printify...')
    const res = await fetch(`${siteUrl}/api/sync-products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${syncSecret}`,
        'Content-Type': 'application/json',
      },
    })

    const body = await res.json()
    if (res.ok) {
      console.log('[product-sync-cron] Success:', body)
    } else {
      console.error(`[product-sync-cron] Failed ${res.status}:`, body)
    }
  } catch (err) {
    console.error('[product-sync-cron] Error:', err)
  }
}

export const config: Config = {
  schedule: '0 9 * * *', // Daily at 09:00 UTC (~4-5am ET)
}
