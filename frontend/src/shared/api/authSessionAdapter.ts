export type SessionInvalidationReason = 'logout' | 'renewal-failed' | 'session-replaced'

export interface AuthSessionAdapter {
  getAccessToken(): string | null
  getSessionEpoch(): number
  renewAccessToken(): Promise<string>
  invalidateSession(reason: SessionInvalidationReason): void
  refreshAccessContext(): Promise<void>
}

let adapter: AuthSessionAdapter | null = null

export function configureAuthSessionAdapter(next: AuthSessionAdapter): () => void {
  adapter = next
  return () => {
    if (adapter === next) adapter = null
  }
}

export function getAuthSessionAdapter(): AuthSessionAdapter | null {
  return adapter
}
