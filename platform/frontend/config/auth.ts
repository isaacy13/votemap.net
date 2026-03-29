/**
 * OAuth configuration for Google and Apple authentication.
 * These values must be set via environment variables for production.
 */
export const authConfig = {
  google: {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  },
  apple: {
    serviceId: process.env.EXPO_PUBLIC_APPLE_SERVICE_ID ?? 'net.votemap.app',
  },
  x: {
    clientId: process.env.EXPO_PUBLIC_X_CLIENT_ID ?? '',
  },
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000',
};
