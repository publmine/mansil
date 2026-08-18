import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Triggers physical tactile/haptic feedback on native mobile devices
 * and falls back to navigator.vibrate on supporting web browsers.
 */
export const triggerHaptic = async (
  style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
) => {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        const duration = style === 'success' || style === 'heavy' ? 24 : 12;
        navigator.vibrate(duration);
      }
    } else {
      // Native Expo Haptics
      switch (style) {
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'light':
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
      }
    }
  } catch {
    // Fail silently in environments where Haptics are not supported
  }
};


/**
 * Plays a synthesized audio tone using Web Audio API on Web.
 * Gracefully falls back on Native platforms to prevent crashes.
 */
export const playSoundEffect = (
  freq: number,
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine',
  duration: number = 0.8
) => {
  // Sound effects disabled per user request
  return;
};
