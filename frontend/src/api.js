const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || ""; 
// If VITE_API_BASE is "", requests go to same-origin (works with Vite proxy in dev)

export async function api(path, options = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // keep cookies (JWT cookie etc.)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}