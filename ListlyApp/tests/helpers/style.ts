/** Flattens RN style arrays/objects so tests can assert individual keys. */
export function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce((acc: Record<string, unknown>, item) => ({ ...acc, ...flattenStyle(item) }), {});
  }
  return (style ?? {}) as Record<string, unknown>;
}
