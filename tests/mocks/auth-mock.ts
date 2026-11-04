export class AuthenticationRequiredError extends Error {
  constructor() { super('Authentication required.'); this.name = 'AuthenticationRequiredError'; }
}

let mockRequireAuthenticatedClaims: () => Promise<{ claims: { sub: string } }> = async () => {
  throw new AuthenticationRequiredError();
};

export async function requireAuthenticatedClaims() {
  return mockRequireAuthenticatedClaims();
}

export function setMockRequireAuthenticatedClaims(fn: () => Promise<{ claims: { sub: string } }>) {
  mockRequireAuthenticatedClaims = fn;
}

export function resetMockRequireAuthenticatedClaims() {
  mockRequireAuthenticatedClaims = async () => { throw new AuthenticationRequiredError(); };
}
