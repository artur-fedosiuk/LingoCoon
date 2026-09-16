export function isContextStudioEnabled(): boolean {
  return process.env.READING_ENABLED === 'true'
    || (process.env.NODE_ENV === 'development' && process.env.CONTEXT_STUDIO_LOCAL_ENABLED === 'true');
}
