import { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { BackHandler, Platform, ToastAndroid, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import '@/i18n';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { GameProvider } from '@/context/GameContext';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const lastBackPressTimeRef = useRef<number>(0);

  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.ttf'),
    'BookkMyungjo_Bold': require('../../assets/fonts/BookkMyungjo_Bold.ttf'),
    'Lato-Regular': require('../../assets/fonts/Lato-Regular.ttf'),
    'Lato-Bold': require('../../assets/fonts/Lato-Bold.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('[Font] 폰트 로딩 실패:', fontError);
    } else if (fontsLoaded) {
      console.log('[Font] ✅ 폰트 로딩 성공 - Pretendard TTF');
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      const now = Date.now();
      if (lastBackPressTimeRef.current && now - lastBackPressTimeRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTimeRef.current = now;
      ToastAndroid.show(
        t('common.exit_confirm', { defaultValue: '한 번 더 누르면 종료됩니다' }),
        ToastAndroid.SHORT
      );
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandlerSubscription.remove();
  }, [t]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GameProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <AppTabs />
          </ThemeProvider>
        </GameProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
