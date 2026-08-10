/** Converts string path segments to number if they represent array indices. */
export function toJsonPath(rawPath: string[]): (string | number)[] {
  return rawPath.map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}

/** Parses a user-entered raw string into the corresponding JSON value shape. */
export function parseInputValue(raw: string): string | number | boolean | null {
  const trimmed = raw.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (!Number.isNaN(Number(trimmed)) && trimmed !== "") {
    return Number(trimmed);
  }
  return raw;
}
