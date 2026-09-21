/** Allowlisted diagnostics only: never log provider bodies, learner text or identifiers. */
export function contextFailureCode(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown';
  if (error.name === 'AuthenticationRequiredError') return 'authentication_required';
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'timeout';
  if (error.message === 'Invalid Context Studio response.') return 'invalid_response';
  if (error.message === 'GEMINI_API_KEY environment variable is missing.') return 'provider_not_configured';
  const status = /^Gemini API request failed \(([1-5][0-9]{2})\)\.$/u.exec(error.message)?.[1];
  return status ? `provider_http_${status}` : 'service_unavailable';
}
