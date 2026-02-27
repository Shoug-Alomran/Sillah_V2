const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || ""; 
// If VITE_API_BASE is "", requests go to same-origin (works with Vite proxy in dev)

export async function api(path, options = {}) {
  if (!API_BASE && typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    throw new Error(
      "Phase 5 API is not configured in production. Set VITE_API_BASE in Vercel to your backend URL."
    );
  }

  const url = API_BASE ? `${API_BASE}${path}` : path;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // keep cookies (JWT cookie etc.)
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const bodySnippet = await res.text().catch(() => "");
    throw new Error(
      `API did not return JSON for ${url}. Check VITE_API_BASE/backend routing. Response starts with: ${bodySnippet.slice(0, 80)}`
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}
