const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "";
// If VITE_API_BASE is "", requests go to same-origin (works with Vite proxy in dev
// and can work in production if frontend/backend share origin).

export async function api(path, options = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  let res;

  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include", // keep cookies (JWT cookie etc.)
    });
  } catch (err) {
    const hint =
      !API_BASE && typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
        ? " Set VITE_API_BASE in Vercel to your backend URL."
        : "";
    throw new Error(`Cannot reach Phase 5 API at ${url}.${hint}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const bodySnippet = await res.text().catch(() => "");
    const configHint =
      !API_BASE && typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
        ? " Set VITE_API_BASE in Vercel to your backend URL."
        : "";
    throw new Error(
      `API did not return JSON for ${url}. Check backend routing.${configHint} Response starts with: ${bodySnippet.slice(0, 80)}`
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}
