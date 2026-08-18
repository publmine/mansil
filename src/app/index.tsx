import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HealingColor, STEP_DETAILS_JSON, getHealingColors, getStepDetailsForSeason, getTemplateById, isEn } from '@/constants/healing-data';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ArchivedPlant, DiaryEntry, useGame } from '@/context/GameContext';
import { playSoundEffect } from '@/services/feedback';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import { styles } from './index.styles';

// Screen Dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(315, SCREEN_WIDTH - 36);
const WHEEL_SIZE = Math.min(360, SCREEN_WIDTH * 0.95);

// Reanimated floating firefly component
interface FireflyProps {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  onPress: () => void;
}

const FloatingFirefly: React.FC<FireflyProps> = ({ id, x, y, collected, onPress }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Elegant organic floating offsets using modulo seed to ensure lively 2-4s duration
    const seed = Math.abs(id) % 7;
    tx.value = withRepeat(
      withSequence(
        withTiming(18, { duration: 2400 + seed * 320, easing: Easing.inOut(Easing.sin) }),
        withTiming(-18, { duration: 2400 + seed * 320, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(-24, { duration: 2800 + seed * 280, easing: Easing.inOut(Easing.sin) }),
        withTiming(24, { duration: 2800 + seed * 280, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1800 + seed * 220, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.8, { duration: 1800 + seed * 220, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [id, scale, tx, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value }
    ]
  }));

  if (collected) return null;

  return (
    <Animated.View
      style={[
        styles.fireflyWrapper,
        { left: `${x}%`, top: `${y}%` },
        animatedStyle
      ]}
    >
      <Pressable onPress={onPress} style={styles.fireflyTouch}>
        {/* Glow halo levels */}
        <View style={styles.fireflyOuterGlow} />
        <View style={styles.fireflyMediumGlow} />
        <View style={styles.fireflyInnerGlow} />
        <View style={styles.fireflyCore} />
        <ThemedText style={styles.sparkleDeco}>✦</ThemedText>
      </Pressable>
    </Animated.View>
  );
};

// =========================================================================
// SANCTUARY ANIMATED CREATURES (나비, 벌, 새)
// =========================================================================
interface SanctuaryCreatureProps {
  id: number;
  startX: string | number;
  startY: string | number;
}

const SanctuaryButterfly: React.FC<SanctuaryCreatureProps> = ({ id, startX, startY }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scaleX = useSharedValue(1);

  useEffect(() => {
    const dur = 3500 + id * 800;
    tx.value = withRepeat(
      withSequence(
        withTiming(40 + id * 10, { duration: dur }),
        withTiming(-40 - id * 10, { duration: dur })
      ),
      -1, true
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: dur * 0.5 }),
        withTiming(12, { duration: dur * 0.7 }),
        withTiming(-8, { duration: dur * 0.5 })
      ),
      -1, true
    );
    // Wing flap
    scaleX.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 250 }),
        withTiming(1, { duration: 250 })
      ),
      -1, true
    );
  }, [id, tx, ty, scaleX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scaleX: scaleX.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: startX as any, top: startY as any, zIndex: 50 }, animStyle]}
    >
      <ThemedText style={{ fontSize: 22 }}>🦋</ThemedText>
    </Animated.View>
  );
};

const SanctuaryBee: React.FC<SanctuaryCreatureProps> = ({ id, startX, startY }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    const dur = 2200 + id * 500;
    tx.value = withRepeat(
      withSequence(
        withTiming(15 + id * 6, { duration: dur * 0.4 }),
        withTiming(-15 - id * 4, { duration: dur * 0.4 }),
        withTiming(5, { duration: dur * 0.2 })
      ),
      -1, true
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: dur * 0.3 }),
        withTiming(12, { duration: dur * 0.4 }),
        withTiming(-4, { duration: dur * 0.3 })
      ),
      -1, true
    );
  }, [id, tx, ty]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: startX as any, top: startY as any, zIndex: 50 }, animStyle]}
    >
      <ThemedText style={{ fontSize: 19 }}>🐝</ThemedText>
    </Animated.View>
  );
};

// SVG Bird illustration - 100% visible on all platforms
const SanctuaryBirdSvg: React.FC = () => (
  <Svg width="40" height="34" viewBox="0 0 40 34">
    <Defs>
      <LinearGradient id="sBirdBodyGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FF6B81" />
        <Stop offset="100%" stopColor="#FF4757" />
      </LinearGradient>
      <LinearGradient id="sBirdWingGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFA502" />
        <Stop offset="100%" stopColor="#FF7F50" />
      </LinearGradient>
    </Defs>
    {/* Tail feathers */}
    <Path d="M4,20 L-2,14 L6,16 L-1,9 L8,14 Z" fill="#FF4757" />
    {/* Main Body */}
    <Ellipse cx="20" cy="20" rx="14" ry="11" fill="url(#sBirdBodyGrad)" />
    {/* Head */}
    <Circle cx="29" cy="12" r="8" fill="url(#sBirdBodyGrad)" />
    {/* Eye */}
    <Circle cx="31" cy="11" r="1.8" fill="#FFFFFF" />
    <Circle cx="31.8" cy="11" r="0.9" fill="#1E272E" />
    {/* Beak */}
    <Polygon points="36,12 41,14 36,17" fill="#ECCC68" />
    {/* Wing */}
    <Path d="M13,20 C15,13 24,13 26,20 C22,24 15,23 13,20 Z" fill="url(#sBirdWingGrad)" />
    {/* Cute belly */}
    <Path d="M20,24 C24,24 28,21 27,18 C24,19 20,22 20,24 Z" fill="#FFEAA7" opacity="0.85" />
  </Svg>
);

const SanctuaryBird: React.FC<SanctuaryCreatureProps> = ({ id, startX, startY }) => {
  const headNod = useSharedValue(0);
  const chirpOpacity = useSharedValue(0);

  useEffect(() => {
    headNod.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 180 }),
        withTiming(0, { duration: 180 }),
        withTiming(-2, { duration: 150 }),
        withTiming(0, { duration: 150 }),
        withTiming(0, { duration: 2500 + id * 1200 })
      ),
      -1, false
    );

    chirpOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 500 }),
        withTiming(0, { duration: 2200 + id * 1200 })
      ),
      -1, false
    );
  }, [id, headNod, chirpOpacity]);

  const birdStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headNod.value }],
  }));

  const noteStyle = useAnimatedStyle(() => ({
    opacity: chirpOpacity.value,
    transform: [{ translateY: headNod.value - 12 }, { translateX: 8 }],
  }));

  const emojiFont = Platform.OS === 'web'
    ? { fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' }
    : {};

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: startX as any, top: startY as any, zIndex: 999 }}
    >
      {/* Floating music note above head */}
      <Animated.View style={[{ position: 'absolute', top: -14, left: 18 }, noteStyle]}>
        <Text style={[{ fontSize: 13, color: '#FFD580' }, emojiFont]}>🎶</Text>
      </Animated.View>

      {/* Perching Blue Bird SVG Illustration */}
      <Animated.View style={birdStyle}>
        <Svg width="36" height="32" viewBox="0 0 36 32">
          <Defs>
            <LinearGradient id="perchBirdBody" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#70A1FF" />
              <Stop offset="100%" stopColor="#1E90FF" />
            </LinearGradient>
            <LinearGradient id="perchBirdWing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#5352ED" />
              <Stop offset="100%" stopColor="#3742FA" />
            </LinearGradient>
          </Defs>
          {/* Tail */}
          <Path d="M4,18 L-2,13 L5,15 L-1,8 L7,13 Z" fill="#3742FA" />
          {/* Body */}
          <Ellipse cx="18" cy="18" rx="12" ry="9" fill="url(#perchBirdBody)" />
          {/* Head */}
          <Circle cx="25" cy="11" r="7" fill="url(#perchBirdBody)" />
          {/* Eye */}
          <Circle cx="27" cy="10" r="1.6" fill="#FFFFFF" />
          <Circle cx="27.6" cy="10" r="0.8" fill="#1E272E" />
          {/* Beak */}
          <Polygon points="32,11 37,13 32,15" fill="#FFA502" />
          {/* Wing */}
          <Path d="M12,18 C14,12 21,12 23,18 C19,21 14,20 12,18 Z" fill="url(#perchBirdWing)" />
          {/* Belly soft glow */}
          <Path d="M18,21 C21,21 25,19 24,16 C21,17 18,19 18,21 Z" fill="#FFEAA7" opacity="0.8" />
        </Svg>
      </Animated.View>
    </View>
  );
};

// Essence Beaker component with elegant filling animation
interface BeakerProps {
  colorItem: HealingColor;
  ratio: number;
}

const EssenceBeaker: React.FC<BeakerProps> = ({ colorItem, ratio }) => {
  const animatedRatio = useSharedValue(0);

  useEffect(() => {
    animatedRatio.value = withTiming(ratio, { duration: 600 });
  }, [ratio, animatedRatio]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${animatedRatio.value}%`,
  }));

  return (
    <View style={styles.beakerCol}>
      <ThemedText type="smallBold" style={{ color: colorItem.hex, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>
        {colorItem.name}
      </ThemedText>

      <View style={styles.beakerOuter}>
        <View style={styles.beakerLip} />
        <Animated.View
          style={[
            styles.beakerLiquidFill,
            {
              backgroundColor: colorItem.hex,
              shadowColor: colorItem.hex
            },
            ratio > 0 && styles.glowingShadow,
            animatedStyle
          ]}
        >
          {/* Glowing Top Surface Gradient Meniscus Fading Upwards */}
          {ratio > 0 && (
            Platform.OS === 'web' ? (
              <svg width="100%" height="20" style={styles.beakerGlowSvg}>
                <Defs>
                  <LinearGradient id={`glow-${colorItem.hex.replace('#', '')}`} x1="0%" y1="100%" x2="0%" y2="0%">
                    <Stop offset="0%" stopColor={colorItem.hex} stopOpacity="0.5" />
                    <Stop offset="50%" stopColor={colorItem.hex} stopOpacity="0.1" />
                    <Stop offset="100%" stopColor={colorItem.hex} stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <rect width="100%" height="20" fill={`url(#glow-${colorItem.hex.replace('#', '')})`} />
              </svg>
            ) : (
              <Svg width="100%" height="20" style={styles.beakerGlowSvg}>
                <Defs>
                  <LinearGradient id={`glow-${colorItem.hex.replace('#', '')}`} x1="0%" y1="1" x2="0%" y2="0%">
                    <Stop offset="0%" stopColor={colorItem.hex} stopOpacity="0.8" />
                    <Stop offset="0.5" stopColor={colorItem.hex} stopOpacity="0.3" />
                    <Stop offset="1" stopColor={colorItem.hex} stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="20" fill={`url(#glow-${colorItem.hex.replace('#', '')})`} />
              </Svg>
            )
          )}
        </Animated.View>
      </View>
      <ThemedText type="smallBold" style={styles.beakerValText}>{ratio}%</ThemedText>
    </View>
  );
};

// =========================================================================
// GLOWING LEVEL 5 BLOSSOM & SPARKLING PARTICLES
// =========================================================================

interface SparkleProps {
  delay: number;
  startX: string;
  color: string;
}

const SparkleParticle: React.FC<SparkleProps> = ({ delay, startX, color }) => {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    let active = true;
    const runAnimation = () => {
      if (!active) return;
      ty.value = 0;
      opacity.value = 0;
      scale.value = 0.4;

      setTimeout(() => {
        if (!active) return;
        opacity.value = withTiming(0.8, { duration: 800 });
        ty.value = withTiming(-65, { duration: 2500 }, () => {
          opacity.value = withTiming(0, { duration: 600 });
        });
        scale.value = withTiming(1.3, { duration: 1800 });

        setTimeout(runAnimation, 3100);
      }, delay);
    };

    runAnimation();
    return () => {
      active = false;
    };
  }, [delay, ty, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: ty.value },
      { scale: scale.value }
    ],
    opacity: opacity.value
  }));

  return (
    <Animated.View
      style={[
        styles.sparkleParticle,
        { left: startX as any },
        animatedStyle
      ]}
    >
      {/* Cross-platform glow: layered radial rings */}
      <View style={{ position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: color + '18', top: -8.5, left: -8.5 }} />
      <View style={{ position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: color + '30', top: -3.5, left: -3.5 }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ffffff', fontSize: 5, fontWeight: 'bold', includeFontPadding: false }}>✦</Text>
      </View>
    </Animated.View>
  );
};

const SparkleStream: React.FC<{ color: string; colors?: string[] }> = ({ color, colors }) => {
  const getSparkleColor = (index: number) => {
    if (colors && colors.length > 0) {
      return colors[index % colors.length];
    }
    return color;
  };

  return (
    <View pointerEvents="none" style={styles.sparkleStreamContainer}>
      <SparkleParticle delay={0} startX="15%" color={getSparkleColor(0)} />
      <SparkleParticle delay={700} startX="38%" color={getSparkleColor(1)} />
      <SparkleParticle delay={1400} startX="62%" color={getSparkleColor(2)} />
      <SparkleParticle delay={2100} startX="85%" color={getSparkleColor(3)} />
    </View>
  );
};

const WheelPulseGlow: React.FC = () => {
  const pulseScale = useSharedValue(1.0);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.38, { duration: 1600, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(0, { duration: 1600, easing: Easing.out(Easing.quad) })
      ),
      -1,
      false
    );
  }, [pulseScale, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: '82%',
          height: '82%',
          borderRadius: 100,
          backgroundColor: '#9DBA7D',
          shadowColor: '#9DBA7D',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 16,
        },
        animatedStyle,
      ]}
    />
  );
};

interface GlowingBlossomProps {
  type: string;
  color: string;
  colors?: string[];
  disableInternalSparkles?: boolean;
}

const GlowingBlossom: React.FC<GlowingBlossomProps> = React.memo(({ type, color, colors, disableInternalSparkles = false }) => {
  const rotation = useSharedValue(0);
  const breath = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    // Slow therapeutic rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 22000, easing: Easing.linear }),
      -1,
      false
    );

    // Natural organic breathing cycle
    breath.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2800 }),
        withTiming(0.94, { duration: 2800 })
      ),
      -1,
      true
    );

    // Glowing pulsation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1800 }),
        withTiming(0.35, { duration: 1800 })
      ),
      -1,
      true
    );
  }, [rotation, breath, glowOpacity]);

  const blossomStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: breath.value }
    ]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: breath.value * 1.15 }]
  }));

  const getPetalColor = (index: number) => {
    if (colors && colors.length > 0) {
      const len = colors.length;
      if (len === 5) {
        // Premium distribution for full 5 steps to create a beautiful color wheel
        const map5 = [0, 1, 2, 2, 3, 4, 4, 0];
        return colors[map5[index]];
      }
      return colors[index % len];
    }
    return color;
  };

  const coreColor1 = colors && colors.length > 0 ? colors[0] : color;

  return (
    <View style={styles.blossomWrapper}>
      {/* Cross-platform glow: layered semi-transparent rings */}
      <Animated.View style={[{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: coreColor1 + '15', zIndex: 0 }, glowStyle]} />
      <Animated.View style={[{ position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: coreColor1 + '25', zIndex: 0 }, glowStyle]} />
      <Animated.View
        style={[
          styles.blossomGlowAura,
          { backgroundColor: coreColor1 + 'AA' },
          glowStyle
        ]}
      />

      {/* Blossom SVG Container */}
      <Animated.View style={[styles.blossomSvgWrapper, blossomStyle]}>
        <Svg width="120" height="120" viewBox="0 0 100 100">
          {/* Outer Mystical Teardrop Petals (Symmetrical overlapping spectrum) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const rot = i * 45;
            return (
              <Path
                key={i}
                d="M50,50 C30,32 34,15 50,12 C66,15 70,32 50,50 Z"
                fill={getPetalColor(i)}
                opacity={0.65}
                transform={`rotate(${rot}, 50, 50)`}
              />
            );
          })}

          {/* Center Glowing White/Golden Donut Core */}
          <Circle cx="50" cy="50" r="16" fill="#ffffff" opacity={0.15} />
          <Circle cx="50" cy="50" r="13" fill="#FFEAA7" opacity={0.35} />

          {/* Glowing Ring */}
          <Circle cx="50" cy="50" r="9.5" fill="none" stroke="#ffffff" strokeWidth="2.8" />

          {/* Inner gold core */}
          <Circle cx="50" cy="50" r="7" fill="#FFEAA7" opacity={0.75} />
          <Circle cx="50" cy="50" r="4.2" fill="#ffffff" opacity={0.95} />
        </Svg>
      </Animated.View>

      {/* Magic Sparkle particles (disabled in dense 27-flower view for maximum performance) */}
      {!disableInternalSparkles && <SparkleStream color={color} colors={colors} />}
    </View>
  );
});

// Animated Color Circle component for bouncy tactile feedback on fill
interface AnimatedColorCircleProps {
  color: string | null;
  size: number;
  glowSize?: number;
  style?: any;
}

const AnimatedColorCircle: React.FC<AnimatedColorCircleProps> = React.memo(({ color, size, glowSize = 16, style }) => {
  const scale = useSharedValue(color ? 1 : 0.8);

  useEffect(() => {
    if (color) {
      scale.value = withSequence(
        withTiming(0.2, { duration: 0 }),
        withTiming(1.3, { duration: 250 }),
        withTiming(1.0, { duration: 150 })
      );
    } else {
      scale.value = withTiming(1.0, { duration: 200 });
    }
  }, [color, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Cross-platform glow rings */}
      {color && (
        <>
          <View style={[style, { position: 'absolute', backgroundColor: color + '25', transform: [{ scale: 1.6 }] }]} />
          <View style={[style, { position: 'absolute', backgroundColor: color + '40', transform: [{ scale: 1.3 }] }]} />
        </>
      )}
      <Animated.View
        style={[
          style,
          { backgroundColor: color || '#161a29' },
          animatedStyle
        ]}
      />
    </View>
  );
});

const Lv5GlowCircle = React.memo(({ left, top, color, delay = 0 }: { left: number; top: number; color: string; delay?: number }) => {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    ty.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200 + delay }),
        withTiming(8, { duration: 2200 + delay })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 + delay }),
        withTiming(0.4, { duration: 1800 + delay })
      ),
      -1,
      true
    );
  }, [delay, ty, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: left - 8, top: top - 8, width: 22, height: 22, borderRadius: 11, zIndex: 20, justifyContent: 'center', alignItems: 'center' }, animatedStyle]}
    >
      {/* Cross-platform glow rings */}
      <View style={{ position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: color + '20' }} />
      <View style={{ position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: color + '40' }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
    </Animated.View>
  );
});

interface CardSparkleProps {
  id: number;
  left: number;
  top: number;
  size?: number;
}

