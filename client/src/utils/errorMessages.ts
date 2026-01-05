// Error code to user-friendly message mapping
export const errorMessages: Record<string, string> = {
  // Auth errors
  USERNAME_TAKEN: 'This username is already taken. Please choose another.',
  INVALID_CREDENTIALS: 'Invalid username or password. Please try again.',
  INVALID_INVITE: 'Invalid invite code. Please check your invite link.',
  INVITE_EXPIRED: 'This invite has expired. Please request a new one.',
  INVITE_ALREADY_USED: 'This invite has already been used.',
  REGISTRATION_DISABLED: 'Registration requires an invite code from an administrator.',

  // Validation errors
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters.',
  DISPLAY_NAME_REQUIRED: 'Display name is required.',

  // Permission errors
  NOT_AUTHORIZED: 'You are not authorized to perform this action.',
  NOT_ADMIN: 'This action requires administrator privileges.',
  NOT_BOARD_OWNER: 'Only the board owner can perform this action.',
  NOT_BOARD_MEMBER: 'You must be a member of this board.',

  // Resource errors
  USER_NOT_FOUND: 'User not found.',
  BOARD_NOT_FOUND: 'Board not found.',
  COLUMN_NOT_FOUND: 'Column not found.',
  CARD_NOT_FOUND: 'Card not found.',
  INVITE_NOT_FOUND: 'Invite not found.',

  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if it's an ApiError with a code
    const apiError = error as Error & { code?: string }
    if (apiError.code && errorMessages[apiError.code]) {
      return errorMessages[apiError.code]
    }
    // Fall back to the error message
    return error.message
  }
  return 'An unexpected error occurred.'
}
