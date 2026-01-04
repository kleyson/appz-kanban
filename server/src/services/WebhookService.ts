import { settingsRepository } from '../repositories/SettingsRepository'
import type { WebhookEvent, WebhookSettings } from '../types'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
}

class WebhookService {
  /**
   * Send a webhook for a specific event
   */
  async send(userId: number, event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    try {
      const settings = settingsRepository.findByUserId(userId)
      const webhook = settings.webhook

      // Check if webhooks are enabled and this event is subscribed
      if (!webhook?.enabled || !webhook.url || !webhook.events.includes(event)) {
        return
      }

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      }

      const body = JSON.stringify(payload)

      // Create HMAC signature if secret is configured
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Kanban-Event': event,
      }

      if (webhook.secret) {
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhook.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        )
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
        const signatureHex = Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        headers['X-Kanban-Signature'] = `sha256=${signatureHex}`
      }

      // Send webhook (fire and forget, don't block the main request)
      fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
      })
        .then((response) => {
          if (!response.ok) {
            console.error(`Webhook failed: ${response.status} ${response.statusText}`)
          }
        })
        .catch((error) => {
          console.error('Webhook error:', error)
        })
    } catch (error) {
      console.error('Webhook service error:', error)
    }
  }

  /**
   * Test a webhook configuration
   */
  async test(webhookSettings: WebhookSettings): Promise<{ success: boolean; error?: string }> {
    if (!webhookSettings.url) {
      return { success: false, error: 'Webhook URL is required' }
    }

    try {
      const payload: WebhookPayload = {
        event: 'card.created',
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: 'This is a test webhook from Kanban',
        },
      }

      const body = JSON.stringify(payload)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Kanban-Event': 'test',
      }

      if (webhookSettings.secret) {
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhookSettings.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        )
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
        const signatureHex = Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        headers['X-Kanban-Signature'] = `sha256=${signatureHex}`
      }

      const response = await fetch(webhookSettings.url, {
        method: 'POST',
        headers,
        body,
      })

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const webhookService = new WebhookService()
