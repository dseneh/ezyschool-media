// app/media/[...key]/route.ts
import { NextRequest } from 'next/server'

// If you can, run at edge for low latency
export const runtime = 'edge'

// Required envs:
// R2_ACCOUNT_ID, R2_BUCKET, (optionally) R2_PUBLIC_BASE = https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<BUCKET>
const BASE =
  process.env.R2_PUBLIC_BASE ||
  `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}`

  export async function GET(req: NextRequest) {
    const key = req.nextUrl.pathname.split('/').slice(1).join('/')
    const url = `${BASE}/${encodeURI(key)}`
  
    // forward Range so video/images can be partially fetched
    const range = req.headers.get('range') || undefined
  
    const upstream = await fetch(url, {
      method: 'GET',
      headers: range ? { range } : undefined,
      // R2 public read → no credentials needed
      cache: 'no-store',
    })
  
    if (!upstream.ok) {
      return new Response('Not Found', { status: upstream.status })
    }
  
    // Pass through content-type/length + cache headers
    const headers = new Headers()
    upstream.headers.forEach((value, key) => {
      headers.set(key, value)
    })
    
    // You can enforce cache here for public assets:
    if (!headers.has('cache-control')) {
      headers.set('cache-control', 'public, max-age=31536000, immutable')
    }
    
    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    })
  }
