export type ShortcutAction =
  | {
      type: 'start';
      deviceId: string;
    };

export function buildStartShortcutUrl(deviceId: string) {
  return `super798://start?did=${encodeURIComponent(deviceId)}`;
}

export function parseShortcutUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const scheme = url.protocol.replace(':', '').toLowerCase();

    if (scheme !== 'super798') {
      return null;
    }

    const actionName = (url.host || url.pathname.replace(/^\//, '')).toLowerCase();
    const deviceId = url.searchParams.get('did')?.trim() || '';

    if (actionName === 'start' && deviceId) {
      return {
        type: 'start',
        deviceId,
      } satisfies ShortcutAction;
    }

    return null;
  } catch {
    return null;
  }
}
