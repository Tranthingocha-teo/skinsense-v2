// Supabase expects Google to have hashed the nonce (SHA-256 hex): give Google
// the hash, give signInWithIdToken the raw value.
export async function generateNonce() {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { nonce, hashedNonce };
}