const FloatingCardSparkle: React.FC<CardSparkleProps> = React.memo(({ id, left, top, size = 6 }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    tx.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2600 + id * 250 }),
        withTiming(-10, { duration: 2600 + id * 250 })
      ),
      -1,
      true
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 3000 + id * 200 }),
        withTiming(12, { duration: 3000 + id * 200 })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000 + id * 150 }),
        withTiming(0.8, { duration: 2000 + id * 150 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2400 + id * 300 }),
        withTiming(0.3, { duration: 2400 + id * 300 })
      ),
      -1,
      true
    );
  }, [id, scale, tx, ty, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value }
    ],
    opacity: opacity.value
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: left - size,
          top: top - size,
          width: size * 3,
          height: size * 3,
          zIndex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        animatedStyle
      ]}
    >
      {/* Cross-platform glow rings */}
      <View style={{ position: 'absolute', width: size * 3, height: size * 3, borderRadius: size * 1.5, backgroundColor: 'rgba(255,234,167,0.10)' }} />
      <View style={{ position: 'absolute', width: size * 2, height: size * 2, borderRadius: size, backgroundColor: 'rgba(255,234,167,0.20)' }} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFEAA7' }} />
      <ThemedText
        style={{
          position: 'absolute',
          left: size * 1.5 - size * 0.75,
          top: -size * 0.5,
          fontSize: size * 1.5,
          color: '#FFEAA7',
          fontWeight: 'bold',
          opacity: 0.75
        }}
      >
        ✦
      </ThemedText>
    </Animated.View>
  );
});

/* ============================================================================ */
/* GREENHOUSE WARM LIGHT MOTION (온실 유리 아치문에서 새어나오는 따스한 빛 모션) */
/* ============================================================================ */
const GreenhouseWarmLightMotion: React.FC = () => {
  const archPulseOpacity = useSharedValue(0.35);
  const archPulseScale = useSharedValue(0.94);
  const spillPulseOpacity = useSharedValue(0.20);
  const spillPulseScale = useSharedValue(0.96);

  useEffect(() => {
    archPulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 3800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    archPulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.94, { duration: 4200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    spillPulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.50, { duration: 4600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.20, { duration: 4600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    spillPulseScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.96, { duration: 5200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [archPulseOpacity, archPulseScale, spillPulseOpacity, spillPulseScale]);

  const archStyle = useAnimatedStyle(() => ({
    opacity: archPulseOpacity.value,
    transform: [{ scale: archPulseScale.value }],
  }));

  const spillStyle = useAnimatedStyle(() => ({
    opacity: spillPulseOpacity.value,
    transform: [{ scale: spillPulseScale.value }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* 1. Organic Warm Arch Light Bloom (중앙 유리 아치문 웜골드 원형 아우라) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: '50%',
            top: '8%',
            marginLeft: -170,
            width: 340,
            height: 340,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          },
          archStyle,
        ]}
      >
        <Svg width="340" height="340" viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="archSoftGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFDE7" stopOpacity="0.85" />
              <Stop offset="25%" stopColor="#FFE082" stopOpacity="0.55" />
              <Stop offset="55%" stopColor="#FFB300" stopOpacity="0.22" />
              <Stop offset="80%" stopColor="#FF8F00" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#FF6F00" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="98" fill="url(#archSoftGlow)" />
        </Svg>
      </Animated.View>

      {/* 2. Seamless Vertical Ambient Light Spill (문 아래와 화단으로 스며드는 유기적 타원 빛번짐) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: '50%',
            top: '15%',
            marginLeft: -210,
            width: 420,
            height: 380,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 11,
          },
          spillStyle,
        ]}
      >
        <Svg width="420" height="380" viewBox="0 0 220 200">
          <Defs>
            <RadialGradient id="spillSoftGlow" cx="50%" cy="35%" r="50%">
              <Stop offset="0%" stopColor="#FFF59D" stopOpacity="0.60" />
              <Stop offset="35%" stopColor="#FFE082" stopOpacity="0.30" />
              <Stop offset="70%" stopColor="#FFC107" stopOpacity="0.10" />
              <Stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="110" cy="100" rx="105" ry="95" fill="url(#spillSoftGlow)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

/* ============================================================================ */
/* SANCTUARY BUSH FIREFLIES (양쪽 수풀 사이에서 춤추는 반딧불이 모션) */
/* ============================================================================ */
const SanctuaryBushFireflies: React.FC = () => {
  const bushFireflies = [
    // Left upper bush (왼쪽 상단 수풀 4개)
    { id: 201, x: 8, y: 24 },
    { id: 202, x: 16, y: 18 },
    { id: 203, x: 22, y: 28 },
    { id: 204, x: 12, y: 34 },
    // Right upper bush (오른쪽 상단 수풀 4개)
    { id: 205, x: 78, y: 22 },
    { id: 206, x: 84, y: 18 },
    { id: 207, x: 90, y: 28 },
    { id: 208, x: 82, y: 34 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bushFireflies.map((f) => (
        <FloatingFirefly
          key={f.id}
          id={f.id}
          x={f.x}
          y={f.y}
          collected={false}
          onPress={() => { }}
        />
      ))}
    </View>
  );
};

/* ============================================================================ */
/* MEMOIZED SANCTUARY 27 FLOWERS LAYER (살랑살랑 밤바람 스윙 & 영구 부드러운 힐링 모션) */
/* ============================================================================ */
const SANCTUARY_FLOWER_POSITIONS = [
  // [원경: 아치 & 온실 뒤편 수풀 라인 - 소형 8송이]
  { x: 10, y: 39, s: 0.30, idx: 0 },
  { x: 21, y: 42, s: 0.32, idx: 1 },
  { x: 32, y: 40, s: 0.31, idx: 2 },
  { x: 44, y: 43, s: 0.35, idx: 3 },
  { x: 56, y: 39, s: 0.33, idx: 4 },
  { x: 67, y: 42, s: 0.34, idx: 5 },
  { x: 79, y: 40, s: 0.32, idx: 6 },
  { x: 90, y: 41, s: 0.30, idx: 7 },

  // [중경: 화단 언덕 & 정원 허리 비탈 라인 - 중형 10송이]
  { x: 8, y: 50, s: 0.42, idx: 8 },
  { x: 17, y: 48, s: 0.44, idx: 9 },
  { x: 27, y: 53, s: 0.46, idx: 10 },
  { x: 37, y: 49, s: 0.47, idx: 11 },
  { x: 47, y: 55, s: 0.48, idx: 12 },
  { x: 55, y: 50, s: 0.48, idx: 13 },
  { x: 64, y: 54, s: 0.47, idx: 14 },
  { x: 74, y: 49, s: 0.46, idx: 15 },
  { x: 83, y: 53, s: 0.44, idx: 16 },
  { x: 92, y: 49, s: 0.41, idx: 17 },

  // [전경: 앞마당 & 화사한 만개 꽃길 라인 - 대형 9송이]
  { x: 12, y: 62, s: 0.53, idx: 18 },
  { x: 22, y: 68, s: 0.57, idx: 19 },
  { x: 33, y: 63, s: 0.55, idx: 20 },
  { x: 43, y: 70, s: 0.60, idx: 21 },
  { x: 52, y: 64, s: 0.56, idx: 22 },
  { x: 62, y: 71, s: 0.60, idx: 23 },
  { x: 72, y: 64, s: 0.56, idx: 24 },
  { x: 82, y: 69, s: 0.55, idx: 25 },
  { x: 90, y: 62, s: 0.51, idx: 26 },
];

interface SanctuaryBlossomProps {
  type: string;
  color: string;
  colors?: string[];
  idx: number;
}

const SanctuaryBlossom: React.FC<SanctuaryBlossomProps> = React.memo(({ type, color, colors, idx }) => {
  const sway = useSharedValue(0);
  const breath = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    // 1. 밤바람에 좌우로 살랑살랑 흔들리는 유기적 스윙 (-12도 ~ +12도)
    // 꽃마다 시간차(stagger)와 미세한 주기 차이를 주어 꽃밭에 물결치는 밤바람 연출
    const swayDuration = 2400 + (idx % 5) * 200;
    const swayDelay = (idx % 7) * 220;

    sway.value = withDelay(
      swayDelay,
      withRepeat(
        withSequence(
          withTiming(12, { duration: swayDuration, easing: Easing.inOut(Easing.sin) }),
          withTiming(-12, { duration: swayDuration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // 2. 유기적 숨쉬기 펄스 (리셋 순간 없는 영구 왕복 루프)
    const breathDuration = 2800 + (idx % 4) * 200;
    breath.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: breathDuration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.94, { duration: breathDuration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // 3. 은은한 빛 펄스
    const glowDuration = 1800 + (idx % 3) * 300;
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: glowDuration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: glowDuration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [idx, sway, breath, glowOpacity]);

  const blossomStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${sway.value}deg` },
      { scale: breath.value }
    ]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: breath.value * 1.15 }]
  }));

  const getPetalColor = (index: number) => {
    if (colors && colors.length > 0) {
      const len = colors.length;
      if (len === 5) {
        const map5 = [0, 1, 2, 2, 3, 4, 4, 0];
        return colors[map5[index]];
      }
      return colors[index % len];
    }
    return color;
  };

  const coreColor1 = colors && colors.length > 0 ? colors[0] : color;

  return (
    <View style={styles.blossomWrapper}>
      {/* Cross-platform glow rings */}
      <Animated.View style={[{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: coreColor1 + '15', zIndex: 0 }, glowStyle]} />
      <Animated.View style={[{ position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: coreColor1 + '25', zIndex: 0 }, glowStyle]} />
      <Animated.View
        style={[
          styles.blossomGlowAura,
          { backgroundColor: coreColor1 + 'AA' },
          glowStyle
        ]}
      />

      {/* Blossom SVG Container */}
      <Animated.View style={[styles.blossomSvgWrapper, blossomStyle]}>
        <Svg width="120" height="120" viewBox="0 0 100 100">
          {Array.from({ length: 8 }).map((_, i) => {
            const rot = i * 45;
            return (
              <Path
                key={i}
                d="M50,50 C30,32 34,15 50,12 C66,15 70,32 50,50 Z"
                fill={getPetalColor(i)}
                opacity={0.65}
                transform={`rotate(${rot}, 50, 50)`}
              />
            );
          })}

          <Circle cx="50" cy="50" r="16" fill="#ffffff" opacity={0.15} />
          <Circle cx="50" cy="50" r="13" fill="#FFEAA7" opacity={0.35} />
          <Circle cx="50" cy="50" r="9.5" fill="none" stroke="#ffffff" strokeWidth="2.8" />
          <Circle cx="50" cy="50" r="7" fill="#FFEAA7" opacity={0.75} />
          <Circle cx="50" cy="50" r="4.2" fill="#ffffff" opacity={0.95} />
        </Svg>
      </Animated.View>
    </View>
  );
});

const SanctuaryFlowerItem: React.FC<{
  pos: typeof SANCTUARY_FLOWER_POSITIONS[0];
  archItem?: ArchivedPlant;
}> = React.memo(({ pos, archItem }) => {
  const fc = archItem?.colors?.[archItem.colors.length - 1]
    || (['#FF758C', '#4ADE80', '#FBBF24', '#A855F7', '#60A5FA'][pos.idx % 5]);
  const fc0 = archItem?.colors?.[0] || fc;
  const allColors = archItem?.colors || [fc, '#8BE9FD', '#BD93F9', '#FFB86C', fc];

  return (
    <View
      style={{
        position: 'absolute',
        left: `${pos.x}%` as any,
        top: `${pos.y}%` as any,
        marginLeft: -40,
        width: 80,
        alignItems: 'center',
        flexDirection: 'column',
        transform: [{ scale: pos.s }],
      }}
    >
      {/* Glow halos & sparkles (시차 분산 렌더링) */}
      <Lv5GlowCircle left={-8} top={8} color="#FFF275" delay={(pos.idx % 3) * 350} />
      <Lv5GlowCircle left={62} top={3} color={fc0} delay={(pos.idx % 3) * 350 + 500} />
      <FloatingCardSparkle id={pos.idx * 3 + 1} left={-14} top={18} size={4} />
      <FloatingCardSparkle id={pos.idx * 3 + 2} left={76} top={12} size={4} />

      {/* Flower head with natural gentle wind sway */}
      <View style={{ width: 80, height: 85 }}>
        <SanctuaryBlossom
          type={archItem?.type || 'yellow'}
          color={fc}
          colors={allColors}
          idx={pos.idx}
        />
      </View>

      {/* Stem with cute sprout leaves */}
      <Svg width="50" height="48" viewBox="0 0 50 48" style={{ marginTop: -4 }}>
        <Defs>
          <LinearGradient id={`sL${pos.idx}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#81C784" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#388E3C" stopOpacity="0.9" />
          </LinearGradient>
          <LinearGradient id={`sR${pos.idx}`} x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#81C784" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#388E3C" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>
        <Line x1="25" y1="0" x2="25" y2="48" stroke="#2E7D32" strokeWidth="2.6" strokeLinecap="round" />
        <Path d="M25,26 C15,21 6,15 5,21 C4,27 16,31 25,26 Z" fill={`url(#sL${pos.idx})`} stroke="#1B5E20" strokeWidth="0.8" />
        <Path d="M25,26 C35,21 44,15 45,21 C46,27 34,31 25,26 Z" fill={`url(#sR${pos.idx})`} stroke="#1B5E20" strokeWidth="0.8" />
        <Path d="M25,26 Q15,22 6,20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <Path d="M25,26 Q35,22 44,20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      </Svg>
    </View>
  );
});

const SanctuaryFlowersLayer: React.FC<{ archive: ArchivedPlant[] }> = React.memo(({ archive }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SANCTUARY_FLOWER_POSITIONS.map((pos) => (
        <SanctuaryFlowerItem
          key={pos.idx}
          pos={pos}
          archItem={archive[pos.idx]}
        />
      ))}
    </View>
  );
});

const STEP_DETAILS: {
  [key: number]: {
    subtitle?: string;
    title: string;
    message: string;
    question: string | null;
    questions?: string[] | null;
    hashtags: string;
  };
} = STEP_DETAILS_JSON as any;

interface MiniBlossomLogoProps {
  size?: number;
  style?: any;
}

const MiniBlossomLogo: React.FC<MiniBlossomLogoProps> = ({ size = 24, style }) => {
  const logoPetals = [
    '#ff79c6', // Pink
    '#ff5555', // Red
    '#ffb86c', // Orange
    '#f1fa8c', // Yellow
    '#9DBA7D', // Green
    '#8be9fd', // Blue
    '#BD93F9', // Purple
    '#6272a4', // Indigo
  ];

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* 8 Overlapping Teardrop Petals */}
        {logoPetals.map((color, i) => {
          const rot = i * 45;
          return (
            <Path
              key={i}
              d="M50,50 C30,32 34,15 50,12 C66,15 70,32 50,50 Z"
              fill={color}
              opacity={0.8}
              transform={`rotate(${rot}, 50, 50)`}
            />
          );
        })}
        {/* Glowing Center Core */}
        <Circle cx="50" cy="50" r="16" fill="#ffffff" opacity={0.25} />
        <Circle cx="50" cy="50" r="12" fill="#FFEAA7" opacity={0.45} />
        <Circle cx="50" cy="50" r="9.5" fill="none" stroke="#ffffff" strokeWidth="2.8" />
        <Circle cx="50" cy="50" r="7" fill="#FFEAA7" opacity={0.85} />
        <Circle cx="50" cy="50" r="4.2" fill="#ffffff" opacity={0.98} />
      </Svg>
    </View>
  );
};

const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
};

// =========================================================================
const FloatingButterfly: React.FC<{ id: number; startX: number; startY: number }> = ({ id, startX, startY }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const flyX = useSharedValue(0);
  const flyY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const wingFlap = useSharedValue(1);

  useEffect(() => {
    // 공중 미세 잔흔들림
    tx.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-15, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(14, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 600 }),
        withTiming(-12, { duration: 600 })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(0.88, { duration: 650 }),
        withTiming(0.75, { duration: 650 })
      ),
      -1,
      true
    );

    // 날개 파닥파닥 펄럭임 모션 (140ms 주기)
    wingFlap.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 140, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 140, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // 화면 중앙(48%) 기준 좌우 밸런스 비행 (좌측 치우침 완전 해소: -35px ~ +95px)
    const targets = [
      { x: 0, y: -10 },   // 중앙 상단
      { x: 75, y: 15 },   // 우측 상단
      { x: 35, y: -25 },  // 중앙 우측
      { x: -35, y: 10 },  // 좌측 중앙
      { x: 90, y: 5 },    // 우측 가든
    ];
    let step = 0;

    const navInterval = setInterval(() => {
      step = (step + 1) % targets.length;
      const target = targets[step];
      flyX.value = withTiming(target.x, { duration: 5500, easing: Easing.inOut(Easing.sin) });
      flyY.value = withTiming(target.y, { duration: 5500, easing: Easing.inOut(Easing.sin) });
    }, 7500);

    return () => clearInterval(navInterval);
  }, [flyX, flyY, id, rotate, scale, tx, ty, wingFlap]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + flyX.value + startX },
      { translateY: ty.value + flyY.value + startY },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value }
    ],
  }));

  const wingFlapStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: wingFlap.value }
    ]
  }));

  const colors = [
    ['#FF79C6', '#BD93F9'],
    ['#FFB86C', '#FF5555'],
    ['#8BE9FD', '#50FA7B'],
    ['#F1FA8C', '#FF79C6'],
  ];
  const [wing1, wing2] = colors[id % colors.length];

  return (
    <Animated.View style={[{ position: 'absolute' }, animStyle]} pointerEvents="none">
      <Animated.View style={wingFlapStyle}>
        <Svg width={36} height={28} viewBox="0 0 36 28">
          {/* Left wings */}
          <Path d="M18,14 C10,6 2,2 2,10 C2,16 10,18 18,14 Z" fill={wing1} opacity={0.85} />
          <Path d="M18,14 C8,16 2,24 6,26 C12,28 16,22 18,14 Z" fill={wing1} opacity={0.7} />
          {/* Right wings */}
          <Path d="M18,14 C26,6 34,2 34,10 C34,16 26,18 18,14 Z" fill={wing2} opacity={0.85} />
          <Path d="M18,14 C28,16 34,24 30,26 C24,28 20,22 18,14 Z" fill={wing2} opacity={0.7} />
          {/* Body */}
          <Path d="M18,8 L18,22" stroke="#1A1C2A" strokeWidth={1.5} strokeLinecap="round" />
          {/* Antennae */}
          <Path d="M18,8 Q14,4 12,2" stroke="#1A1C2A" strokeWidth={0.8} fill="none" />
          <Path d="M18,8 Q22,4 24,2" stroke="#1A1C2A" strokeWidth={0.8} fill="none" />
          <Circle cx={12} cy={2} r={1.2} fill={wing1} />
          <Circle cx={24} cy={2} r={1.2} fill={wing2} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};

