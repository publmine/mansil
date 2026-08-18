import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SplashScreen } from 'expo-router';
import Animated, { Easing, Keyframe, useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';

const DURATION = 300;
const FIRST_SPLASH_KEY = '@greengrove_has_seen_first_splash_v1';

import { isEn } from '@/constants/healing-data';

export function AnimatedSplashOverlay() {
  const [mounted, setMounted] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(2500, withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }));
    
    const unmountTimer = setTimeout(() => {
      setMounted(false);
    }, 3000);

    return () => clearTimeout(unmountTimer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View style={[styles.splashOverlayContainer, animStyle]}>
      <Image
        source={isEn() ? require('@/assets/images/load_en.png') : require('@/assets/images/load.png')}
        style={styles.splashImage}
        contentFit="cover"
        onLoad={() => {
          SplashScreen.hideAsync();
        }}
      />
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: 0 }],
  },
  60: {
    transform: [{ scale: 1.2 }],
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(1.2),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
  },
  60: {
    transform: [{ scale: 1.2 }],
    opacity: 0,
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(1.2),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '-180deg' }, { scale: 0.8 }],
    opacity: 0,
  },
  [DURATION / 1000]: {
    transform: [{ rotateZ: '0deg' }, { scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={styles.background} entering={keyframe.duration(DURATION)}>
        <div className="expoLogoBackground" />
      </Animated.View>

      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlayContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#090a0c',
    zIndex: 99999,
    position: 'fixed' as any,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
