import 'server-only'

import { cookies } from 'next/headers'
import { decrypt, encrypt } from './encryption'

// Create a session
export async function createSession(uid: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ uid, expires })

  cookies().set('session', session, {
    httpOnly: true,
    secure: true,
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })
}

// Get the session
export async function getSession() {
  const session = cookies().get('session')?.value
  if (!session) return null
  return await decrypt(session)
}

// Delete the session
export function deleteSession() {
  cookies().delete('session')
}
