import { createHash } from "node:crypto";

/**
 * Stable, collision-free article id: provider prefix plus a hash of the
 * full URL. (A truncated base64 of the URL is NOT enough - every Google
 * News link shares its first ~18 bytes, which once collapsed the whole
 * feed into one React key.)
 */
export function articleId(prefix: string, url: string): string {
  return `${prefix}-${createHash("sha256").update(url).digest("base64url").slice(0, 16)}`;
}
