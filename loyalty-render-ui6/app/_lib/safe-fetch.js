export async function safeFetchJSON(input, init = {}) {
  const res = await fetch(input, init);
  const ctype = (res.headers.get("content-type") || "").toLowerCase();
  const isJSON = ctype.includes("application/json");
  if (!isJSON) {
    const text = await res.text();
    const snippet = text.slice(0, 300).replace(/\s+/g, " ").trim();
    const err = new Error(`Server returned non-JSON (${res.status}). Snippet: ${snippet}`);
    err.status = res.status; err.snippet = snippet;
    throw err;
  }
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed: ${res.status}`);
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}
