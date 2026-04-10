import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')
  const answer = searchParams.get('answer')

  if (!token || (answer !== 'yes' && answer !== 'no')) {
    return new Response('Invalid request', { status: 400 })
  }

  const record = await db.bookedClass.findUnique({ where: { emailToken: token } })
  if (!record) {
    return htmlResponse('This link has already been used or is invalid.')
  }

  if (answer === 'yes') {
    await db.bookedClass.update({ where: { emailToken: token }, data: { attended: 'yes' } })
    return htmlResponse('Great! Your attendance has been recorded. Keep dancing! 🕺')
  } else {
    await db.bookedClass.delete({ where: { emailToken: token } })
    return htmlResponse('No problem — the class has been removed from your log.')
  }
}

function htmlResponse(message: string) {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dancetify</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#fff9c4,#ffccbc,#f8bbd0,#e1bee7)}
    .card{background:rgba(255,255,255,0.8);backdrop-filter:blur(12px);border-radius:16px;padding:40px;text-align:center;max-width:400px}
    h1{margin:0 0 12px;font-size:24px;color:#374151}p{color:#6b7280;margin:0}</style></head>
    <body><div class="card"><h1>Dancetify</h1><p>${message}</p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}
