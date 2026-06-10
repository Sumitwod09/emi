// v2.0: FCM removed. Use PUT /api/devices/:id/device-key instead.
import { NextResponse } from 'next/server'

export async function PUT() {
  return NextResponse.json(
    { error: 'FCM removed in v2.0. Use /api/devices/:id/device-key' },
    { status: 410 }
  )
}
