import { createServiceClient } from '@/lib/supabase/server'
import { lockDevice, notifyStoreUsers } from '@/lib/fcm'
import { NextResponse } from 'next/server'

const PACKAGE_NAME = 'com.varcheck.emilock'

interface IntegrityVerdict {
  tokenPayloadExternal?: {
    appIntegrity?: { appRecognitionVerdict?: string }
    deviceIntegrity?: { deviceRecognitionVerdict?: string[] }
  }
}

async function verifyWithGoogle(token: string): Promise<{ passed: boolean; reason?: string }> {
  const apiKey = process.env.PLAY_INTEGRITY_API_KEY
  if (!apiKey) {
    // No key configured — skip verification in development
    console.warn('[integrity] PLAY_INTEGRITY_API_KEY not set — skipping server-side verification')
    return { passed: true }
  }

  try {
    const res = await fetch(
      `https://playintegrity.googleapis.com/v1/${PACKAGE_NAME}:decodeIntegrityToken?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrity_token: token }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[integrity] Google API error:', errText)
      return { passed: false, reason: 'google_api_error' }
    }

    const verdict: IntegrityVerdict = await res.json()
    const appVerdict = verdict.tokenPayloadExternal?.appIntegrity?.appRecognitionVerdict
    const deviceVerdicts = verdict.tokenPayloadExternal?.deviceIntegrity?.deviceRecognitionVerdict ?? []

    if (appVerdict !== 'PLAY_RECOGNIZED') {
      return { passed: false, reason: `app_not_recognized: ${appVerdict}` }
    }
    if (!deviceVerdicts.includes('MEETS_DEVICE_INTEGRITY')) {
      return { passed: false, reason: `device_integrity_failed: ${deviceVerdicts.join(',')}` }
    }

    return { passed: true }
  } catch (err) {
    console.error('[integrity] Verification error:', err)
    // On network error, give benefit of the doubt — don't lock device
    return { passed: true }
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  const { passed, reason } = await verifyWithGoogle(token)

  if (!passed) {
    console.warn(`[integrity] Device ${id} FAILED integrity check: ${reason}`)

    const supabase = createServiceClient()
    const { data: device } = await supabase
      .from('devices')
      .select('store_id, model, hmac_secret, customers(name), stores(name, phone, address)')
      .eq('id', id)
      .single()

    if (device) {
      const store = device.stores as { name: string; phone: string; address: string | null } | null
      // Lock the device immediately — tampered device cannot be trusted
      await lockDevice(id, device.hmac_secret, { name: store?.name ?? '', phone: store?.phone ?? '', address: store?.address ?? null }, 0)

      await supabase.from('lock_events').insert({
        device_id: id,
        lock_reason: `INTEGRITY_FAILED: ${reason}`,
      })

      await notifyStoreUsers(
        device.store_id,
        { id, customer_name: (device.customers as { name: string } | null)?.name ?? 'Customer', model: device.model, due_amount: 0 },
        { title: '🚨 Tampered Device Locked', body: `${(device.customers as { name: string } | null)?.name ?? 'Customer'}'s ${device.model} failed integrity check and was locked automatically.` }
      )
    }

    return NextResponse.json({ ok: false, reason }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
