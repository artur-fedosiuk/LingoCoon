/**
 * Resolves auth error and message codes to safe i18n translation keys.
 * Prevents spoofing by only allowing known error codes.
 * Maps user_not_found to invalid_credentials for security (don't reveal user existence).
 */
export function resolveAuthAlert(
  error: string | null,
  message: string | null
): { errorKey: string | null; messageKey: string | null } {
  // Known error codes that can be safely displayed to users
  const ERROR_CODE_MESSAGES: Record<string, string> = {
    // Supabase Auth error codes
    'invalid_credentials': 'auth.errors.invalid_credentials',
    'email_not_confirmed': 'auth.errors.email_not_confirmed',
    'weak_password': 'auth.errors.weak_password',
    'user_already_exists': 'auth.errors.user_already_exists',
    'signup_disabled': 'auth.errors.signup_disabled',
    'email_conflict': 'auth.errors.email_conflict',
    'reauthentication_needed': 'auth.errors.reauthentication_needed',
    'session_not_found': 'auth.errors.session_not_found',
    'token_expired': 'auth.errors.token_expired',
    'invalid_token': 'auth.errors.invalid_token',
    'oauth_error': 'auth.errors.oauth_error',
    'provider_disabled': 'auth.errors.provider_disabled',
    'unauthorized': 'auth.errors.unauthorized',
    'forbidden': 'auth.errors.forbidden',
    'server_error': 'auth.errors.server_error',
    // Generic fallback
    'unknown': 'auth.errors.unknown',
    // fill_all_fields is a local validation error, not from Supabase
    'fill_all_fields': 'auth.errors.fill_all_fields',
    'password_min_length': 'auth.errors.password_min_length',
    'invalid_email': 'auth.errors.invalid_email',
  };

  // Known message codes for success/info messages
  const MESSAGE_CODE_MESSAGES: Record<string, string> = {
    'onboarding_complete': 'onboarding.create_account_to_save',
    'email_confirmation_sent': 'auth.messages.email_confirmation_sent',
    'password_reset_sent': 'auth.messages.password_reset_sent',
    'signed_out': 'auth.messages.signed_out',
  };

  // Resolve error code
  let errorKey: string | null = null;
  if (error) {
    // Map user_not_found to invalid_credentials (security: don't reveal user existence)
    const normalizedError = error === 'user_not_found' ? 'invalid_credentials' : error;
    if (Object.hasOwn(ERROR_CODE_MESSAGES, normalizedError)) {
      errorKey = ERROR_CODE_MESSAGES[normalizedError];
    } else {
      // Unknown error code -> generic fallback
      errorKey = ERROR_CODE_MESSAGES.unknown;
    }
  }

  // Resolve message code
  let messageKey: string | null = null;
  if (message && Object.hasOwn(MESSAGE_CODE_MESSAGES, message)) {
    messageKey = MESSAGE_CODE_MESSAGES[message];
  }

  return { errorKey, messageKey };
}