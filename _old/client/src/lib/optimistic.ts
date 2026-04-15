export function createOptimisticId(prefix: string) {
  return `optimistic:${prefix}:${crypto.randomUUID()}`;
}
