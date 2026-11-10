export type SessionCoordinationEventType = 'session-changed' | 'session-invalidated' | 'refresh-started' | 'refresh-completed'

export interface SessionCoordinationEvent {
  type: SessionCoordinationEventType
  operationId: string
  timestamp: number
}

export interface AuthSessionCoordinator {
  runCookieOperation<T>(operation: () => Promise<T>): Promise<T>
  publish(type: SessionCoordinationEventType): void
  close(): void
}

type LockManagerLike = {
  request<T>(name: string, options: { signal?: AbortSignal }, callback: () => Promise<T>): Promise<T>
}

type BroadcastChannelLike = {
  postMessage(message: SessionCoordinationEvent): void
  close(): void
  onmessage: ((event: MessageEvent<unknown>) => void) | null
}

const LOCK_NAME = 'sgi-curime-sec-01-cookie-operation'
const CHANNEL_NAME = 'sgi-curime-sec-01-session'
const LOCK_WAIT_MS = 5_000
const EVENT_MAX_AGE_MS = 60_000
const MAX_SEEN_OPERATIONS = 128

function browserLocks(): LockManagerLike | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { locks?: LockManagerLike }).locks
}

function newOperationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isEvent(value: unknown): value is SessionCoordinationEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Record<string, unknown>
  return typeof event.operationId === 'string'
    && typeof event.timestamp === 'number'
    && ['session-changed', 'session-invalidated', 'refresh-started', 'refresh-completed'].includes(String(event.type))
}

function createBroadcastChannel(): BroadcastChannelLike | undefined {
  if (typeof BroadcastChannel === 'undefined') return undefined
  return new BroadcastChannel(CHANNEL_NAME) as BroadcastChannelLike
}

export function createAuthSessionCoordinator(onEvent: (event: SessionCoordinationEvent) => void): AuthSessionCoordinator {
  let localQueue = Promise.resolve()
  let closed = false
  let latestRemoteTimestamp = 0
  const seenOperationIds = new Set<string>()
  const channel = createBroadcastChannel()

  const remember = (operationId: string) => {
    seenOperationIds.add(operationId)
    if (seenOperationIds.size > MAX_SEEN_OPERATIONS) seenOperationIds.delete(seenOperationIds.values().next().value!)
  }

  if (channel) {
    channel.onmessage = ({ data }) => {
      if (closed || !isEvent(data) || seenOperationIds.has(data.operationId)) return
      if (Date.now() - data.timestamp > EVENT_MAX_AGE_MS) return
      if (data.timestamp < latestRemoteTimestamp) return
      latestRemoteTimestamp = data.timestamp
      remember(data.operationId)
      onEvent(data)
    }
  }

  const withWebLock = async <T>(operation: () => Promise<T>) => {
    const locks = browserLocks()
    if (!locks) return operation()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LOCK_WAIT_MS)
    try {
      return await locks.request(LOCK_NAME, { signal: controller.signal }, operation)
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    runCookieOperation<T>(operation: () => Promise<T>) {
      const result = localQueue.catch(() => undefined).then(() => withWebLock(operation))
      localQueue = result.then(() => undefined, () => undefined)
      return result
    },
    publish(type) {
      if (closed || !channel) return
      const event = { type, operationId: newOperationId(), timestamp: Date.now() }
      remember(event.operationId)
      channel.postMessage(event)
    },
    close() {
      if (closed) return
      closed = true
      channel?.close()
    },
  }
}
