export const decodeCursor = (cursor?: string): Record<string, unknown> | undefined => {
  if (!cursor) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch (error) {
    console.error('game-query: failed to decode cursor', { cursor });
    return undefined;
  }
}

export const encodeCursor = (key?: Record<string, unknown>): string | undefined => {
  if (!key) {
    return undefined;
  }
  return Buffer.from(JSON.stringify(key), 'utf-8').toString('base64');
}
