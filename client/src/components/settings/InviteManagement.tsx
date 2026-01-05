import { useState } from 'react'
import { useInvites, useCreateInvite, useRevokeInvite } from '../../api/hooks'
import type { Invite } from '../../types'

function formatExpiryDate(expiresAt: string): string {
  const date = new Date(expiresAt)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Expired'
  if (diffDays === 1) return 'Expires in 1 day'
  return `Expires in ${diffDays} days`
}

function InviteRow({ invite, onRevoke }: { invite: Invite; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false)

  const inviteUrl = `${window.location.origin}/register?invite=${invite.code}`

  const copyToClipboard = async () => {
    try {
      await window.navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-sm text-primary-400 font-mono truncate">{invite.code}</code>
          <button
            onClick={copyToClipboard}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Copy invite link"
          >
            {copied ? (
              <svg
                className="w-4 h-4 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500">{formatExpiryDate(invite.expiresAt)}</p>
      </div>
      <button
        onClick={onRevoke}
        className="ml-4 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        Revoke
      </button>
    </div>
  )
}

export default function InviteManagement() {
  const { data: invites, isLoading } = useInvites()
  const createInvite = useCreateInvite()
  const revokeInvite = useRevokeInvite()
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreateInvite = async () => {
    try {
      const invite = await createInvite.mutateAsync()
      const url = `${window.location.origin}/register?invite=${invite.code}`
      setNewInviteUrl(url)
    } catch (err) {
      console.error('Failed to create invite:', err)
    }
  }

  const handleRevokeInvite = async (inviteId: number) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return
    try {
      await revokeInvite.mutateAsync(inviteId)
    } catch (err) {
      console.error('Failed to revoke invite:', err)
    }
  }

  const copyNewInvite = async () => {
    if (!newInviteUrl) return
    try {
      await window.navigator.clipboard.writeText(newInviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Invite Users</h3>
        <p className="text-sm text-slate-400 mb-4">
          Create invite links to allow new users to register. Links expire after 7 days or after
          first use.
        </p>

        <button
          onClick={handleCreateInvite}
          disabled={createInvite.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          {createInvite.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Invite Link
            </>
          )}
        </button>

        {newInviteUrl && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-sm text-green-400 mb-2">Invite created! Share this link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newInviteUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-sm text-white font-mono"
              />
              <button
                onClick={copyNewInvite}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => setNewInviteUrl(null)}
              className="mt-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white mb-3">Pending Invites</h4>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invites && invites.length > 0 ? (
          <div className="space-y-2">
            {invites.map((invite) => (
              <InviteRow
                key={invite.id}
                invite={invite}
                onRevoke={() => handleRevokeInvite(invite.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-4 text-center">No pending invites</p>
        )}
      </div>
    </div>
  )
}