// =========================================================================
// FLOATING BEE COMPONENT
// =========================================================================
const FloatingBee: React.FC<{ id: number; startX: number; startY: number }> = ({ id, startX, startY }) => {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const wingFlap = useSharedValue(1);

  useEffect(() => {
    // 반전/뒤집기 없이 꽃 주변을 꿀을 모으듯 자연스럽게 제자리 호버링(Hovering)하는 비행
    tx.value = withRepeat(
      withSequence(
        withTiming(startX - 14, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(startX + 8, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(startX - 6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(startX, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    ty.value = withRepeat(
      withSequence(
        withTiming(startY - 12, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(startY + 10, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(startY - 5, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(startY, { duration: 2200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    // 꽃을 바라보며 갸웃거리는 미세한 꿀벌의 각도 변화
    rotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // 초고속 웅웅 날개짓 (60ms)
    wingFlap.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 60, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 60, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [id, rotate, scale, startX, startY, tx, ty, wingFlap]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value }
    ],
  }));

  const wingAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: wingFlap.value }]
  }));

  return (
    <Animated.View style={[{ position: 'absolute', alignItems: 'center' }, animStyle]} pointerEvents="none">
      {/* Fast Buzzing Wings - Delicate, Small & Transparent */}
      <Animated.View style={[{ position: 'absolute', top: -5, zIndex: 2 }, wingAnimStyle]}>
        <Svg width={26} height={14} viewBox="0 0 26 14">
          {/* Left Wing */}
          <Path d="M13,13 C9,3 2,2 5,10 C8,13 11,13 13,13 Z" fill="rgba(240, 249, 255, 0.48)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth={0.7} />
          {/* Right Wing */}
          <Path d="M13,13 C17,3 24,2 21,10 C18,13 15,13 13,13 Z" fill="rgba(240, 249, 255, 0.48)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth={0.7} />
        </Svg>
      </Animated.View>

      {/* Bee Body Svg */}
      <Svg width={38} height={28} viewBox="0 0 38 28" style={{ zIndex: 1 }}>
        {/* Yellow Body */}
        <Ellipse cx={18} cy={16} rx={11} ry={7.5} fill="#F6C445" />

        {/* Dark Stripes */}
        <Path d="M13,9 L13,23" stroke="#2A1B0E" strokeWidth={2.8} />
        <Path d="M18,8.5 L18,23.5" stroke="#2A1B0E" strokeWidth={2.8} />
        <Path d="M23,9 L23,23" stroke="#2A1B0E" strokeWidth={2.8} />

        {/* Bee Head */}
        <Circle cx={8} cy={16} r={4} fill="#2A1B0E" />
        <Circle cx={7} cy={15} r={1} fill="#FFFFFF" />

        {/* Antennae */}
        <Path d="M7,12 Q4,8 3,6" stroke="#2A1B0E" strokeWidth={1} fill="none" />
        <Circle cx={3} cy={6} r={0.8} fill="#F6C445" />

        {/* Stinger */}
        <Path d="M29,16 L33,16" stroke="#2A1B0E" strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

// =========================================================================
// PERCHED BIRD COMPONENT (살아있는 아기새 🐦: 하늘에서 날아와 첫 착석 + 꽃밭 꽃들 사이를 날아다니며 앉기)
// =========================================================================
const FLOWER_PERCH_TARGETS = [
  { x: 0, y: 0 },         // 1. 기준 꽃 착석 위치 (중좌측 화단 꽃)
  { x: 75, y: -22 },      // 2. 중앙 화단 꽃
  { x: -75, y: -28 },     // 3. 좌측 중간 화단 꽃
  { x: 135, y: -62 },     // 4. 상단 우측 아치 꽃
  { x: 55, y: 38 },       // 5. 하단 중앙 전경 꽃
  { x: -55, y: -68 },     // 6. 상단 좌측 아치 꽃
  { x: 160, y: 10 },      // 7. 우측 전경 꽃
  { x: 8, y: -62 },       // 8. 상단 중앙 아치 꽃
  { x: -65, y: 32 },      // 9. 하단 좌측 전경 꽃
  { x: 110, y: -20 },     // 10. 우측 중간 화단 꽃
];

const FloatingBird: React.FC<{
  id?: number;
  startX?: number;
  startY?: number;
  mode?: 'sanctuary' | 'greenhouse';
}> = ({ startX = 0, startY = 0, mode = 'sanctuary' }) => {
  const bodyBounce = useSharedValue(0);
  const tailWiggle = useSharedValue(0);
  const eyeBlink = useSharedValue(1);
  const headTilt = useSharedValue(0);
  const beakChirp = useSharedValue(0);
  // 초기 시작 위치: sanctuary 모드일 때는 우상단 벚꽃 나무 가지 위 (x: 162, y: -218), greenhouse 모드일 때는 startX, startY
  const flyX = useSharedValue(mode === 'greenhouse' ? startX : 162);
  const flyY = useSharedValue(mode === 'greenhouse' ? startY : -218);
  const flyArc = useSharedValue(0);
  const flyTilt = useSharedValue(0);
  const wingFlap = useSharedValue(0); // 가지 위에 앉아있을 때는 날개 접음
  const facing = useSharedValue(1); // 1: 왼쪽 방향 (온실 및 꽃밭 응시)

  const currentTargetRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let flightTimeout: any = null;

    // 1. 둥둥 뜸 최소화 (0.8px 초미세 호흡)
    bodyBounce.value = withRepeat(
      withSequence(
        withTiming(-0.8, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.8, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // 2. 꼬리깃 살랑살랑
    tailWiggle.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(-6, { duration: 750, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // 3. 눈 깜빡임 (약 2.6초마다)
    eyeBlink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600 }),
        withTiming(0.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      ),
      -1,
      true
    );

    // 4. 고개 돌리기/갸웃/꽃 내려다보기/콕콕 쪼아보기 (풍부하고 생생한 아기새 호기심 모션)
    headTilt.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 800 }),
        withTiming(14, { duration: 180, easing: Easing.out(Easing.quad) }), // 귀엽게 갸웃
        withTiming(14, { duration: 450 }),
        withTiming(24, { duration: 160, easing: Easing.out(Easing.quad) }), // 아래 꽃잎 깊게 내려다보기
        withTiming(24, { duration: 650 }),
        withTiming(10, { duration: 140 }), // 살짝 들기
        withTiming(26, { duration: 150, easing: Easing.out(Easing.quad) }), // 꽃잎 콕! 쪼아보기
        withTiming(0, { duration: 250 }),
        withTiming(-14, { duration: 220, easing: Easing.out(Easing.quad) }), // 밤하늘/온실 지붕 올려다보기
        withTiming(-14, { duration: 600 }),
        withTiming(-4, { duration: 180 }),
        withTiming(18, { duration: 200 }), // 호기심 가득한 갸웃
        withTiming(18, { duration: 550 }),
        withTiming(6, { duration: 150 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      true
    );

    // 5. 입 짹-짹- 벌리기 (3.8초 주기)
    beakChirp.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2200 }),
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 80 }),
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 1300 })
      ),
      -1,
      true
    );

    if (mode === 'greenhouse') {
      // 🌿 온실 꽃밭 3 완개 방문 시 전용 차분하고 귀여운 비행 모션:
      // (1) 하늘에서 날아와 꽃에 사뿐히 앉아서 짹짹 ➔ (2) 바 프레임으로 가뿐히 포르르 이동하여 안착!
      flyX.value = startX + 70;
      flyY.value = startY - 90;
      wingFlap.value = 1;
      flyTilt.value = -12;
      facing.value = 1; // 좌우 반전 없이 온실/꽃 방향 응시

      // 1단계: 하늘에서 꽃 위(0, -42)로 부드럽게 활공 비행 (1100ms)
      wingFlap.value = withRepeat(
        withSequence(withTiming(1, { duration: 75 }), withTiming(0, { duration: 75 })),
        -1,
        true
      );
      flyX.value = withTiming(0, { duration: 1100, easing: Easing.out(Easing.quad) });
      flyY.value = withTiming(-42, { duration: 1100, easing: Easing.out(Easing.quad) });
      flyArc.value = withSequence(
        withTiming(-20, { duration: 550, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 550, easing: Easing.in(Easing.quad) })
      );

      // 2단계: 꽃 위에 착석하여 1.8초간 머물며 꽃잎을 바라보고 축하 짹짹
      flightTimeout = setTimeout(() => {
        if (!isMounted) return;
        wingFlap.value = withTiming(0, { duration: 150 });
        flyTilt.value = withTiming(0, { duration: 150 });
        headTilt.value = withTiming(22, { duration: 250 });
        bodyBounce.value = withSequence(
          withTiming(-3.5, { duration: 120 }),
          withTiming(2, { duration: 100 }),
          withTiming(0, { duration: 120 })
        );
        beakChirp.value = withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 70 }),
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 70 })
        );

        // 3단계: 꽃에서 바 프레임(startX, startY)으로 가뿐하게 포르르 점프 비행 (800ms)
        flightTimeout = setTimeout(() => {
          if (!isMounted) return;
          headTilt.value = withTiming(0, { duration: 150 });
          wingFlap.value = withRepeat(
            withSequence(withTiming(1, { duration: 75 }), withTiming(0, { duration: 75 })),
            6,
            true
          );
          flyArc.value = withSequence(
            withTiming(-16, { duration: 400, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
          );
          flyX.value = withTiming(startX, { duration: 800, easing: Easing.inOut(Easing.quad) });
          flyY.value = withTiming(startY, { duration: 800, easing: Easing.inOut(Easing.quad) });

          // 4단계: 바 프레임에 최종 안착 및 날개 접기
          flightTimeout = setTimeout(() => {
            if (!isMounted) return;
            wingFlap.value = withTiming(0, { duration: 150 });
            flyTilt.value = withTiming(0, { duration: 150 });
            bodyBounce.value = withSequence(
              withTiming(-3, { duration: 120 }),
              withTiming(1.5, { duration: 100 }),
              withTiming(0, { duration: 120 })
            );
            beakChirp.value = withSequence(
              withTiming(1, { duration: 80 }),
              withTiming(0, { duration: 70 }),
              withTiming(1, { duration: 80 }),
              withTiming(0, { duration: 70 }),
              withTiming(1, { duration: 80 }),
              withTiming(0, { duration: 70 })
            );

            // 이후 8~11초 주기로 가벼운 자리 지저귐 반복
            const periodicLoop = () => {
              if (!isMounted) return;
              bodyBounce.value = withSequence(
                withTiming(-2.5, { duration: 120 }),
                withTiming(1.2, { duration: 100 }),
                withTiming(0, { duration: 120 })
              );
              beakChirp.value = withSequence(
                withTiming(1, { duration: 80 }),
                withTiming(0, { duration: 70 }),
                withTiming(1, { duration: 80 }),
                withTiming(0, { duration: 70 })
              );
              flightTimeout = setTimeout(periodicLoop, 8000 + Math.random() * 3000);
            };

            flightTimeout = setTimeout(periodicLoop, 6000);
          }, 800);
        }, 1800);
      }, 1100);

      return () => {
        isMounted = false;
        if (flightTimeout) clearTimeout(flightTimeout);
      };
    }

    // 🌸 27송이 최종 야경 온실 (Sanctuary) 전용 모션 (100% 기존 유지):
    // 6. 비행 함수 정의: 다음 꽃 위치로 포르르 날아가 착석
    const flyToNextFlower = () => {
      if (!isMounted) return;

      // 다음 목표 꽃 선택 (현재 꽃과 다른 위치)
      let nextIdx = Math.floor(Math.random() * FLOWER_PERCH_TARGETS.length);
      if (nextIdx === currentTargetRef.current) {
        nextIdx = (nextIdx + 1) % FLOWER_PERCH_TARGETS.length;
      }
      currentTargetRef.current = nextIdx;
      const nextPos = FLOWER_PERCH_TARGETS[nextIdx];

      const currentX = flyX.value;
      const currentY = flyY.value;
      const deltaX = nextPos.x - currentX;
      const deltaY = nextPos.y - currentY;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const flightDuration = Math.max(1100, Math.min(1700, Math.round(dist * 7.5)));

      // 비행 방향에 따른 좌우 방향 전환 및 하향/상향 비행 기울기
      let targetTilt = 0;
      if (deltaX < -5) {
        facing.value = withTiming(1, { duration: 150 });
        // 아래쪽 꽃으로 갈 때는 -16도 하향, 위쪽 꽃으로 갈 때는 +10도 상향
        targetTilt = deltaY > 5 ? -16 : deltaY < -5 ? 10 : -8;
      } else if (deltaX > 5) {
        facing.value = withTiming(-1, { duration: 150 });
        // 오른쪽으로 비행할 때 아래쪽 꽃은 +16도 하향, 위쪽 꽃은 -10도 상향
        targetTilt = deltaY > 5 ? 16 : deltaY < -5 ? -10 : 8;
      }

      // 비행 중 몸통 기울기 및 착석 전 수평 복귀
      flyTilt.value = withSequence(
        withTiming(targetTilt, { duration: 250 }),
        withDelay(flightDuration - 450, withTiming(0, { duration: 250 }))
      );

      // 비행 중 머리도 목표 꽃을 향해 아래로 숙이며 응시
      headTilt.value = withSequence(
        withTiming(15, { duration: 300 }),
        withTiming(-6, { duration: 350 }),
        withTiming(12, { duration: 350 }),
        withTiming(0, { duration: 250 })
      );

      // 비행 중 연속 날갯짓 파닥파닥
      wingFlap.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 80 })
        ),
        Math.floor(flightDuration / 160),
        true
      );

      // 공중 호를 그리며 포르르 비행 (Peak Arc: -28px)
      flyArc.value = withSequence(
        withTiming(-28, { duration: flightDuration * 0.45, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: flightDuration * 0.55, easing: Easing.in(Easing.quad) })
      );

      // X, Y 이동
      flyX.value = withTiming(nextPos.x, { duration: flightDuration, easing: Easing.inOut(Easing.quad) });
      flyY.value = withTiming(nextPos.y, { duration: flightDuration, easing: Easing.inOut(Easing.quad) });

      // 꽃에 착석 완료 후
      setTimeout(() => {
        if (!isMounted) return;
        wingFlap.value = withTiming(0, { duration: 150 });
        flyTilt.value = withTiming(0, { duration: 150 });
        // 착석 시 가벼운 안착 바운스 및 짹짹
        bodyBounce.value = withSequence(
          withTiming(-3.5, { duration: 140 }),
          withTiming(2, { duration: 120 }),
          withTiming(0, { duration: 150 })
        );
        beakChirp.value = withSequence(
          withTiming(1, { duration: 90 }),
          withTiming(0, { duration: 80 }),
          withTiming(1, { duration: 90 }),
          withTiming(0, { duration: 80 })
        );

        // 꽃에 앉아서 쉬는 시간 (4.5초 ~ 6초) 후 다음 꽃으로 비행
        const restDuration = 4500 + Math.random() * 1500;
        flightTimeout = setTimeout(flyToNextFlower, restDuration);
      }, flightDuration);
    };

    // 7. 첫 모션 스타트: 우상단 벚꽃 가지(x: 168, y: -178)에 앉아 있다가 꽃으로 포르르 비행
    // (1) 벚꽃 나무 가지에서 1.8초 동안 호흡하며 아래 꽃밭을 내려다보고 짹짹
    const branchRestDuration = 1800;
    const branchToFlowerDuration = 2200;

    wingFlap.value = 0; // 가지 위에 앉아있을 때는 날개 접음
    flyTilt.value = 0;
    flyX.value = 162; // 우상단 분홍 꽃나무 가지 위 정확한 안착 위치
    flyY.value = -218;

    // (2) 1.8초 후 가지에서 날아올라 첫 번째 꽃(0, 0)으로 가뿐하게 비행
    flightTimeout = setTimeout(() => {
      if (!isMounted) return;

      // 비행 중 날갯짓 활성화
      wingFlap.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 80 })
        ),
        Math.floor(branchToFlowerDuration / 160),
        true
      );

      // 비행 중 꽃 방향으로 몸체 각도 선명하게 하향(-32도) ➔ 착지 직전 브레이크 플레어(+8도) ➔ 착석 시 0도 수평 복귀
      flyTilt.value = withSequence(
        withTiming(-32, { duration: 1400, easing: Easing.out(Easing.quad) }),
        withTiming(8, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) })
      );

      // 비행 중 머리와 부리를 목표 꽃을 향해 깊게 아래로 숙임(+28도) ➔ 착지 시 자연스럽게 0도 정면 복귀
      headTilt.value = withSequence(
        withTiming(28, { duration: 1400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) })
      );

      // 풍성한 공중 부력 양력 호(Arc)로 깃털처럼 둥실 떠서 완만하게 하강
      flyArc.value = withSequence(
        withTiming(-48, { duration: branchToFlowerDuration * 0.45, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: branchToFlowerDuration * 0.55, easing: Easing.in(Easing.quad) })
      );

      // X, Y 부드러운 일체형 곡선 이동 (2.2초 동안 여유롭고 우아한 비행)
      flyX.value = withTiming(0, { duration: branchToFlowerDuration, easing: Easing.inOut(Easing.quad) });
      flyY.value = withTiming(0, { duration: branchToFlowerDuration, easing: Easing.inOut(Easing.quad) });

      // (3) 첫 꽃에 착석 완료
      flightTimeout = setTimeout(() => {
        if (!isMounted) return;
        wingFlap.value = withTiming(0, { duration: 160 });
        flyTilt.value = withTiming(0, { duration: 160 });
        bodyBounce.value = withSequence(
          withTiming(-3.5, { duration: 140 }),
          withTiming(2, { duration: 120 }),
          withTiming(0, { duration: 140 })
        );
        beakChirp.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 90 }),
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 90 })
        );

        // 첫 꽃 착석 후 5초간 머문 후 꽃밭 순회 비행 시작
        flightTimeout = setTimeout(flyToNextFlower, 5000);
      }, branchToFlowerDuration);

    }, branchRestDuration);

    return () => {
      isMounted = false;
      if (flightTimeout) clearTimeout(flightTimeout);
    };
  }, [beakChirp, bodyBounce, eyeBlink, facing, flyArc, flyTilt, flyX, flyY, headTilt, mode, startX, startY, tailWiggle, wingFlap]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: mode === 'greenhouse' ? flyX.value : (startX + flyX.value) },
      { translateY: mode === 'greenhouse' ? (flyY.value + flyArc.value + bodyBounce.value) : (startY + flyY.value + flyArc.value + bodyBounce.value) },
      { scaleX: facing.value },
      { rotate: `${flyTilt.value}deg` }
    ],
  }));

  const headAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${headTilt.value}deg` }
    ]
  }));

  const tailAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${tailWiggle.value}deg` }
    ]
  }));

  const eyeAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: eyeBlink.value }
    ]
  }));

  const lowerBeakStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: beakChirp.value * 2.2 },
      { rotate: `${beakChirp.value * 12}deg` }
    ]
  }));

  const wingAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: 1 - wingFlap.value * 0.85 },
      { translateY: wingFlap.value * -2 },
      { rotate: `${wingFlap.value * -22}deg` }
    ]
  }));

  return (
    <Animated.View style={[{ position: 'absolute', width: 42, height: 34, alignItems: 'center', justifyContent: 'center' }, animStyle]} pointerEvents="none">
      <Svg width={42} height={34} viewBox="0 0 42 34">
        {/* Bird Feet */}
        <Path d="M16,27 L14,31 M18,27 L18,31 M25,27 L24,31 M26,27 L27,31" stroke="#E67E22" strokeWidth={1.6} strokeLinecap="round" />

        {/* Bird Body */}
        <Ellipse cx={19} cy={18} rx={9.5} ry={8} fill="#70D6FF" />
        <Ellipse cx={19} cy={20} rx={6.5} ry={5.5} fill="#E0F7FA" />
      </Svg>

      {/* Bird Wing (날아갈 때 초고속 펄럭이는 리얼 날갯짓) */}
      <Animated.View style={[{ position: 'absolute', top: 11, left: 11, transformOrigin: 'top center' }, wingAnimStyle]}>
        <Svg width={16} height={12} viewBox="0 0 16 12">
          <Path d="M1,2 Q12,-2 15,10 Q6,11 1,2 Z" fill="#48CAE4" stroke="#00B4D8" strokeWidth={0.9} />
        </Svg>
      </Animated.View>

      {/* Head with Tilt */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: 42, height: 34, transformOrigin: '11px 14px' }, headAnimStyle]}>
        <Svg width={42} height={34} viewBox="0 0 42 34">
          <Circle cx={11} cy={11} r={6} fill="#70D6FF" />
          {/* Cute Cheek Pink (moves with head) */}
          <Circle cx={10} cy={13.5} r={1.5} fill="#FFB5A7" opacity={0.85} />
          {/* Upper Beak */}
          <Path d="M6,9.5 L0.5,11 L6,12.5 Z" fill="#FFB703" stroke="#FB8500" strokeWidth={0.7} />
        </Svg>

        {/* Lower Beak Chirp */}
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, lowerBeakStyle]}>
          <Svg width={42} height={34} viewBox="0 0 42 34">
            <Path d="M6,12.5 L1,14 L6,15 Z" fill="#FFB703" stroke="#FB8500" strokeWidth={0.7} />
          </Svg>
        </Animated.View>

        {/* Eye Blink */}
        <Animated.View style={[{ position: 'absolute', top: 8, left: 7 }, eyeAnimStyle]}>
          <Svg width={5} height={5} viewBox="0 0 5 5">
            <Circle cx={2.5} cy={2.5} r={2} fill="#1D3557" />
            <Circle cx={2} cy={1.8} r={0.7} fill="#FFFFFF" />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* 꼬리깃 (살랑살랑) */}
      <Animated.View style={[{ position: 'absolute', top: 12, left: 24, transformOrigin: '0px 6px' }, tailAnimStyle]}>
        <Svg width={18} height={12} viewBox="0 0 18 12">
          <Path d="M0,6 L14,1 L12,10 Z" fill="#70D6FF" stroke="#50FA7B" strokeWidth={0.8} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};

