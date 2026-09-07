/**
 * Typed Event Bus for cross-feature reactive communication.
 * Features communicate via events, preventing direct cross-feature imports.
 */

export type AppEvents = {
  'appointment:created': { appointment: any; source: 'manual' | 'whatsapp' | 'walk-in' }
  'appointment:cancelled': { appointmentId: string; reason: string; cancelledBy?: string }
  'appointment:rescheduled': { appointmentId: string; oldSlot?: any; newSlot?: any }
  'walkin:added': { walkIn: any }
  'walkin:assigned': { walkInId: string; appointmentId: string }
  'whatsapp:message-received': { message: any }
  'whatsapp:booking-request': { request: any }
  'notification:new': { notification: any }
  'auth:login': { user: any }
  'auth:logout': Record<string, never>
}

type EventHandler<T> = (payload: T) => void

class TypedEventBus {
  private listeners: Map<keyof AppEvents, Set<EventHandler<any>>> = new Map()

  public on<K extends keyof AppEvents>(event: K, handler: EventHandler<AppEvents[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)

    // Return unbind function
    return () => this.off(event, handler)
  }

  public off<K extends keyof AppEvents>(event: K, handler: EventHandler<AppEvents[K]>): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  public emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload)
        } catch (err) {
          console.error(`[EventBus] Error in handler for event "${String(event)}":`, err)
        }
      })
    }

    // Also dispatch to window CustomEvent for legacy/DOM listeners if in browser
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent(event, { detail: payload }))
      } catch {
        // Safe ignore
      }
    }
  }
}

export const eventBus = new TypedEventBus()
