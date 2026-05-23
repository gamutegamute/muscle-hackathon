import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getProjectId() {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    undefined
  );
}

export async function getExpoPushToken(options?: { requestPermissionIfNeeded?: boolean }) {
  if (!Device.isDevice) {
    return undefined;
  }

  const timeoutPromise = new Promise<null>((_, reject) => {
    setTimeout(() => reject(new Error('getExpoPushToken timed out')), 3000);
  });

  const fetchTokenPromise = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    const requestPermissionIfNeeded = options?.requestPermissionIfNeeded ?? false;

    if (existingStatus !== 'granted') {
      if (!requestPermissionIfNeeded) {
        return null;
      }
      const permissionResponse = await Notifications.requestPermissionsAsync();
      finalStatus = permissionResponse.status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const projectId = getProjectId();
    if (!projectId) {
      throw new Error('Expo push notifications require EXPO_PUBLIC_EAS_PROJECT_ID or an EAS project configuration.');
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  };

  try {
    return await Promise.race([fetchTokenPromise(), timeoutPromise]);
  } catch (error) {
    console.warn('getExpoPushToken error/timeout:', error);
    return null;
  }
}