const getSkyColors = (completedCount: number): { top: string; bottom: string } => {
  const count = Math.min(completedCount, 9);

  // Define color stops at 0, 3, 6, 9 completed plants
  const STOPS = [
    { count: 0, top: '#030308', bottom: '#060714' },
    { count: 3, top: '#080C26', bottom: '#2E193C' },
    { count: 6, top: '#161F54', bottom: '#B34A5D' },
    { count: 9, top: '#3572DF', bottom: '#FFAE8A' }
  ];

  // Find the interval [stop1, stop2] containing the count
  let stop1 = STOPS[0];
  let stop2 = STOPS[STOPS.length - 1];

  for (let i = 0; i < STOPS.length - 1; i++) {
    if (count >= STOPS[i].count && count <= STOPS[i + 1].count) {
      stop1 = STOPS[i];
      stop2 = STOPS[i + 1];
      break;
    }
  }

  const range = stop2.count - stop1.count;
  const factor = range === 0 ? 0 : (count - stop1.count) / range;

  return {
    top: interpolateColor(stop1.top, stop2.top, factor),
    bottom: interpolateColor(stop1.bottom, stop2.bottom, factor)
  };
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const {
    state,
    isLoaded,
    selectColor,
    removeSelectedColor,
    selectBrush,
    colorSegment,
    completeColoring,
    resetCanvas,
    resetSelection,
    collectParticle,
    setCurrentPotIndex,
    randomizeActivePotTemplate,
    showModal,
    closeModal,
    isModalOpen,
    modalTitle,
    modalContent,
    resetGame,
    startSecondGarden,
    startThirdGarden,
    startFourthGarden,
    writeDiary
  } = useGame();

  const cardRef = useRef<View>(null);
  const designRef = useRef<View>(null);
  const completedCount = state.archive.length;
  const currentGardenCompleted = completedCount % 9;
  const skyFactor = Math.min((state.currentPotIndex + 1) / 9, 1);
  const { top: skyTopColor, bottom: skyBottomColor } = getSkyColors(state.currentPotIndex + 1);
  const unlockedCount =
    currentGardenCompleted < 2 ? 12 :
      currentGardenCompleted < 4 ? 18 :
        currentGardenCompleted < 6 ? 24 : 30;

  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (state.currentPotIndex === 8) {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 3200 }),
          withTiming(0.92, { duration: 3200 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 3200 }),
          withTiming(0.4, { duration: 3200 })
        ),
        -1,
        true
      );
    }
  }, [state.currentPotIndex, glowScale, glowOpacity]);

  const animated12thGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const [currentScreen, setCurrentScreen] = useState<'mansil' | 'color-select' | 'coloring' | 'mind-card' | 'archive' | 'mandala-detail' | 'sanctuary'>(
    state.archive.length >= 27 ? 'sanctuary' : 'mansil'
  );
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; collected: boolean }[]>([]);

  const [isExporting, setIsExporting] = useState(false);

  // ---- Milestone Popup States ----
  // Toast notification (1st, 2nd, 3rd~6th plant)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(25);

  // Selected archived item for detail modal
  const [selectedArchiveItem, setSelectedArchiveItem] = useState<ArchivedPlant | null>(null);

  // Butterfly special popup (9th plant)
  const [isButterflyPopupOpen, setIsButterflyPopupOpen] = useState(false); // TODO: 테스트용 - 배포 전 false로 변경

  // Second garden popup (after butterfly)
  const [isSecondGardenPopupOpen, setIsSecondGardenPopupOpen] = useState(false);

  // Butterfly overlay animation on greenhouse after 9th
  const [showButterflyOverlay, setShowButterflyOverlay] = useState(false);

  // Bee special popup (18th plant / 2nd garden 9th)
  const [isBeePopupOpen, setIsBeePopupOpen] = useState(false);

  // Third garden popup (after bee)
  const [isThirdGardenPopupOpen, setIsThirdGardenPopupOpen] = useState(false);

  // Bee overlay animation on greenhouse (5s)
  const [showBeeOverlay, setShowBeeOverlay] = useState(false);

  // Bird special popup (27th plant / 3rd garden 9th)
  const [isBirdPopupOpen, setIsBirdPopupOpen] = useState(false);

  // Season 1 completion popup (after bird overlay on 27th plant)
  const [isSeason1CompletedModalOpen, setIsSeason1CompletedModalOpen] = useState(false);

  // Fourth garden popup (after bird)
  const [isFourthGardenPopupOpen, setIsFourthGardenPopupOpen] = useState(false);

  // Bird overlay animation on greenhouse (5s)
  const [showBirdOverlay, setShowBirdOverlay] = useState(false);

  // Track last shown archive count to avoid re-triggering
  const lastShownArchiveLengthRef = useRef(state.archive.length);

  const showToast = (message: string) => {
    setToastMessage(message);
    toastTranslateY.value = 25;
    toastOpacity.value = 0;
    toastTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.2)) });
    toastOpacity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(1, { duration: 4000 }),
      withTiming(0, { duration: 600 })
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 5100);
  };

  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }],
  }));

  // Diary Write Modal States
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [diaryQuestion, setDiaryQuestion] = useState('');
  const [diaryContent, setDiaryContent] = useState('');

  // Diary View Modal States
  const [isDiaryViewModalOpen, setIsDiaryViewModalOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const [selectedPlantName, setSelectedPlantName] = useState('');
  const [selectedStepLevel, setSelectedStepLevel] = useState(0);

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleOpenDiaryWriteModal = (question: string) => {
    const currentLevel = activePot?.level || 1;
    const existingEntry = activePot?.diaries?.[currentLevel];
    setDiaryQuestion(question);
    setDiaryContent(existingEntry?.content || '');
    setIsDiaryModalOpen(true);
  };

  const handleSaveDiary = () => {
    if (!diaryContent.trim()) {
      showModal(t('common.notice'), t('diary.input_required'));
      return;
    }
    const currentLevel = activePot?.level || 1;
    writeDiary(activePot.id, currentLevel, diaryQuestion, diaryContent);
    setIsDiaryModalOpen(false);
    playSoundEffect(659.25, 'sine', 0.5);
  };

  const handleOpenDiaryViewModal = (plantName: string, level: number, entry: DiaryEntry | undefined) => {
    setSelectedPlantName(plantName);
    setSelectedStepLevel(level);
    if (entry) {
      setSelectedDiary(entry);
    } else {
      setSelectedDiary(null);
    }
    setIsDiaryViewModalOpen(true);
    playSoundEffect(523.25, 'sine', 0.4);
  };

  const handleExportCard = async () => {
    try {
      playSoundEffect(587.33, 'sine', 0.5);

      // Hide level 5 title during export
      setIsExporting(true);

      // Brief delay to allow UI to re-render without the title
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (Platform.OS === 'web') {
        const html2canvas = require('html2canvas');
        const element = cardRef.current as any;
        if (!element) {
          showModal(t('common.error'), t('export.card_area_not_found'));
          setIsExporting(false);
          return;
        }

        const canvas = await html2canvas(element, {
          useCORS: true,
          backgroundColor: null,
          scale: 2,
        });

        // Restore title visibility immediately after capturing
        setIsExporting(false);

        const dataUrl = canvas.toDataURL('image/png');

        let shared = false;
        if (navigator.share && navigator.canShare) {
          try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `mind-card-${activePot?.name || 'plant'}.png`, { type: 'image/png' });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `${activePot?.name || 'plant'}`,
                text: `${activePot?.name || 'plant'}`,
              });
              shared = true;
            }
          } catch (shareError) {
            console.warn('Web Share failed, falling back to download:', shareError);
          }
        }

        if (!shared) {
          const link = document.createElement('a');
          link.download = `mind-card-${activePot?.name || 'plant'}.png`;
          link.href = dataUrl;
          link.click();

          showModal(
            t('export.card_title'),
            t('export.card_downloaded', { name: activePot?.name || 'plant' })
          );
        }
      } else {
        if (!cardRef.current) {
          showModal(t('common.error'), t('export.card_area_not_found'));
          setIsExporting(false);
          return;
        }

        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
          snapshotContentContainer: false,
        });

        // Restore title visibility immediately after capturing
        setIsExporting(false);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `${activePot?.name || 'plant'}`,
            UTI: 'public.png',
          });
        } else {
          showModal(t('common.notice'), t('export.share_not_supported'));
        }
      }
    } catch (error: any) {
      setIsExporting(false);
      console.error('Error sharing card:', error);
      showModal("error", `카드 내보내기 중 문제가 발생했습니다: ${error.message || error}`);
    }
  };

  const handleExportDesign = async () => {
    try {
      if (Platform.OS === 'web') {
        const html2canvas = require('html2canvas');
        const element = designRef.current as any;
        if (!element) {
          showModal(t('common.error'), t('export.design_area_not_found'));
          return;
        }

        const canvas = await html2canvas(element, {
          useCORS: true,
          backgroundColor: null,
          scale: 2,
        });

        const dataUrl = canvas.toDataURL('image/png');

        let shared = false;
        if (navigator.share && navigator.canShare) {
          try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `mandala-design-${activeTemplate.title}.png`, { type: 'image/png' });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `${activeTemplate.title}`,
                text: `${activeTemplate.title}`,
              });
              shared = true;
            }
          } catch (shareError) {
            console.warn('Web Share failed, falling back to download:', shareError);
          }
        }

        if (!shared) {
          const link = document.createElement('a');
          link.download = `mandala-design-${activeTemplate.title}.png`;
          link.href = dataUrl;
          link.click();
          showModal(t('common.notice'), t('export.design_downloaded'));
        }
      } else {
        if (!designRef.current) {
          showModal(t('common.error'), t('export.design_area_not_found'));
          return;
        }
        const uri = await captureRef(designRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `${activeTemplate.title}`,
            UTI: 'public.png',
          });
        } else {
          showModal(t('common.notice'), t('export.share_not_supported'));
        }
      }
    } catch (error: any) {
      console.error('Error sharing design:', error);
      showModal("error", `도안 내보내기 중 문제가 발생했습니다: ${error.message || error}`);
    }
  };

  const potsScrollRef = useRef<ScrollView>(null);

  const scrollToActivePot = (animated = true) => {
    if (potsScrollRef.current) {
      const cardWidth = 96;
      const gap = 8;
      const containerWidth = Math.min(SCREEN_WIDTH, MaxContentWidth) - 32;

      let targetIndex = state.currentPotIndex;
      const hasNextUnlocked = state.pots[state.currentPotIndex + 1] && state.pots[state.currentPotIndex + 1].status === 'unlocked';
      if (hasNextUnlocked) {
        targetIndex = state.currentPotIndex + 0.5;
      }

      const offset = targetIndex * (cardWidth + gap);
      const centeredOffset = Math.max(0, offset - (containerWidth / 2) + (cardWidth / 2) + 16);
      potsScrollRef.current.scrollTo({ x: centeredOffset, animated });
    }
  };

  const autoSelectFiredRef = useRef(false);

  // Auto-select the first in-progress pot when entering the greenhouse
  useEffect(() => {
    if (currentScreen === 'mansil') {
      if (!autoSelectFiredRef.current && state.pots && state.pots.length > 0) {
        const activePot = state.pots[state.currentPotIndex];
        // If the currently selected pot is fully grown, switch to one in progress
        if (activePot && activePot.level >= 5) {
          const inProgressIdx = state.pots.findIndex(p => p.status === 'unlocked' && p.level < 5);
          if (inProgressIdx !== -1 && inProgressIdx !== state.currentPotIndex) {
            setCurrentPotIndex(inProgressIdx);
          }
        }
        autoSelectFiredRef.current = true;
      }
    } else {
      autoSelectFiredRef.current = false;
    }
  }, [currentScreen, state.pots, state.currentPotIndex]);

  // Auto-center the selected active pot card in the scroll view
  useEffect(() => {
    if (currentScreen === 'mansil' && potsScrollRef.current) {
      const timer = setTimeout(() => {
        scrollToActivePot(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [state.currentPotIndex, currentScreen]);

  const generateFireflies = () => {
    const coords = [
      { x: 12, y: 35 },
      { x: 68, y: 38 },
      { x: 8, y: 60 },
      { x: 72, y: 62 },
      { x: 18, y: 12 },
      { x: 58, y: 10 }
    ];

    const list = coords.map((c, i) => ({
      id: i,
      x: c.x + Math.random() * 10,
      y: c.y + Math.random() * 10,
      collected: false
    }));
    setParticles(list);
  };

  // Generate floating fireflies on screen load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generateFireflies();
  }, [currentScreen]);

  // Pending milestone queue ref & previous archive length ref
  const pendingMilestoneArchiveLenRef = useRef<number | null>(null);
  const prevArchiveLenRef = useRef(state.archive.length);
  const isInitialDataLoadRef = useRef(true);

  // 식물이 새로 완개되어 archive.length가 늘어날 때 대기열에 기록
  useEffect(() => {
    if (isInitialDataLoadRef.current && isLoaded) {
      isInitialDataLoadRef.current = false;
      prevArchiveLenRef.current = state.archive.length;
      lastShownArchiveLengthRef.current = state.archive.length;
      if (state.archive.length >= 27) {
        setCurrentScreen('sanctuary');
      }
      return;
    }

    if (isLoaded && state.archive.length > prevArchiveLenRef.current) {
      pendingMilestoneArchiveLenRef.current = state.archive.length;
    }
    if (isLoaded) {
      prevArchiveLenRef.current = state.archive.length;
    }
  }, [state.archive.length, isLoaded]);

  // 27송이(시즌1 전체 화단 완료) 상태일 때 새로고침이나 초기 로드 후 자동으로 최종 온실 야경(sanctuary) 화면 유지
  useEffect(() => {
    if (isLoaded && state.archive.length >= 27 && currentScreen === 'mansil' && !isBirdPopupOpen && !isSeason1CompletedModalOpen && !showBirdOverlay) {
      setCurrentScreen('sanctuary');
    }
  }, [isLoaded, state.archive.length, currentScreen, isBirdPopupOpen, isSeason1CompletedModalOpen, showBirdOverlay]);

  // Check milestone popups/toasts when returning to greenhouse
  useEffect(() => {
    if (currentScreen === 'mansil') {
      let targetArchiveLen: number | null = null;

      if (pendingMilestoneArchiveLenRef.current !== null) {
        targetArchiveLen = pendingMilestoneArchiveLenRef.current;
        pendingMilestoneArchiveLenRef.current = null;
      } else if (state.archive.length > 0 && state.archive.length !== lastShownArchiveLengthRef.current) {
        targetArchiveLen = state.archive.length;
      }

      if (targetArchiveLen !== null) {
        const archiveLen = targetArchiveLen;
        lastShownArchiveLengthRef.current = archiveLen;
        const cycleCount = archiveLen % 9;
        const gardenCycle = Math.floor((archiveLen - 1) / 9);

        const milestoneTimer = setTimeout(() => {
          if (cycleCount === 1) {
            showToast(t('toast.small_change'));
          } else if (cycleCount === 3) {
            showToast(t('toast.flower_scent_new_life'));
          } else if (cycleCount === 6) {
            if (gardenCycle === 0) {
              showToast(t('toast.butterfly_coming'));
            } else if (gardenCycle === 1) {
              showToast(t('toast.bee_coming'));
            } else {
              showToast(t('toast.bird_coming'));
            }
          } else if (cycleCount === 0) {
            if (gardenCycle === 0) {
              // 9th plant complete (First Garden -> Butterfly Popup)
              setIsButterflyPopupOpen(true);
            } else if (gardenCycle === 1) {
              // 18th plant complete (Second Garden -> Bee Popup)
              setIsBeePopupOpen(true);
            } else {
              // 27th plant complete (Third Garden -> Bird Popup)
              setIsBirdPopupOpen(true);
            }
          }
        }, 350);

        return () => clearTimeout(milestoneTimer);
      }
    }
  }, [currentScreen, state.archive.length]);

  const handleParticleTap = (id: number) => {
    collectParticle(id);
    setParticles(prev => prev.map(p => p.id === id ? { ...p, collected: true } : p));
  };

  // Math to generate SVG donut sector wedge
  const getDonutPath = (
    cx: number,
    cy: number,
    rOut: number,
    rIn: number,
    startDeg: number,
    endDeg: number
  ) => {
    const a1 = (startDeg - 90) * Math.PI / 180;
    const a2 = (endDeg - 90) * Math.PI / 180;

    const x1_out = cx + rOut * Math.cos(a1);
    const y1_out = cy + rOut * Math.sin(a1);
    const x2_out = cx + rOut * Math.cos(a2);
    const y2_out = cy + rOut * Math.sin(a2);

    const x1_in = cx + rIn * Math.cos(a1);
    const y1_in = cy + rIn * Math.sin(a1);
    const x2_in = cx + rIn * Math.cos(a2);
    const y2_in = cy + rIn * Math.sin(a2);

    return `M ${x1_in} ${y1_in} L ${x1_out} ${y1_out} A ${rOut} ${rOut} 0 0 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${rIn} ${rIn} 0 0 0 ${x1_in} ${y1_in} Z`;
  };

  // Switch screens with haptic and audio feedback
  const navigateTo = (screen: typeof currentScreen) => {
    playSoundEffect(440);
    const targetScreen = (screen === 'mansil' && state.archive.length >= 27 && !isBirdPopupOpen && !isSeason1CompletedModalOpen && !showBirdOverlay)
      ? 'sanctuary'
      : screen;

    setCurrentScreen(targetScreen);
  };

  const handleCompletePress = () => {
    const nextScreen = completeColoring();
    if (nextScreen) {
      setCurrentScreen(nextScreen);
    }
  };

  const activePot = state.pots[state.currentPotIndex] || state.pots[0];
  const activeTemplateId = activePot?.templateId || 'lotus_core';
  const activeTemplate = getTemplateById(activeTemplateId);

  // Filter only colorable segments excluding locked outlines and border circles
  const colorableShapes = activeTemplate.shapes.filter((s: { id: string }) => !s.id.toLowerCase().includes('outline') && !s.id.toLowerCase().includes('border'));
  const coloredCount = colorableShapes.filter((s: { id: string }) => state.mandalaColors[s.id]).length;
  const segmentRatio = coloredCount / (colorableShapes.length || 1);

  // Calculate essence liquid usage ratio (how much color user poured into mandala)
  const totalBottleUsage = state.selectedColors.reduce((sum, _, idx) => sum + (state.bottleRatios[idx] || 0), 0);
  const maxPossibleUsage = (state.selectedColors.length || 1) * 100;
  const liquidRatio = totalBottleUsage / maxPossibleUsage;

  // Effective progress combines visual coloring clicks and essence liquid usage
  const combinedRatio = Math.max(segmentRatio * 2.5, liquidRatio);
  const progressPercent = Math.min(100, Math.floor(combinedRatio * 100));



  return (
    <ThemedView style={styles.container}>
      {/* GPU Preloaded Background Assets for 0ms Instant Transition */}
      <View pointerEvents="none" style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01, zIndex: -9999 }}>
        <Image source={require('../../assets/images/bg.png')} style={{ width: 1, height: 1 }} />
        <Image source={require('../../assets/images/mandar_bg.png')} style={{ width: 1, height: 1 }} />
        <Image source={require('../../assets/images/mandar_step_bg.png')} style={{ width: 1, height: 1 }} />
      </View>

      <SafeAreaView style={styles.safeArea}>

        {/* Header segment */}
        <View style={styles.header}>
          <Pressable
            style={styles.logoRow}
            onPress={() => {
              resetSelection();
              navigateTo('mansil');
            }}
          >
            <Image
              source={require('../../assets/images/flow2.png')}
              style={{ width: 25, height: 25 }}
              resizeMode="contain"
            />
            <ThemedText type="smallBold" style={styles.logoText}>{t('common.logo_text')}</ThemedText>
          </Pressable>

          {/* Score badge removed */}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 1: GREENHOUSE PLAZA */}
        {/* ------------------------------------------------------------- */}
        {(currentScreen === 'mansil' || (currentScreen === 'archive' && state.archive.length < 27)) && (
          <>
            <Image
              source={require('../../assets/images/mandar_bg.png')}
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', zIndex: -1, display: currentScreen === 'mansil' ? 'flex' : 'none' }]}
              resizeMode="cover"
            />
            <View style={[styles.screenWrapper, { display: currentScreen === 'mansil' ? 'flex' : 'none' }]}>
              <View style={styles.titleArea}>
                <View>
                  <ThemedText type="title" style={[styles.mainTitle, styles.neonEmeraldGlow]}>
                    {t('greenhouse.title')}
                  </ThemedText>
                  <ThemedText type="small" style={styles.subtitleText}>
                    {t('greenhouse.subtitle')}
                  </ThemedText>
                </View>

                <Pressable style={styles.bookButton} onPress={() => navigateTo('archive')}>
                  <Image
                    source={require('../../assets/images/my.png')}
                    style={{ width: 20, height: 20, marginRight: 6 }}
                    resizeMode="contain"
                  />
                  <ThemedText type="smallBold" style={styles.bookButtonText}>{t('common.my_greenhouse')}</ThemedText>
                </Pressable>
              </View>

              {/* Night Sky Garden Svg Panel */}
              <View style={[styles.skyGardenContainer, { backgroundColor: skyBottomColor }]}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <Defs>
                    <LinearGradient id="domeGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={skyTopColor} stopOpacity="1" />
                      <Stop offset="100%" stopColor={skyBottomColor} stopOpacity="1" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#domeGrad)" />
                  <Circle cx="20" cy="15" r="0.4" fill="#ffffff" opacity={0.6 * (1 - skyFactor)} />
                  <Circle cx="80" cy="12" r="0.4" fill="#ffffff" opacity={0.7 * (1 - skyFactor)} />
                  <Circle cx="45" cy="8" r="0.5" fill="#fde047" opacity={0.8 * (1 - skyFactor)} />
                  <Circle cx="65" cy="22" r="0.3" fill="#ffffff" opacity={0.4 * (1 - skyFactor)} />
                  <Circle cx="15" cy="28" r="0.4" fill="#67e8f9" opacity={0.5 * (1 - skyFactor)} />
                  <Circle cx="85" cy="25" r="0.3" fill="#f472b6" opacity={0.5 * (1 - skyFactor)} />
                  <Circle cx="28" cy="25" r="0.3" fill="#ffffff" opacity={0.5 * (1 - skyFactor)} />
                  <Circle cx="71" cy="30" r="0.4" fill="#a7f3d0" opacity={0.6 * (1 - skyFactor)} />
                </Svg>

                {/* Ceiling Glass Dome Geometry — High ceiling arches & center line only (100% clean around soil mound) */}
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* High Glass Dome Arches (positioned high above the plant) */}
                  <Path d="M 0,60 Q 50,-30 100,60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
                  <Path d="M 0,70 Q 50,-15 100,70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />

                  {/* Center vertical axis line */}
                  <Line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
                </Svg>

                {/* Warm Light Motion emanating from Greenhouse glass arch */}
                <GreenhouseWarmLightMotion />

                {/* Fog aura overlay removed to prevent sharp horizontal split boundary */}

                {/* Floating Firefly Particles */}
                {particles.map(p => (
                  <FloatingFirefly
                    key={p.id}
                    id={p.id}
                    x={p.x}
                    y={p.y}
                    collected={p.collected}
                    onPress={() => handleParticleTap(p.id)}
                  />
                ))}

                {/* 9th plant exclusive mystical glowing background aura */}
                {state.currentPotIndex === 8 && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      {
                        position: 'absolute',
                        width: 240,
                        height: 240,
                        zIndex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                      animated12thGlowStyle
                    ]}
                  >
                    <Svg width="240" height="240" viewBox="0 0 100 100">
                      <Defs>
                        <RadialGradient id="skyGlow12" cx="50%" cy="50%" r="50%">
                          <Stop offset="0%" stopColor="#FFEAA7" stopOpacity="0.8" />
                          <Stop offset="50%" stopColor="#FFEAA7" stopOpacity="0.3" />
                          <Stop offset="100%" stopColor="#FFEAA7" stopOpacity="0" />
                        </RadialGradient>
                      </Defs>
                      <Circle cx="50" cy="50" r="50" fill="url(#skyGlow12)" />
                    </Svg>
                  </Animated.View>
                )}

                {/* Plant visual rendering */}
                <View style={styles.plantWrapper}>
                  <View style={styles.plantContainer}>
                    {activePot && activePot.level > 0 ? (
                      <View style={styles.plantVisual}>
                        {activePot.level === 5 ? (
                          <View style={{ width: 140, height: 140, justifyContent: 'center', alignItems: 'center', transform: [{ scale: 1.1 }] }}>
                            {/* Stem and leaves under the floating flower */}
                            <Image
                              source={require('../../assets/images/flow_body.png')}
                              style={{ width: 140, height: 140, position: 'absolute', transform: [{ translateY: 24 }] }}
                              resizeMode="contain"
                            />

                            {/* Floating glowing blossom layer */}
                            <GlowingBlossom
                              type={activePot.type}
                              color={
                                activePot.type === 'red' ? '#ef4444' :
                                  activePot.type === 'yellow' ? '#FFB86C' :
                                    activePot.type === 'blue' ? '#8BE9FD' :
                                      activePot.type === 'purple' ? '#BD93F9' :
                                        '#9DBA7D'
                              }
                              colors={activePot.colors}
                            />
                          </View>
                        ) : (
                          <Image
                            source={
                              activePot.level === 1 ? require('../../assets/images/step1.png') :
                                activePot.level === 2 ? require('../../assets/images/step2.png') :
                                  activePot.level === 3 ? require('../../assets/images/step3.png') :
                                    require('../../assets/images/step4.png')
                            }
                            style={{ width: 140, height: 140, transform: [{ scale: 1.1 }, { translateY: 0 }] }}
                            resizeMode="contain"
                          />
                        )}

                        <View style={styles.potNumberTag}>
                          <View style={styles.potProgressBar}>
                            {Array.from({ length: 9 }, (_, i) => {
                              const slotPot = state.pots[i];
                              const slotLevel = slotPot ? slotPot.level : 0;
                              const isLocked = !slotPot || slotPot.status === 'locked';

                              const slotIcon =
                                slotLevel === 5
                                  ? require('../../assets/images/process_done.png')
                                  : slotLevel === 4
                                    ? require('../../assets/images/process_mid.png')
                                    : slotLevel === 3
                                      ? require('../../assets/images/lev.png')
                                      : slotLevel === 2
                                        ? require('../../assets/images/process_ing.png')
                                        : require('../../assets/images/seed.png');

                              return (
                                <Image
                                  key={i}
                                  source={slotIcon}
                                  style={[
                                    { width: 16, height: 16, marginHorizontal: 1 },
                                    isLocked && { opacity: 0.35 }
                                  ]}
                                  resizeMode="contain"
                                />
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    ) : activePot && activePot.status === 'unlocked' ? (
                      <View style={styles.plantVisual}>
                        {/* Empty pot - step0 image */}
                        <Image
                          source={require('../../assets/images/step0.png')}
                          style={{ width: 140, height: 140, transform: [{ translateY: 5 }] }}
                          resizeMode="contain"
                        />

                        <View style={styles.potNumberTag}>
                          <View style={styles.potProgressBar}>
                            {Array.from({ length: 9 }, (_, i) => {
                              const slotPot = state.pots[i];
                              const slotLevel = slotPot ? slotPot.level : 0;
                              const isLocked = !slotPot || slotPot.status === 'locked';

                              const slotIcon =
                                slotLevel === 5
                                  ? require('../../assets/images/process_done.png')
                                  : slotLevel === 4
                                    ? require('../../assets/images/process_mid.png')
                                    : slotLevel === 3
                                      ? require('../../assets/images/lev.png')
                                      : slotLevel === 2
                                        ? require('../../assets/images/process_ing.png')
                                        : require('../../assets/images/seed.png');

                              return (
                                <Image
                                  key={i}
                                  source={slotIcon}
                                  style={[
                                    { width: 16, height: 16, marginHorizontal: 1 },
                                    isLocked && { opacity: 0.35 }
                                  ]}
                                  resizeMode="contain"
                                />
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.seedState}>
                        <Image
                          source={require('../../assets/images/lock.png')}
                          style={{ width: 48, height: 48, marginBottom: 8 }}
                          resizeMode="contain"
                        />
                        <ThemedText type="smallBold" style={styles.seedLabel}>{t('common.waiting_for_seed')}</ThemedText>
                      </View>
                    )}
                  </View>

                  <ThemedText style={styles.plantNameText}>{activePot?.name}</ThemedText>
                  <ThemedText type="smallBold" style={styles.plantGrowthStageText}>
                    {activePot && activePot.level > 0 ? t(`growth_stages.stage_${activePot.level}`) : t('growth_stages.stage_0')}
                  </ThemedText>
                </View>

                {/* Dove connection helper */}
                <View style={styles.doveWrapper}>
                  <Pressable
                    style={styles.doveButton}
                    onPress={() => {
                      playSoundEffect(440, 'sine', 0.8);
                      if (activePot && activePot.level > 0) {
                        showModal(activePot.name, activePot.desc);
                      } else {
                        showModal(t('greenhouse.empty_pot_letter_title'), t('greenhouse.empty_pot_letter_desc'));
                      }
                    }}
                  >
                    <Image
                      source={require('../../assets/images/talk.png')}
                      style={{ width: 18, height: 18, marginRight: 5 }}
                      resizeMode="contain"
                    />
                    <ThemedText style={styles.doveText}>{t('greenhouse.comfort_talk')}</ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Sequential Pots Grid (Horizontal Scrollable) */}
              <ScrollView
                ref={potsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.potsGridScrollView}
                contentContainerStyle={styles.potsGridScrollContainer}
                onContentSizeChange={() => {
                  if (currentScreen === 'mansil') {
                    scrollToActivePot(false);
                  }
                }}
              >
                {state.pots.map((pot, idx) => {
                  const isActive = idx === state.currentPotIndex;
                  const isLocked = pot.status === 'locked';

                  return (
                    <Pressable
                      key={pot.id}
                      disabled={isLocked}
                      onPress={() => {
                        playSoundEffect(350 + (idx * 50));
                        setCurrentPotIndex(idx);
                      }}
                      style={[
                        styles.potCard,
                        isActive && styles.potCardActive,
                        isLocked && styles.potCardLocked,
                      ]}
                    >
                      {isLocked ? (
                        <Image
                          source={require('../../assets/images/lock.png')}
                          style={{ width: 25, height: 25, marginBottom: 4 }}
                          resizeMode="contain"
                        />
                      ) : pot.level === 5 ? (
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: 'rgba(20, 32, 18, 0.85)',
                          borderWidth: 1,
                          borderColor: 'rgba(90, 135, 75, 0.45)',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginBottom: 4
                        }}>
                          <Image
                            source={require('../../assets/images/flow2.png')}
                            style={{ width: 22, height: 22 }}
                            resizeMode="contain"
                          />
                        </View>
                      ) : pot.level === 0 || pot.level === 1 ? (
                        <Image
                          source={require('../../assets/images/seed.png')}
                          style={{ width: 22, height: 22, marginBottom: 4 }}
                          resizeMode="contain"
                        />
                      ) : pot.level === 2 ? (
                        <Image
                          source={require('../../assets/images/process_ing.png')}
                          style={{ width: 22, height: 22, marginBottom: 4 }}
                          resizeMode="contain"
                        />
                      ) : pot.level === 3 ? (
                        <Image
                          source={require('../../assets/images/lev.png')}
                          style={{ width: 22, height: 22, marginBottom: 4 }}
                          resizeMode="contain"
                        />
                      ) : pot.level === 4 ? (
                        <Image
                          source={require('../../assets/images/process_mid.png')}
                          style={{ width: 22, height: 22, marginBottom: 4 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Image
                          source={require('../../assets/images/process_done.png')}
                          style={{ width: 22, height: 22, marginBottom: 4 }}
                          resizeMode="contain"
                        />
                      )}
                      <ThemedText type="smallBold" style={styles.potCardName} numberOfLines={1}>
                        {pot.name}
                      </ThemedText>
                      <ThemedText type="smallBold" style={styles.potCardLevel}>
                        {isLocked ? t('common.locked') : `Lv.${pot.level}`}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                disabled={activePot && activePot.level >= 5}
                style={[
                  styles.actionBtn,
                  activePot && activePot.level >= 5 && styles.actionBtnDisabled
                ]}
                onPress={() => {
                  resetSelection();
                  randomizeActivePotTemplate();
                  navigateTo('color-select');
                }}
              >
                <ThemedText
                  type="default"
                  style={[
                    styles.actionBtnText,
                    activePot && activePot.level >= 5 && styles.actionBtnTextDisabled
                  ]}
                >
                  {activePot && activePot.level >= 5 ? t('greenhouse.flower_fully_bloomed') : t('greenhouse.color_today')}
                </ThemedText>
              </Pressable>
            </View>
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN: COMPLETED SANCTUARY - 야경 온실 힐링 감상 화면 */}
        {/* ------------------------------------------------------------- */}
        {(currentScreen === 'sanctuary' || (currentScreen === 'archive' && state.archive.length >= 27)) && (
          <>
            <Image
              source={require('../../assets/images/mandar_step_bg.png')}
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', zIndex: -1, display: currentScreen === 'sanctuary' ? 'flex' : 'none' }]}
              resizeMode="cover"
            />
            <View style={[styles.screenWrapper, { justifyContent: 'flex-start', gap: 12, display: currentScreen === 'sanctuary' ? 'flex' : 'none' }]}>
              {/* Minimal header */}
              <View style={styles.titleArea}>
                <View>
                  <ThemedText type="title" style={[styles.mainTitle, styles.neonEmeraldGlow]}>{t('sanctuary.title')}</ThemedText>
                  <ThemedText type="small" style={styles.subtitleText}>{t('sanctuary.subtitle')}</ThemedText>
                </View>
                <Pressable style={styles.bookButton} onPress={() => navigateTo('archive')}>
                  <Image
                    source={require('../../assets/images/my.png')}
                    style={{ width: 20, height: 20, marginRight: 6 }}
                    resizeMode="contain"
                  />
                  <ThemedText type="smallBold" style={styles.bookButtonText}>{t('common.my_greenhouse')}</ThemedText>
                </Pressable>
              </View>

              {/* Greenhouse Night Scene */}
              <View style={[styles.sanctuarySkyGardenContainer, { backgroundColor: '#070D14', overflow: 'hidden' }]}>

                {/* bg.png – fill container exactly, cover = crop to fit */}
                <Image
                  source={require('../../assets/images/bg.png')}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  resizeMode="cover"
                />

                {/* Warm Light Motion emanating from Greenhouse glass arch */}
                <GreenhouseWarmLightMotion />

                {/* Bush Fireflies moving in left & right side bushes */}
                <SanctuaryBushFireflies />

                {/* ===== 27 BLOOMED FLOWERS (Memoized Optimized Layer with Deferred Particles) ===== */}
                <SanctuaryFlowersLayer archive={state.archive} />


                {/* ===== ANIMATED CREATURES (Original FloatingButterfly, FloatingBee, FloatingBird) ===== */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {/* 1 Original Bird perched on top of a blossom */}
                  <View style={{ position: 'absolute', left: '29%', top: '59.5%', zIndex: 60 }}>
                    <FloatingBird id={1} startX={0} startY={0} />
                  </View>

                  {/* 1 Original Flying Butterfly (Centered base position for 360-degree balanced flight) */}
                  <View style={{ position: 'absolute', left: '48%', top: '25%', zIndex: 50 }}>
                    <FloatingButterfly id={1} startX={0} startY={0} />
                  </View>

                  {/* 1 Original Buzzing Bee */}
                  <View style={{ position: 'absolute', left: '35%', top: '44%', zIndex: 50 }}>
                    <FloatingBee id={1} startX={0} startY={0} />
                  </View>
                </View>

                {/* ── SEASON COMPLETE BOTTOM TEXT ONLY ── */}
                <View style={styles.sanctuaryBottomPanel}>
                  <ThemedText style={styles.sanctuaryBottomNext}>{t('sanctuary.season_complete_message')}</ThemedText>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 2: COLOR CHOICE SELECTION WHEEL */}
        {/* ------------------------------------------------------------- */}
        {currentScreen === 'color-select' && (
          <View style={styles.screenWrapper}>
            <View style={styles.titleContainer}>
              <ThemedText type="code" style={styles.stepIndicator}>{t('color_select.step_indicator')}</ThemedText>
              <ThemedText style={styles.stepTitle}>
                {t('color_select.step_title')}
              </ThemedText>
              <ThemedText type="small" style={styles.stepSubText}>
                ({t('common.bloomed_count', { count: currentGardenCompleted })} / {t('common.color_count', { count: unlockedCount })})
              </ThemedText>
            </View>

            {/* Vector Native Svg 24-Color Donut Wheel */}
            <View style={styles.wheelArea}>
              <View style={styles.wheelWrapper}>
                {Platform.OS === 'web' ? (
                  <svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox="0 0 200 200" shapeRendering="geometricPrecision">
                    {getHealingColors().map((colorItem, i) => {
                      const colorsList = getHealingColors();
                      const angleStep = 360 / colorsList.length;
                      const startAngle = i * angleStep;
                      const endAngle = (i + 1) * angleStep;
                      const pathData = getDonutPath(100, 100, 95, 55, startAngle, endAngle);
                      const isLocked = i >= unlockedCount;
                      const fillColor = isLocked ? '#1A1C24' : colorItem.hex;

                      return (
                        <path
                          key={colorItem.hex}
                          d={pathData}
                          fill={fillColor}
                          stroke={fillColor}
                          strokeWidth="0.5"
                          style={{ cursor: 'pointer' }}
                          onClick={() => selectColor(colorItem)}
                        />
                      );
                    })}
                  </svg>
                ) : (
                  <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox="0 0 200 200">
                    {getHealingColors().map((colorItem, i) => {
                      const colorsList = getHealingColors();
                      const angleStep = 360 / colorsList.length;
                      const startAngle = i * angleStep;
                      const endAngle = (i + 1) * angleStep;
                      const pathData = getDonutPath(100, 100, 95, 55, startAngle, endAngle);
                      const isLocked = i >= unlockedCount;
                      const fillColor = isLocked ? '#1A1C24' : colorItem.hex;

                      return (
                        <Path
                          key={colorItem.hex}
                          d={pathData}
                          fill={fillColor}
                          stroke={fillColor}
                          strokeWidth={0.5}
                          onPress={() => selectColor(colorItem)}
                        />
                      );
                    })}
                  </Svg>
                )}

                {/* Center Hole: Interactive Start Button when 3 colors selected */}
                <View style={styles.wheelHole}>
                  {state.selectedColors.length === 3 ? (
                    <>
                      <WheelPulseGlow />
                      <Pressable
                        onPress={() => {
                          resetCanvas();
                          navigateTo('coloring');
                        }}
                        style={styles.wheelCenterBtn}
                      >
                        <ThemedText style={[
                          styles.wheelCenterBtnText,
                          isEn() && { lineHeight: 15 }
                        ]}>
                          {t('color_select.enter_drawing')}
                        </ThemedText>
                      </Pressable>
                    </>
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <ThemedText style={styles.holeLabel}>
                        {t('color_select.selection_count', { count: state.selectedColors.length })}
                      </ThemedText>
                      <View style={styles.holeDotRow}>
                        {[0, 1, 2].map((idx) => {
                          const item = state.selectedColors[idx];
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.holeDot,
                                item ? { backgroundColor: item.hex, borderColor: item.hex } : { backgroundColor: 'transparent' }
                              ]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* Lock Overlays based on unlockedCount — immune to threshold changes */}

                {/* 12 unlocked: 18 gray wedges on left half — positioned precisely on dark arc */}
                {unlockedCount === 12 && (() => {
                  const scaleRatio = WHEEL_SIZE / 200;
                  const viewX = 25 * scaleRatio;
                  const viewY = 100 * scaleRatio;

                  return (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: viewX - 44,
                        top: viewY - 54,
                        width: 88,
                        height: 108,
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 25,
                      }}
                    >
                      <Image
                        source={require('../../assets/images/lock.png')}
                        style={{ width: 22, height: 22, marginBottom: 4 }}
                        resizeMode="contain"
                      />
                      <ThemedText style={{
                        fontSize: 11,
                        color: '#9A9FB0',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: 3,
                        lineHeight: isEn() ? 13 : 14,
                      }}>{t('color_select.locked_color_title')}</ThemedText>
                      <ThemedText style={{
                        fontSize: 9,
                        color: '#9A9FB0',
                        textAlign: 'center',
                        lineHeight: isEn() ? 11 : 13,
                        opacity: 0.85,
                      }}>
                        {t('color_select.locked_color_desc')}
                      </ThemedText>
                    </View>
                  );
                })()}

                {/* 18 unlocked: 12 gray wedges on left arc — title centered in gray arc */}
                {unlockedCount === 18 && (() => {
                  const scaleRatio = WHEEL_SIZE / 200;
                  const viewX = 25 * scaleRatio;
                  const viewY = 100 * scaleRatio;

                  return (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: viewX - 42,
                        top: viewY - 30,
                        width: 84,
                        height: 60,
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 25,
                      }}
                    >
                      <Image
                        source={require('../../assets/images/lock.png')}
                        style={{ width: 20, height: 20, marginBottom: 3 }}
                        resizeMode="contain"
                      />
                      <ThemedText style={{
                        fontSize: 11,
                        color: '#9A9FB0',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        lineHeight: isEn() ? 13 : 14,
                      }}>{t('color_select.locked_color_title')}</ThemedText>
                    </View>
                  );
                })()}

                {/* 24 unlocked: 6 gray wedges — lock icon only, positioned on locked area */}
                {unlockedCount === 24 && (() => {
                  const lockedWedgesCount = 30 - unlockedCount;
                  const avgLockedIndex = unlockedCount + (lockedWedgesCount - 1) / 2;
                  const angleStep = 360 / 30;
                  const avgLockedAngle = avgLockedIndex * angleStep + angleStep / 2;
                  const avgAngleRad = (avgLockedAngle - 90) * Math.PI / 180;
                  const lockRadius = 75;
                  const lockX = 100 + lockRadius * Math.cos(avgAngleRad);
                  const lockY = 100 + lockRadius * Math.sin(avgAngleRad);
                  const scaleRatio = WHEEL_SIZE / 200;
                  const viewX = lockX * scaleRatio;
                  const viewY = lockY * scaleRatio;

                  return (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.lockIndicatorBadge,
                        {
                          left: viewX - 32,
                          top: viewY - 18,
                        }
                      ]}
                    >
                      <Image
                        source={require('../../assets/images/lock.png')}
                        style={{ width: 18, height: 18 }}
                        resizeMode="contain"
                      />
                    </View>
                  );
                })()}
              </View>
            </View>

            {/* Chosen Color Capsule Bar */}
            <View style={styles.chosenSection}>
              <View style={styles.chosenCapsulesGrid}>
                {[0, 1, 2].map((idx) => {
                  const item = state.selectedColors[idx];
                  return (
                    <View key={idx} style={styles.capsuleCard}>
                      {item ? (
                        <>
                          <Pressable
                            style={styles.capsuleCloseBtn}
                            onPress={() => removeSelectedColor(item.hex)}
                          >
                            <ThemedText style={styles.closeBtnText}>×</ThemedText>
                          </Pressable>

                          <AnimatedColorCircle
                            color={item.hex}
                            size={32}
                            style={styles.capsuleDot}
                          />
                          <ThemedText type="smallBold" style={styles.capsuleText} numberOfLines={1}>
                            {item.name}
                          </ThemedText>
                          <ThemedText style={styles.capsuleSubText}>{t('color_select.extracted')}</ThemedText>
                        </>
                      ) : (
                        <View style={styles.capsuleEmpty}>
                          <View style={styles.capsuleEmptyCircle}>
                            <ThemedText style={styles.emptyCircleNum}>{idx + 1}</ThemedText>
                          </View>
                          <ThemedText type="small" style={styles.capsuleEmptyText}>{t('color_select.extract_emotion')}</ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 3: MANDALA CANVAS & LIQUID ESSENCE FLASKS */}
        {/* ------------------------------------------------------------- */}
        {currentScreen === 'coloring' && (() => {
          const sortedShapes = [...activeTemplate.shapes]
            .filter((shape) => {
              if (shape.d) {
                const d = shape.d;
                // Filter out outer square canvas background subpaths (Peony, Flower SVG outer rect paths)
                if (
                  d.startsWith("M0.") ||
                  d.startsWith("M0,") ||
                  d.startsWith("M0 ") ||
                  d.includes("c0-68.549") ||
                  d.includes("c69.889,0") ||
                  d.includes("205.646") ||
                  d.includes("209.665") ||
                  d.includes("210.67") ||
                  d.includes("356.229") ||
                  d.includes("c70,0,140,0,210,0")
                ) {
                  return false;
                }
              }
              return true;
            })
            .sort((a, b) => {
              const aIsBorder = a.id.toLowerCase().includes("border") || a.id.toLowerCase().includes("outer");
              const bIsBorder = b.id.toLowerCase().includes("border") || b.id.toLowerCase().includes("outer");
              if (aIsBorder && !bIsBorder) return -1;
              if (!aIsBorder && bIsBorder) return 1;
              return 0;
            });

          return (
            <View style={styles.screenWrapper}>
              {/* Dynamic Mandala Description header */}
              <View style={{ alignItems: 'center', marginBottom: Spacing.one, paddingHorizontal: 16 }}>
                <ThemedText type="smallBold" style={{ color: '#ddefb7', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('mandala_coloring.step_indicator')}
                </ThemedText>
                <ThemedText type="small" style={{ color: '#9A9FB0', fontSize: 10, marginTop: 4, textAlign: 'center', lineHeight: 14 }}>
                  {activeTemplate.title}
                </ThemedText>
              </View>

              {/* Liquid Beaker essence row */}
              <View style={styles.essenceBeakersRow}>
                {[0, 1, 2].map((idx) => {
                  const colorItem = state.selectedColors[idx];
                  if (!colorItem) return null;
                  const ratio = state.bottleRatios[idx] || 0;

                  return (
                    <EssenceBeaker key={idx} colorItem={colorItem} ratio={ratio} />
                  );
                })}
              </View>

              {/* Interactive Vector Mandala Canvas */}
              <View style={styles.canvasContainer}>
                <View style={styles.canvasBorder} ref={designRef} collapsable={false}>
                  {Platform.OS === 'web' ? (
                    <svg width={CANVAS_SIZE} height={CANVAS_SIZE} viewBox="0 0 200 200">
                      <defs>
                        <clipPath id="mandalaCircleClipWeb">
                          <circle cx="100" cy="100" r="98" />
                        </clipPath>
                      </defs>

                      {/* Outer circle guideline */}
                      <circle cx="100" cy="100" r="98" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="4 4" />

                      {/* Clipped Mandala Content - removes any outer square background box */}
                      <g clipPath="url(#mandalaCircleClipWeb)">
                        {/* 1. Interactive Fill Layer (Position gap shifted & sealed with 1.8 stroke) */}
                        {sortedShapes.map((shape) => {
                          const isOutline = shape.id.toLowerCase().includes('outline');
                          const isNotouch = shape.id.toLowerCase().includes('notouch');
                          const fill = isOutline ? '#000000' : (state.mandalaColors[shape.id] || '#8ea1d1ff');
                          const notClickable = isOutline || isNotouch;
                          if (shape.type === 'circle') {
                            return (
                              <circle
                                key={shape.id}
                                cx={shape.cx}
                                cy={shape.cy}
                                r={shape.r}
                                fill={fill}
                                stroke={fill}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ cursor: notClickable ? 'default' : 'pointer' }}
                                onClick={() => !notClickable && colorSegment(shape.id)}
                              />
                            );
                          } else {
                            return (
                              <path
                                key={shape.id}
                                d={shape.d}
                                transform={shape.transform}
                                fill={fill}
                                stroke={fill}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ cursor: notClickable ? 'default' : 'pointer' }}
                                onClick={() => !notClickable && colorSegment(shape.id)}
                              />
                            );
                          }
                        })}

                        {/* 2. Ultra-Thin 0.5px Crisp Single Line Overlay Layer */}
                        <g style={{ pointerEvents: 'none', opacity: 0.9 }}>
                          {sortedShapes.map((shape) => {
                            const isOutline = shape.id.toLowerCase().includes('outline');
                            if (isOutline) return null;
                            const strokeColor = '#3c4c73';
                            if (shape.type === 'circle') {
                              return (
                                <circle
                                  key={`line_${shape.id}`}
                                  cx={shape.cx}
                                  cy={shape.cy}
                                  r={shape.r}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth="0.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              );
                            } else {
                              return (
                                <path
                                  key={`line_${shape.id}`}
                                  d={shape.d}
                                  transform={shape.transform}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth="0.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              );
                            }
                          })}
                        </g>
                      </g>
                    </svg>
                  ) : (
                    <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} viewBox="0 0 200 200">
                      <Defs>
                        <ClipPath id="mandalaCircleClipNative">
                          <Circle cx="100" cy="100" r="98" />
                        </ClipPath>
                      </Defs>

                      {/* Outer circle guideline */}
                      <Circle cx="100" cy="100" r="98" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="4 4" />

                      {/* Clipped Mandala Content - removes any outer square background box */}
                      <G clipPath="url(#mandalaCircleClipNative)">
                        {/* 1. Interactive Fill Layer (Position gap shifted & sealed with 1.8 stroke) */}
                        {sortedShapes.map((shape) => {
                          const isOutline = shape.id.toLowerCase().includes('outline');
                          const isNotouch = shape.id.toLowerCase().includes('notouch');
                          const fill = isOutline ? '#000000' : (state.mandalaColors[shape.id] || '#8ea1d1ff');
                          const notClickable = isOutline || isNotouch;
                          if (shape.type === 'circle') {
                            return (
                              <Circle
                                key={shape.id}
                                cx={shape.cx}
                                cy={shape.cy}
                                r={shape.r}
                                fill={fill}
                                stroke={fill}
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                onPress={() => !notClickable && colorSegment(shape.id)}
                              />
                            );
                          } else {
                            return (
                              <Path
                                key={shape.id}
                                d={shape.d}
                                transform={shape.transform}
                                fill={fill}
                                stroke={fill}
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                onPress={() => !notClickable && colorSegment(shape.id)}
                              />
                            );
                          }
                        })}

                        {/* 2. Ultra-Thin 0.5px Crisp Single Line Overlay Layer */}
                        <G opacity={0.9}>
                          {sortedShapes.map((shape) => {
                            const isOutline = shape.id.toLowerCase().includes('outline');
                            if (isOutline) return null;
                            const strokeColor = '#3c4c73';
                            if (shape.type === 'circle') {
                              return (
                                <Circle
                                  key={`line_${shape.id}`}
                                  cx={shape.cx}
                                  cy={shape.cy}
                                  r={shape.r}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={0.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  pointerEvents="none"
                                />
                              );
                            } else {
                              return (
                                <Path
                                  key={`line_${shape.id}`}
                                  d={shape.d}
                                  transform={shape.transform}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={0.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  pointerEvents="none"
                                />
                              );
                            }
                          })}
                        </G>
                      </G>
                    </Svg>
                  )}
                </View>
              </View>

              {/* Brush & Complete actions bar */}
              <View style={styles.brushSection}>
                <View style={styles.brushRow}>
                  {state.selectedColors.map((colorItem) => {
                    const isActive = state.currentColor === colorItem.hex;
                    return (
                      <Pressable
                        key={colorItem.hex}
                        onPress={() => selectBrush(colorItem.hex)}
                        style={[
                          styles.brushCircle,
                          {
                            backgroundColor: colorItem.hex,
                            shadowColor: colorItem.hex
                          },
                          isActive && styles.brushCircleActive,
                          Platform.OS === 'web' ? {
                            boxShadow: isActive ? `0 0 24px ${colorItem.hex}` : `0 0 14px ${colorItem.hex}`,
                          } : Platform.OS === 'ios' ? styles.glowingShadow : {}
                        ]}
                      />
                    );
                  })}
                </View>

                <View style={styles.coloringActions}>
                  <Pressable style={styles.resetBtn} onPress={resetCanvas}>
                    <ThemedText type="smallBold" style={styles.resetBtnText}>{t('mandala_coloring.reset_canvas')}</ThemedText>
                  </Pressable>

                  <Pressable
                    disabled={progressPercent < 30}
                    onPress={handleCompletePress}
                    style={[
                      styles.completeColorBtn,
                      progressPercent < 30 && styles.completeColorBtnDisabled
                    ]}
                  >
                    <ThemedText type="smallBold" style={styles.completeColorBtnText}>
                      {t('mandala_coloring.finish_flower')} ({progressPercent}%)
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Floating Action Buttons */}
                <View style={{ position: 'absolute', right: -6, bottom: 80, alignItems: 'center', gap: 6, zIndex: 100 }}>
                  <Pressable
                    onPress={handleExportDesign}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255,234,167,0.3)',
                      ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.5)' } : { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4 }),
                    }}
                  >
                    <Image
                      source={require('../../assets/images/ic_share.png')}
                      style={{ width: 22, height: 22 }}
                      resizeMode="contain"
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Linking.openURL('https://cafe.naver.com/mandalaonsil');
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255,234,167,0.3)',
                      ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.5)' } : { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4 }),
                    }}
                  >
                    <Image
                      source={require('../../assets/images/btn_gnb_cafe.png')}
                      style={{ width: 22, height: 22 }}
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })()}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 4: REFLECTION DEEP CARD VIEW */}
        {/* ------------------------------------------------------------- */}
        {currentScreen === 'mind-card' && (
          <>
            {(!activePot || activePot.level < 6) && (
              <Image
                source={require('../../assets/images/mandar_step_bg.png')}
                style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', zIndex: -1 }]}
                resizeMode="cover"
              />
            )}
            <Animated.View entering={FadeIn.duration(400)} style={styles.screenWrapper}>
              <View style={styles.titleContainer}>
                <ThemedText type="code" style={styles.stepIndicator}>{t('diary.step_indicator')}</ThemedText>
              </View>

              {/* Premium glass reflective card */}
              {(() => {
                const currentLevel = activePot?.level || 1;
                const gardenSeason = state.hasBee || state.hasBird ? 3 : (state.hasButterfly || state.archive.length >= 9 || activePot?.templateId?.startsWith('butterfly_') ? 2 : 1);
                const stepDetailsObj = getStepDetailsForSeason(gardenSeason);
                const stepDetails = stepDetailsObj[currentLevel] || stepDetailsObj[1];

                return (
                  <View
                    ref={cardRef}
                    collapsable={false}
                    style={[styles.reflectionCard, currentLevel === 5 && { overflow: 'hidden', maxWidth: 480, alignSelf: 'center' }]}
                  >
                    {currentLevel === 5 && (
                      <>
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060a14', justifyContent: 'center', alignItems: 'center' }]}>
                          <Image
                            source={require('../../assets/images/done.png')}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        </View>

                      </>
                    )}
                    <View style={styles.cardBody}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, paddingHorizontal: 16 }}>
                        <ThemedText
                          style={[styles.cardStepTitle, currentLevel === 5 && styles.cardStepTitleLv5Shadow, { marginBottom: 0, flexShrink: 1, wordBreak: 'keep-all' }] as any}
                          lineBreakStrategyIOS="hangul-word"
                        >
                          {/^[^\w\s가-힣]/.test(stepDetails.title) && (
                            <>
                              <Image
                                source={
                                  currentLevel === 1
                                    ? require('../../assets/images/seed.png')
                                    : currentLevel === 2
                                      ? require('../../assets/images/process_ing.png')
                                      : currentLevel === 3
                                        ? require('../../assets/images/lev.png')
                                        : currentLevel === 4
                                          ? require('../../assets/images/process_mid.png')
                                          : require('../../assets/images/process_done.png')
                                }
                                style={{ width: 18, height: 18, transform: [{ translateY: 6 }] }}
                                resizeMode="contain"
                              />
                              {' '}
                            </>
                          )}
                          {stepDetails.title.replace(/^[^\w\s가-힣]+\s*/, '')}
                        </ThemedText>
                      </View>

                      <View style={[styles.cardPlantTag, currentLevel === 5 && styles.cardPlantTagLv5]}>
                        <ThemedText type="smallBold" style={[styles.cardPlantTagText, currentLevel === 5 && styles.cardPlantTagTextLv5]}>
                          {activePot?.name}
                        </ThemedText>
                      </View>

                      <View style={{ width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginTop: 0, marginBottom: 12, position: 'relative', transform: [{ scale: 1.1 }] }}>
                        {currentLevel === 5 ? (
                          <>
                            {/* Stem and leaves under the floating flower */}
                            <Image
                              source={require('../../assets/images/flow_body.png')}
                              style={{ width: 140, height: 140, position: 'absolute', transform: [{ translateY: 24 }] }}
                              resizeMode="contain"
                            />

                            {/* Floating glowing blossom layer */}
                            <GlowingBlossom
                              type={activePot.type}
                              color={
                                activePot.type === 'red' ? '#ef4444' :
                                  activePot.type === 'yellow' ? '#FFB86C' :
                                    activePot.type === 'blue' ? '#8BE9FD' :
                                      activePot.type === 'purple' ? '#BD93F9' :
                                        '#9DBA7D'
                              }
                              colors={activePot.colors}
                            />

                            {/* Floating concentric glow circles above the flower & sparkles (animated) */}
                            <Lv5GlowCircle left={45} top={5} color="#FFF275" delay={0} />
                            <Lv5GlowCircle left={70} top={-2} color="#FF7E5F" delay={400} />
                            <Lv5GlowCircle left={95} top={5} color="#8BE9FD" delay={800} />

                            <FloatingCardSparkle id={1} left={10} top={12} size={5} />
                            <FloatingCardSparkle id={2} left={115} top={8} size={4} />
                            <FloatingCardSparkle id={3} left={5} top={60} size={6} />
                            <FloatingCardSparkle id={4} left={122} top={65} size={5} />
                            <FloatingCardSparkle id={5} left={25} top={85} size={4} />
                            <FloatingCardSparkle id={6} left={105} top={90} size={6} />
                          </>
                        ) : (
                          <Image
                            source={
                              currentLevel === 1 ? require('../../assets/images/step1.png') :
                                currentLevel === 2 ? require('../../assets/images/step2.png') :
                                  currentLevel === 3 ? require('../../assets/images/step3.png') :
                                    require('../../assets/images/step4.png')
                            }
                            style={{ width: 140, height: 140, transform: [{ translateY: 20 }] }}
                            resizeMode="contain"
                          />
                        )}
                      </View>

                      <View style={styles.cardMessageBox}>
                        <ThemedText
                          type="default"
                          style={[
                            styles.cardMessage,
                            currentLevel === 5 && styles.cardMessageLv5,
                            { wordBreak: 'keep-all' } as any
                          ]}
                          lineBreakStrategyIOS="hangul-word"
                        >
                          &quot;{activePot?.desc || stepDetails.message}&quot;
                        </ThemedText>
                      </View>

                      {(() => {
                        let displayQuestion: string | null = null;
                        if (stepDetails.questions && Array.isArray(stepDetails.questions) && stepDetails.questions.length > 0) {
                          const idx = state.currentPotIndex % stepDetails.questions.length;
                          displayQuestion = stepDetails.questions[idx];
                        } else {
                          displayQuestion = stepDetails.question || null;
                        }

                        const currentLevel = activePot?.level || 1;
                        if (!displayQuestion || currentLevel === 5) return null;

                        const hasDiary = !!(activePot?.diaries && activePot.diaries[currentLevel]?.content);

                        return (
                          <View style={styles.cardQuestionBox}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 8, paddingHorizontal: 10 }}>
                              <ThemedText
                                style={[styles.cardQuestionText, { flexShrink: 1, wordBreak: 'keep-all' }] as any}
                                lineBreakStrategyIOS="hangul-word"
                              >
                                {/^[^\w\s가-힣]/.test(displayQuestion) && (
                                  <>
                                    <Image
                                      source={
                                        currentLevel === 1
                                          ? require('../../assets/images/seed.png')
                                          : currentLevel === 2
                                            ? require('../../assets/images/process_ing.png')
                                            : currentLevel === 3
                                              ? require('../../assets/images/lev.png')
                                              : currentLevel === 4
                                                ? require('../../assets/images/process_mid.png')
                                                : require('../../assets/images/process_done.png')
                                      }
                                      style={{ width: 18, height: 18, transform: [{ translateY: 6 }] }}
                                      resizeMode="contain"
                                    />
                                    {' '}
                                  </>
                                )}
                                {displayQuestion.replace(/^[^\w\s가-힣]+\s*/, '')}
                              </ThemedText>
                            </View>
                            {currentLevel < 5 && (
                              <Pressable
                                onPress={() => handleOpenDiaryWriteModal(displayQuestion!)}
                                style={styles.diaryBtn}
                              >
                                <ThemedText style={[styles.diaryBtnText, hasDiary && { color: '#ddefb7' }]}>
                                  {hasDiary ? t('diary.edit_diary') : t('diary.write_diary')}
                                </ThemedText>
                              </Pressable>
                            )}
                          </View>
                        );
                      })()}
                    </View>


                  </View>
                );
              })()}

              {/* Export and Return buttons */}
              <View style={styles.exportSection}>
                {activePot?.level === 5 && (
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <Pressable
                      onPress={handleExportCard}
                      style={[styles.bookButton, { flex: 1, justifyContent: 'center', gap: 8, paddingVertical: 14 }]}
                    >
                      <Image
                        source={require('../../assets/images/ic_share.png')}
                        style={{ width: 24, height: 24 }}
                        resizeMode="contain"
                      />
                      <ThemedText type="smallBold" style={[
                        styles.bookButtonText,
                        { fontSize: 12 },
                        isEn() && { lineHeight: 13 }
                      ]}>
                        {t('export.share_flower')}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        Linking.openURL('https://cafe.naver.com/mandalaonsil');
                      }}
                      style={[styles.bookButton, { flex: 1, justifyContent: 'center', gap: 8, paddingVertical: 14 }]}
                    >
                      <Image
                        source={require('../../assets/images/btn_gnb_cafe.png')}
                        style={{ width: 20, height: 20 }}
                        resizeMode="contain"
                      />
                      <ThemedText type="smallBold" style={[
                        styles.bookButtonText,
                        { fontSize: 12 },
                        isEn() && { lineHeight: 13 }
                      ]}>
                        {t('export.onsil_story')}
                      </ThemedText>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  onPress={() => {
                    resetSelection();
                    // Determine milestone popup based on archive length AFTER level-up
                    const archiveLen = state.archive.length;
                    if (archiveLen !== lastShownArchiveLengthRef.current && archiveLen > 0) {
                      lastShownArchiveLengthRef.current = archiveLen;
                      const cycleCount = archiveLen % 9;
                      const gardenCycle = Math.floor((archiveLen - 1) / 9);

                      if (cycleCount === 0) {
                        setCurrentScreen('mansil');
                        if (gardenCycle === 0) {
                          setShowButterflyOverlay(true);
                          setIsButterflyPopupOpen(true);
                        } else if (gardenCycle === 1) {
                          setIsBeePopupOpen(true);
                        } else {
                          setIsBirdPopupOpen(true);
                        }
                      } else if (cycleCount === 1) {
                        navigateTo('mansil');
                        setTimeout(() => showToast(t('toast.small_change')), 400);
                      } else if (cycleCount === 3) {
                        navigateTo('mansil');
                        setTimeout(() => showToast(t('toast.flower_scent_new_life')), 400);
                      } else if (cycleCount === 6) {
                        let msg = '';
                        if (gardenCycle === 0) {
                          msg = t('toast.butterfly_coming');
                        } else if (gardenCycle === 1) {
                          msg = t('toast.bee_coming');
                        } else {
                          msg = t('toast.bird_coming');
                        }
                        navigateTo('mansil');
                        setTimeout(() => showToast(msg), 400);
                      } else {
                        navigateTo('mansil');
                      }
                    } else {
                      navigateTo('mansil');
                    }
                  }}
                  style={styles.cardReturnBtn}
                >
                  <ThemedText type="smallBold" style={styles.cardReturnBtnText}>
                    {t('common.to_greenhouse')}
                  </ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 5: GARDEN ARCHIVE CODEX */}
        {/* ------------------------------------------------------------- */}
        {currentScreen === 'archive' && (
          <View style={styles.screenWrapper}>
            <View style={styles.archiveHeaderContainer}>
              <View style={styles.titleContainer}>
                <ThemedText type="code" style={styles.stepIndicator}>GARDEN ARCHIVE</ThemedText>
                <ThemedText style={styles.stepTitle}>{t('archive.title')}</ThemedText>
                <ThemedText type="small" style={styles.stepSubText}>
                  {t('archive.subtitle')}
                </ThemedText>
              </View>
              <Pressable
                style={styles.archiveSettingsBtn}
                onPress={() => setIsSettingsModalOpen(true)}
                accessibilityLabel="설정"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ddefb7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                  <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </Svg>
              </Pressable>
            </View>

            {/* Codex scroll history */}
            {(() => {
              const growingPlants = state.pots.filter(p => p.level > 0 && p.level < 5).map(p => ({
                name: p.name,
                date: `${t('greenhouse.status_growing')} (Lv.${p.level})`,
                desc: p.desc,
                colors: p.colors || [],
                diaries: p.diaries,
                isGrowing: true
              }));

              const completedPlants = state.archive.map(p => ({
                name: p.name,
                date: p.date,
                desc: p.desc,
                colors: p.colors || [],
                diaries: p.diaries,
                isGrowing: false
              }));

              const allDisplayPlants = [...growingPlants, ...completedPlants];

              return (
                <ScrollView
                  style={styles.archiveScroll}
                  contentContainerStyle={styles.archiveScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {allDisplayPlants.length === 0 ? (
                    <View style={styles.archiveEmpty}>
                      <Image
                        source={require('../../assets/images/ic_write.png')}
                        style={{ width: 48, height: 48, marginBottom: 12 }}
                        resizeMode="contain"
                      />
                      <ThemedText type="smallBold" style={styles.archiveEmptyText}>
                        {t('archive.empty_title')}
                      </ThemedText>
                      <ThemedText type="small" style={styles.archiveEmptySubText}>
                        {t('archive.empty_desc')}
                      </ThemedText>
                    </View>
                  ) : (
                    allDisplayPlants.map((plant, idx) => (
                      <View key={idx} style={[styles.archiveItem, plant.isGrowing && { backgroundColor: 'rgba(139, 233, 253, 0.02)', borderColor: '#1a2238' }]}>
                        <View style={styles.archiveItemHeader}>
                          <View style={[styles.archiveItemBadge, plant.isGrowing && { backgroundColor: 'rgba(168, 227, 154, 0.08)', borderColor: 'rgba(168, 227, 154, 0.25)' }]}>
                            <ThemedText type="smallBold" style={[styles.archiveItemBadgeText, plant.isGrowing && { color: '#ddefb7' }]}>
                              {plant.name}
                            </ThemedText>
                          </View>
                          {!isEn() && (
                            <ThemedText type="small" style={styles.archiveItemDate}>
                              {plant.date}
                            </ThemedText>
                          )}
                        </View>

                        <ThemedText type="small" style={styles.archiveItemDesc}>
                          {plant.desc}
                        </ThemedText>

                        <View style={[
                          styles.archiveItemColors,
                          isEn() && { justifyContent: 'space-between', alignItems: 'center' }
                        ]}>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            {plant.colors.map((c, i) => {
                              const stepLevel = i + 1;
                              const diaryEntry = plant.diaries?.[stepLevel];
                              return (
                                <Pressable
                                  key={i}
                                  onPress={() => handleOpenDiaryViewModal(plant.name, stepLevel, diaryEntry)}
                                  style={({ pressed }) => [
                                    styles.archiveColorDotBtn,
                                    { backgroundColor: c },
                                    pressed && { opacity: 0.7 }
                                  ]}
                                >
                                  {!!diaryEntry && (
                                    <Image
                                      source={require('../../assets/images/view.png')}
                                      style={{ width: 16, height: 16 }}
                                      resizeMode="contain"
                                    />
                                  )}
                                </Pressable>
                              );
                            })}
                          </View>

                          {isEn() && (
                            <ThemedText type="small" style={styles.archiveItemDate}>
                              {plant.date}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              );
            })()}

            <View style={styles.archiveFooter}>
              <Pressable style={styles.returnBtn} onPress={() => navigateTo('mansil')}>
                <ThemedText type="smallBold" style={styles.returnBtnText}>{t('common.to_greenhouse')}</ThemedText>
              </Pressable>

              <Pressable
                style={styles.resetGameBtn}
                onPress={() => {
                  showModal(
                    t('archive.reset_modal_title'),
                    t('archive.reset_modal_desc')
                  );
                }}
              >
                <ThemedText type="small" style={styles.resetGameBtnText}>{t('common.empty_greenhouse')}</ThemedText>
              </Pressable>
            </View>
          </View>
        )}

      </SafeAreaView>

      {/* ------------------------------------------------------------- */}
      {/* TOAST NOTIFICATION */}
      {/* ------------------------------------------------------------- */}
      {
        toastMessage && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.toastContainer,
              toastAnimStyle
            ]}
          >
            <ThemedText style={styles.toastText}>🌸 {toastMessage}</ThemedText>
          </Animated.View>
        )
      }

      {/* ------------------------------------------------------------- */}
      {/* BUTTERFLY OVERLAY ON GREENHOUSE (9th plant) */}
      {/* ------------------------------------------------------------- */}
      {
        currentScreen === 'mansil' && showButterflyOverlay && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 30, justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            <FloatingButterfly id={0} startX={0} startY={-80} />
          </View>
        )
      }

      {/* ------------------------------------------------------------- */}
      {/* PERMANENT BUTTERFLY IN GREENHOUSE */}
      {/* ------------------------------------------------------------- */}
      {
        currentScreen === 'mansil' && state.hasButterfly && !showButterflyOverlay && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 25, justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            <FloatingButterfly id={99} startX={-20} startY={-80} />
          </View>
        )
      }

      {/* ------------------------------------------------------------- */}
      {/* PERMANENT BEE IN GREENHOUSE */}
      {/* ------------------------------------------------------------- */}
      {
        currentScreen === 'mansil' && state.hasBee && !showBeeOverlay && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 26, justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            <FloatingBee id={88} startX={25} startY={-65} />
          </View>
        )
      }

      {/* ------------------------------------------------------------- */}
      {/* BEE OVERLAY ON GREENHOUSE (18th plant / 2nd garden 9th) */}
      {/* ------------------------------------------------------------- */}
      {
        currentScreen === 'mansil' && showBeeOverlay && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 30, justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            <FloatingBee id={1} startX={0} startY={-80} />
          </View>
        )
      }

      {/* ------------------------------------------------------------- */}
      {/* PERMANENT BIRD IN GREENHOUSE (9개 단계 바 상단 테두리 위 짹짹) */}
      {/* ------------------------------------------------------------- */}
      {
        currentScreen === 'mansil' && state.hasBird && !showBirdOverlay && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 35, justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            <FloatingBird id={77} mode="greenhouse" startX={75} startY={-33} />
          </View>
        )
      }

      {/* ------------------------------------------------------------- */}
      {/* BIRD OVERLAY ON GREENHOUSE (27th plant / 3rd garden 9th) */}
      {/* ------------------------------------------------------------- */}
      {
        currentScreen === 'mansil' && showBirdOverlay && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 30, justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            <FloatingBird id={2} mode="greenhouse" startX={0} startY={-42} />
          </View>
        )
      }

      {/* ------------------------------------------------------------- */}
      {/* BUTTERFLY POPUP MODAL (9th plant) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isButterflyPopupOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsButterflyPopupOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { overflow: 'hidden' }]}>
            <View style={[styles.cardBody, { paddingTop: 24 }]}>
              <ThemedText type="subtitle" style={[styles.modalTitleText, { textAlign: 'center', fontSize: 17, marginBottom: 12 }]}>
                {t('milestone.butterfly_title')}
              </ThemedText>
              <ThemedText type="default" style={[styles.modalMessageText, { textAlign: 'center', lineHeight: 22 }]}>
                {t('milestone.butterfly_desc')}
              </ThemedText>
            </View>

            <View style={[styles.modalActions, { marginTop: 20, paddingBottom: 20, flexDirection: 'column' }]}>
              <View style={{ position: 'relative', alignSelf: 'stretch' }}>
                <View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 20, borderWidth: 6, borderColor: 'rgba(189,147,249,0.10)', backgroundColor: 'transparent' }} />
                <View style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 17, borderWidth: 3, borderColor: 'rgba(189,147,249,0.22)', backgroundColor: 'transparent' }} />
                <Pressable
                  style={styles.butterflyMeetBtn}
                  onPress={() => {
                    setIsButterflyPopupOpen(false);
                    setShowButterflyOverlay(true);
                    // Show butterfly overlay for 5 seconds then show second garden popup
                    setTimeout(() => {
                      setShowButterflyOverlay(false);
                      setIsSecondGardenPopupOpen(true);
                    }, 5000);
                  }}
                >
                  <ThemedText type="smallBold" style={styles.butterflyMeetBtnText}>
                    {t('milestone.butterfly_btn')}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* SECOND GARDEN POPUP */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isSecondGardenPopupOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSecondGardenPopupOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { overflow: 'hidden' }]}>

            <View style={[styles.cardBody, { paddingTop: 28, paddingBottom: 8, alignItems: 'center' }]}>
              <Image
                source={require('../../assets/images/process_done.png')}
                style={styles.secondGardenEmoji}
                resizeMode="contain"
              />
              <ThemedText type="subtitle" style={[styles.modalTitleText, { textAlign: 'center', fontSize: 18, marginBottom: 8 }]}>
                {t('milestone.second_garden_title')}
              </ThemedText>
              <ThemedText type="default" style={[styles.modalMessageText, { textAlign: 'center', lineHeight: 22 }]}>
                {t('milestone.second_garden_desc')}
              </ThemedText>
            </View>

            <View style={[styles.modalActions, { marginTop: 16, paddingBottom: 24, flexDirection: 'column' }]}>
              <View style={{ position: 'relative', alignSelf: 'stretch' }}>
                <View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 20, borderWidth: 6, borderColor: 'rgba(80,250,123,0.10)', backgroundColor: 'transparent' }} />
                <View style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 17, borderWidth: 3, borderColor: 'rgba(80,250,123,0.22)', backgroundColor: 'transparent' }} />
                <Pressable
                  style={styles.secondGardenStartBtn}
                  onPress={async () => {
                    setIsSecondGardenPopupOpen(false);
                    await startSecondGarden();
                    lastShownArchiveLengthRef.current = state.archive.length;
                  }}
                >
                  <ThemedText type="smallBold" style={styles.secondGardenStartBtnText}>
                    {t('milestone.start_btn')}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* BEE POPUP MODAL (18th plant / 2nd garden 9th) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isBeePopupOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsBeePopupOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { overflow: 'hidden' }]}>
            <View style={[styles.cardBody, { paddingTop: 24 }]}>
              <ThemedText type="subtitle" style={[styles.modalTitleText, { textAlign: 'center', fontSize: 17, marginBottom: 12 }]}>
                {t('milestone.bee_title')}
              </ThemedText>
              <ThemedText type="default" style={[styles.modalMessageText, { textAlign: 'center', lineHeight: 22 }]}>
                {t('milestone.bee_desc')}
              </ThemedText>
            </View>

            <View style={[styles.modalActions, { marginTop: 20, paddingBottom: 20, flexDirection: 'column' }]}>
              <View style={{ position: 'relative', alignSelf: 'stretch' }}>
                <View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 20, borderWidth: 6, borderColor: 'rgba(189,147,249,0.10)', backgroundColor: 'transparent' }} />
                <View style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 17, borderWidth: 3, borderColor: 'rgba(189,147,249,0.22)', backgroundColor: 'transparent' }} />
                <Pressable
                  style={styles.butterflyMeetBtn}
                  onPress={() => {
                    setIsBeePopupOpen(false);
                    setShowBeeOverlay(true);
                    // Show bee overlay for 5 seconds then show third garden popup
                    setTimeout(() => {
                      setShowBeeOverlay(false);
                      setIsThirdGardenPopupOpen(true);
                    }, 5000);
                  }}
                >
                  <ThemedText type="smallBold" style={styles.butterflyMeetBtnText}>
                    {t('milestone.bee_btn')}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* THIRD GARDEN POPUP */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isThirdGardenPopupOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsThirdGardenPopupOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { overflow: 'hidden' }]}>

            <View style={[styles.cardBody, { paddingTop: 28, paddingBottom: 8, alignItems: 'center' }]}>
              <Image
                source={require('../../assets/images/process_done.png')}
                style={styles.secondGardenEmoji}
                resizeMode="contain"
              />
              <ThemedText type="subtitle" style={[styles.modalTitleText, { textAlign: 'center', fontSize: 18, marginBottom: 8 }]}>
                {t('milestone.third_garden_title')}
              </ThemedText>
              <ThemedText type="default" style={[styles.modalMessageText, { textAlign: 'center', lineHeight: 22 }]}>
                {t('milestone.third_garden_desc')}
              </ThemedText>
            </View>

            <View style={[styles.modalActions, { marginTop: 16, paddingBottom: 24, flexDirection: 'column' }]}>
              <View style={{ position: 'relative', alignSelf: 'stretch' }}>
                <View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 20, borderWidth: 6, borderColor: 'rgba(80,250,123,0.10)', backgroundColor: 'transparent' }} />
                <View style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 17, borderWidth: 3, borderColor: 'rgba(80,250,123,0.22)', backgroundColor: 'transparent' }} />
                <Pressable
                  style={styles.secondGardenStartBtn}
                  onPress={async () => {
                    setIsThirdGardenPopupOpen(false);
                    await startThirdGarden();
                    lastShownArchiveLengthRef.current = state.archive.length;
                  }}
                >
                  <ThemedText type="smallBold" style={styles.secondGardenStartBtnText}>
                    {t('milestone.start_btn')}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* BIRD POPUP MODAL (27th plant / 3rd garden 9th) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isBirdPopupOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsBirdPopupOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { overflow: 'hidden' }]}>
            <View style={[styles.cardBody, { paddingTop: 24 }]}>
              <ThemedText type="subtitle" style={[styles.modalTitleText, { textAlign: 'center', fontSize: 17, marginBottom: 12 }]}>
                {t('milestone.bird_title')}
              </ThemedText>
              <ThemedText type="default" style={[styles.modalMessageText, { textAlign: 'center', lineHeight: 22 }]}>
                {t('milestone.bird_desc')}
              </ThemedText>
            </View>

            <View style={[styles.modalActions, { marginTop: 20, paddingBottom: 20, flexDirection: 'column' }]}>
              <View style={{ position: 'relative', alignSelf: 'stretch' }}>
                <View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 20, borderWidth: 6, borderColor: 'rgba(189,147,249,0.10)', backgroundColor: 'transparent' }} />
                <View style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 17, borderWidth: 3, borderColor: 'rgba(189,147,249,0.22)', backgroundColor: 'transparent' }} />
                <Pressable
                  style={styles.butterflyMeetBtn}
                  onPress={() => {
                    setIsBirdPopupOpen(false);
                    setCurrentScreen('mansil');
                    setShowBirdOverlay(true);
                    // Show bird overlay for 5 seconds then show Season 1 Completed modal
                    setTimeout(() => {
                      setShowBirdOverlay(false);
                      setIsSeason1CompletedModalOpen(true);
                    }, 5000);
                  }}
                >
                  <ThemedText type="smallBold" style={styles.butterflyMeetBtnText}>
                    {t('milestone.bird_btn')}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* SEASON 1 COMPLETION MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isSeason1CompletedModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSeason1CompletedModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { overflow: 'hidden' }]}>

            <View style={[styles.cardBody, { paddingTop: 28, paddingBottom: 16, alignItems: 'center' }]}>
              <Image
                source={require('../../assets/images/process_done.png')}
                style={styles.secondGardenEmoji}
                resizeMode="contain"
              />
              <ThemedText type="subtitle" style={[styles.modalTitleText, { textAlign: 'center', fontSize: 18, marginBottom: 12 }]}>
                {t('milestone.season1_complete_title')}
              </ThemedText>
              <ThemedText type="default" style={[styles.modalMessageText, { textAlign: 'center', lineHeight: 22, fontSize: 13, color: '#E2E8F0' }]}>
                {t('milestone.season1_complete_desc')}
              </ThemedText>
            </View>

            <View style={[styles.modalActions, { marginTop: 16, paddingBottom: 24, flexDirection: 'column' }]}>
              <View style={{ position: 'relative', alignSelf: 'stretch' }}>
                <View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 20, borderWidth: 6, borderColor: 'rgba(80,250,123,0.10)', backgroundColor: 'transparent' }} />
                <View style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 17, borderWidth: 3, borderColor: 'rgba(80,250,123,0.22)', backgroundColor: 'transparent' }} />
                <Pressable
                  style={styles.secondGardenStartBtn}
                  onPress={() => {
                    setIsSeason1CompletedModalOpen(false);
                    setCurrentScreen('sanctuary');
                    lastShownArchiveLengthRef.current = state.archive.length;
                  }}
                >
                  <ThemedText type="smallBold" style={styles.secondGardenStartBtnText}>
                    {t('milestone.season1_complete_btn')}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* DIARY WRITE MODAL */}
      <Modal
        visible={isDiaryModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDiaryModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%', justifyContent: 'flex-start', padding: Spacing.three, gap: Spacing.three }]}>
            <View style={{ gap: Spacing.two }}>
              <ThemedText type="smallBold" style={{ color: '#ddefb7', fontSize: 15, letterSpacing: 1.5, textAlign: 'center', textTransform: 'uppercase' }}>
                {t('diary.modal_title')}
              </ThemedText>

              <View style={[styles.cardQuestionBox, { borderColor: 'rgba(189, 147, 249, 0.3)', marginTop: 0, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, paddingHorizontal: 4 }}>
                  <Image
                    source={require('../../assets/images/view.png')}
                    style={{ width: 16, height: 16, marginTop: 2 }}
                    resizeMode="contain"
                  />
                  <ThemedText style={[styles.cardQuestionText, { color: '#FFEAA7', fontSize: 13, lineHeight: 20, flexShrink: 1, textAlign: 'left', wordBreak: 'keep-all' } as any]}>
                    {diaryQuestion.replace(/^[^\w\s가-힣]+\s*/, '')}
                  </ThemedText>
                </View>
              </View>

              {/* TextInput Textarea */}
              <View style={[styles.textAreaWrapper, { marginTop: 0 }]}>
                <TextInput
                  multiline={true}
                  numberOfLines={3}
                  value={diaryContent}
                  onChangeText={setDiaryContent}
                  placeholder={t('diary.placeholder')}
                  placeholderTextColor="rgba(154, 159, 176, 0.4)"
                  style={styles.textAreaInput}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setIsDiaryModalOpen(false)}
              >
                <ThemedText style={styles.modalCancelText}>{t('common.back')}</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalOkBtn, { backgroundColor: 'rgb(189, 147, 249)' }]}
                onPress={handleSaveDiary}
              >
                <ThemedText style={[styles.modalOkText, { color: '#000000', fontWeight: 'bold' }]}>{t('diary.submit')}</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* DIARY VIEW MODAL */}
      <Modal
        visible={isDiaryViewModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDiaryViewModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { justifyContent: 'flex-start', padding: Spacing.three, gap: Spacing.three }]}>
            <View style={{ gap: Spacing.two }}>
              <View style={{ alignItems: 'center' }}>
                <ThemedText type="smallBold" style={{ color: '#ddefb7', fontSize: 15, letterSpacing: 1.5, textAlign: 'center', textTransform: 'uppercase' }}>
                  {t('diary.modal_title')}
                </ThemedText>
              </View>

              {selectedDiary ? (
                <>
                  <View style={[styles.cardQuestionBox, { borderColor: 'rgba(168, 227, 154, 0.25)', backgroundColor: 'rgba(10, 13, 24, 0.8)', marginTop: 0, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, paddingHorizontal: 4 }}>
                      <Image
                        source={require('../../assets/images/view.png')}
                        style={{ width: 16, height: 16, marginTop: 2 }}
                        resizeMode="contain"
                      />
                      <ThemedText style={[styles.cardQuestionText, { color: '#FFEAA7', fontSize: 13, lineHeight: 20, flexShrink: 1, textAlign: 'left', wordBreak: 'keep-all' } as any]}>
                        {selectedDiary.question.replace(/^[^\w\s가-힣]+\s*/, '')}
                      </ThemedText>
                    </View>
                  </View>

                  <ScrollView style={{ maxHeight: 140, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', padding: Spacing.two }}>
                    <ThemedText style={{ color: '#ffffff', fontSize: 13, lineHeight: 21 }}>
                      {selectedDiary.content}
                    </ThemedText>
                  </ScrollView>

                  <ThemedText type="small" style={{ color: '#9A9FB0', textAlign: 'right', fontSize: 11 }}>
                    {t('diary.written_date', { date: selectedDiary.date })}
                  </ThemedText>
                </>
              ) : (
                <View style={{ paddingVertical: Spacing.five, alignItems: 'center' }}>
                  <Image
                    source={require('../../assets/images/ic_write.png')}
                    style={{ width: 44, height: 44, marginBottom: 10 }}
                    resizeMode="contain"
                  />
                  <ThemedText type="smallBold" style={{ color: '#9A9FB0', fontSize: 13, textAlign: 'center' }}>
                    {t('diary.empty_diary')}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: 'rgba(154, 159, 176, 0.5)', fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                    {t('diary.empty_diary_desc')}
                  </ThemedText>
                </View>
              )}
            </View>

            <Pressable
              style={[styles.modalOkBtnFull, { marginTop: Spacing.two }]}
              onPress={() => setIsDiaryViewModalOpen(false)}
            >
              <ThemedText style={styles.modalOkText}>{t('common.close')}</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal
        visible={isSettingsModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSettingsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 340, padding: Spacing.four, gap: Spacing.three }]}>
            <View style={{ alignItems: 'center', borderBottomWidth: 1, borderColor: '#161a29', paddingBottom: Spacing.three }}>
              <ThemedText type="smallBold" style={{ color: '#ddefb7', fontSize: 17, letterSpacing: 1.5 }}>
                {t('settings.title')}
              </ThemedText>
              <View style={{ backgroundColor: 'rgba(221, 239, 183, 0.08)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(221, 239, 183, 0.2)' }}>
                <ThemedText style={{ color: '#9A9FB0', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
                  Version 1.0.0
                </ThemedText>
              </View>
            </View>

            <View style={{ gap: Spacing.two, marginVertical: Spacing.one }}>
              {/* 공식 커뮤니티 */}
              <Pressable
                style={styles.settingsMenuItem}
                onPress={() => {
                  Linking.openURL('https://cafe.naver.com/mandalaonsil');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image
                    source={require('../../assets/images/btn_gnb_cafe.png')}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                  />
                  <ThemedText style={styles.settingsMenuText}>{t('settings.community')}</ThemedText>
                </View>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9A9FB0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <Path d="M15 3h6v6" />
                  <Path d="M10 14L21 3" />
                </Svg>
              </Pressable>

              {/* 개인정보처리방침 */}
              <Pressable
                style={styles.settingsMenuItem}
                onPress={() => {
                  const url = isEn()
                    ? 'https://publmine.github.io/mandalaonsil-privacy-policy-en/'
                    : 'https://publmine.github.io/mandalaonsil-privacy-policy/';
                  Linking.openURL(url);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#8BE9FD" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </Svg>
                  <ThemedText style={styles.settingsMenuText}>{t('settings.privacy_policy')}</ThemedText>
                </View>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9A9FB0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <Path d="M15 3h6v6" />
                  <Path d="M10 14L21 3" />
                </Svg>
              </Pressable>
            </View>

            <Pressable
              style={styles.modalOkBtnFull}
              onPress={() => setIsSettingsModalOpen(false)}
            >
              <ThemedText style={styles.modalOkText}>{t('common.close')}</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* DIALOG DISCLOSURE SYSTEM MODAL (TOP-MOST LAYER) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleContainer}>
              <Image
                source={require('../../assets/images/talk.png')}
                style={{ width: 18, height: 18, marginTop: 2 }}
                resizeMode="contain"
              />
              <ThemedText
                style={[
                  styles.modalTitleText,
                  { flexShrink: 1, wordBreak: 'keep-all' } as any
                ]}
                lineBreakStrategyIOS="hangul-word"
              >
                {modalTitle.replace(/^🪴\s*/, '')}
              </ThemedText>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <ThemedText type="default" style={styles.modalMessageText}>
                {modalContent}
              </ThemedText>
            </ScrollView>

            <View style={styles.modalActions}>
              {modalTitle === t('archive.reset_modal_title') || modalTitle === "온실 초기화 경고" ? (
                <>
                  <Pressable
                    style={styles.modalConfirmBtn}
                    onPress={async () => {
                      closeModal();
                      await resetGame();
                      resetSelection();
                      setCurrentScreen('mansil');
                    }}
                  >
                    <ThemedText type="smallBold" style={styles.modalConfirmText}>{t('archive.reset_modal_confirm')}</ThemedText>
                  </Pressable>
                  <Pressable style={styles.modalCancelBtn} onPress={closeModal}>
                    <ThemedText type="smallBold" style={styles.modalCancelText}>{t('archive.reset_modal_cancel')}</ThemedText>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.modalOkBtnFull} onPress={closeModal}>
                  <ThemedText type="smallBold" style={styles.modalOkText}>{t('common.confirm')}</ThemedText>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </ThemedView >
  );
}

