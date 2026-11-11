import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAuthSessionCoordinator, type SessionCoordinationEvent } from './authSessionCoordinator'

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = []
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null
  postMessage = vi.fn()
  close = vi.fn()

  constructor(_name: string) {
    FakeBroadcastChannel.instances.push(this)
  }

  receive(data: unknown) {
    this.onmessage?.({ data } as MessageEvent<unknown>)
  }
}

describe('auth session coordinator', () => {
  afterEach(() => {
    FakeBroadcastChannel.instances = []
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('serializes cookie operations through Web Locks and releases on completion', async () => {
    const request = vi.fn(async (_name: string, _options: unknown, callback: () => Promise<string>) => callback())
    vi.stubGlobal('navigator', { locks: { request } })
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)
    const coordinator = createAuthSessionCoordinator(vi.fn())

    await expect(coordinator.runCookieOperation(async () => 'done')).resolves.toBe('done')
    expect(request).toHaveBeenCalledWith('sgi-curime-sec-01-cookie-operation', expect.objectContaining({ signal: expect.any(AbortSignal) }), expect.any(Function))
    coordinator.close()
  })

  it('keeps local serialization when Web Locks are unavailable', async () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)
    const coordinator = createAuthSessionCoordinator(vi.fn())
    const calls: string[] = []

    await Promise.all([
      coordinator.runCookieOperation(async () => { calls.push('first'); return 'first' }),
      coordinator.runCookieOperation(async () => { calls.push('second'); return 'second' }),
    ])

    expect(calls).toEqual(['first', 'second'])
    coordinator.close()
  })

  it('continues after a failed locked operation and bounds an unavailable lock wait', async () => {
    const request = vi.fn(async (_name: string, _options: unknown, callback: () => Promise<string>) => callback())
    vi.stubGlobal('navigator', { locks: { request } })
    const coordinator = createAuthSessionCoordinator(vi.fn())

    await expect(coordinator.runCookieOperation(async () => { throw new Error('refresh failed') })).rejects.toThrow('refresh failed')
    await expect(coordinator.runCookieOperation(async () => 'next operation')).resolves.toBe('next operation')
    expect(request).toHaveBeenCalledTimes(2)
    coordinator.close()

    vi.useFakeTimers()
    const blockedRequest = vi.fn((_name: string, options: { signal: AbortSignal }) => new Promise<never>((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Lock wait aborted', 'AbortError')))
    }))
    vi.stubGlobal('navigator', { locks: { request: blockedRequest } })
    const blockedCoordinator = createAuthSessionCoordinator(vi.fn())
    const blocked = blockedCoordinator.runCookieOperation(async () => 'unreachable')
    await vi.advanceTimersByTimeAsync(5_000)
    await expect(blocked).rejects.toThrow('Lock wait aborted')
    blockedCoordinator.close()
  })

  it('does not treat acquisition timeout as cancellation of an acquired callback', async () => {
    vi.useFakeTimers()
    let signal: AbortSignal | undefined
    let complete!: (value: string) => void
    const request = vi.fn(async (_name: string, options: { signal: AbortSignal }, callback: () => Promise<string>) => {
      signal = options.signal
      return callback()
    })
    vi.stubGlobal('navigator', { locks: { request } })
    const coordinator = createAuthSessionCoordinator(vi.fn())
    const operation = coordinator.runCookieOperation(() => new Promise<string>((resolve) => { complete = resolve }))
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(signal?.aborted).toBe(true)
    complete('completed-after-lock-acquisition')
    await expect(operation).resolves.toBe('completed-after-lock-acquisition')
    coordinator.close()
  })

  it('broadcasts metadata-only events and drops duplicate, stale, out-of-order, and malformed events', () => {
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)
    const received = vi.fn()
    const coordinator = createAuthSessionCoordinator(received)
    const channel = FakeBroadcastChannel.instances[0]

    coordinator.publish('session-changed')
    expect(channel.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'session-changed', operationId: expect.any(String), timestamp: expect.any(Number) }))
    const event: SessionCoordinationEvent = { type: 'session-invalidated', operationId: 'remote-event', timestamp: Date.now() }
    channel.receive(event)
    channel.receive(event)
    channel.receive({ type: 'session-changed', operationId: 'out-of-order', timestamp: event.timestamp - 1 })
    channel.receive({ type: 'session-changed', operationId: 'stale', timestamp: Date.now() - 60_001 })
    channel.receive({ type: 'session-changed', accessToken: 'forbidden' })

    expect(received).toHaveBeenCalledTimes(1)
    expect(received).toHaveBeenCalledWith(event)
    expect(JSON.stringify(channel.postMessage.mock.calls)).not.toContain('accessToken')
    coordinator.close()
    expect(channel.close).toHaveBeenCalledOnce()
  })

  it('does not require BroadcastChannel for safe single-context operation', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    vi.stubGlobal('navigator', {})
    const coordinator = createAuthSessionCoordinator(vi.fn())

    await expect(coordinator.runCookieOperation(async () => 'local')).resolves.toBe('local')
    coordinator.publish('session-invalidated')
    coordinator.close()
  })
})
