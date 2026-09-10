import { auth } from "@/lib/firebase";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) headers.set("content-type", "application/json");
  if (auth?.currentUser) headers.set("Authorization", `Bearer ${await auth.currentUser.getIdToken()}`);
  return fetch(input, { ...init, headers });
}
