export const decodeCursor = (cursor?: string): Record<string, unknown> | undefined => {
  if (!cursor) {
    return undefined;
  }
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}

export const encodeCursor = (key?: Record<string, unknown>): string | undefined => {
  if (!key) {
    return undefined;
  }
  return Buffer.from(JSON.stringify(key), 'utf-8').toString('base64');
}