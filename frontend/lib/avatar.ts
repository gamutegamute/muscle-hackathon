import { Platform } from 'react-native';

export function canRenderAvatarUri(uri?: string | null) {
  if (!uri) {
    return false;
  }

  const normalizedUri = uri.trim();
  if (!normalizedUri) {
    return false;
  }

  if (normalizedUri.startsWith('blob:')) {
    return Platform.OS === 'web';
  }

  return normalizedUri.startsWith('http://') || normalizedUri.startsWith('https://') || normalizedUri.startsWith('file://') || normalizedUri.startsWith('data:image/');
}
