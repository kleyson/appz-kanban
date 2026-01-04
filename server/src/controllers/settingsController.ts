import { Elysia, t } from 'elysia'
import { authPlugin } from '../middleware/auth'
import { settingsService } from '../services/SettingsService'
import { webhookService } from '../services/WebhookService'
import type { UserSettings, WebhookSettings } from '../types'

export const settingsController = new Elysia({ prefix: '/settings' })
  .use(authPlugin)
  .get('/', ({ user }) => {
    return settingsService.getSettings(user!.id)
  })
  .put(
    '/',
    ({ body, user }) => {
      return settingsService.updateSettings(user!.id, body as Partial<UserSettings>)
    },
    {
      body: t.Object({
        defaultDueDays: t.Optional(t.Number({ minimum: 1, maximum: 30 })),
        defaultColumns: t.Optional(t.Array(t.String({ minLength: 1 }))),
        dueDateWarnings: t.Optional(
          t.Object({
            urgent: t.Optional(t.Number({ minimum: 0 })),
            warning: t.Optional(t.Number({ minimum: 0 })),
            approaching: t.Optional(t.Number({ minimum: 0 })),
          })
        ),
        fullscreen: t.Optional(
          t.Object({
            autoRefreshInterval: t.Optional(t.Number({ minimum: 5, maximum: 300 })),
            showClock: t.Optional(t.Boolean()),
          })
        ),
        cardRotting: t.Optional(
          t.Object({
            enabled: t.Optional(t.Boolean()),
            thresholds: t.Optional(
              t.Object({
                slight: t.Optional(t.Number({ minimum: 1 })),
                medium: t.Optional(t.Number({ minimum: 1 })),
                heavy: t.Optional(t.Number({ minimum: 1 })),
              })
            ),
          })
        ),
        webhook: t.Optional(
          t.Object({
            enabled: t.Optional(t.Boolean()),
            url: t.Optional(t.String()),
            secret: t.Optional(t.String()),
            events: t.Optional(
              t.Array(
                t.Union([
                  t.Literal('card.created'),
                  t.Literal('card.updated'),
                  t.Literal('card.moved'),
                  t.Literal('card.deleted'),
                  t.Literal('column.created'),
                  t.Literal('column.deleted'),
                  t.Literal('board.created'),
                  t.Literal('label.created'),
                ])
              )
            ),
          })
        ),
      }),
    }
  )
  .post(
    '/webhook/test',
    async ({ body }) => {
      const result = await webhookService.test(body as WebhookSettings)
      return result
    },
    {
      body: t.Object({
        enabled: t.Boolean(),
        url: t.String(),
        secret: t.String(),
        events: t.Array(t.String()),
      }),
    }
  )
  .delete('/', ({ user, set }) => {
    settingsService.resetSettings(user!.id)
    set.status = 204
    return
  })
