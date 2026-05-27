import { Platform } from 'react-native';

export function canRenderAvatarUri(uri?: string | null) {
  if (!uri) {
    return false;
  }

  if (uri.startsWith('blob:')) {
    return Platform.OS === 'web';
  }

  return uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('data:image/');
}
