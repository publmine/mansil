import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

export interface ZoomableCanvasRef {
  resetZoom: () => void;
}

interface ZoomableCanvasProps {
  size: number;
  minScale?: number;
  maxScale?: number;
  resetKey?: any;
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  canvasRef?: React.Ref<View>;
}

export const ZoomableCanvas = forwardRef<ZoomableCanvasRef, ZoomableCanvasProps>(
  (
    {
      size,
      minScale = 1.0,
      maxScale = 3.5,
      resetKey,
      children,
      containerStyle,
      canvasRef,
    },
    ref
  ) => {
    const scale = useSharedValue(1.0);
    const savedScale = useSharedValue(1.0);
    const translateX = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const [displayScale, setDisplayScale] = React.useState(1.0);

    const updateDisplayScale = (val: number) => {
      setDisplayScale(Number(val.toFixed(1)));
    };

    const resetZoom = () => {
      'worklet';
      scale.value = withSpring(1.0);
      savedScale.value = 1.0;
      translateX.value = withSpring(0);
      savedTranslateX.value = 0;
      translateY.value = withSpring(0);
      savedTranslateY.value = 0;
      runOnJS(updateDisplayScale)(1.0);
    };

    useImperativeHandle(ref, () => ({
      resetZoom: () => {
        resetZoom();
      },
    }));

    useEffect(() => {
      if (resetKey !== undefined) {
        scale.value = 1.0;
        savedScale.value = 1.0;
        translateX.value = 0;
        savedTranslateX.value = 0;
        translateY.value = 0;
        savedTranslateY.value = 0;
        setDisplayScale(1.0);
      }
    }, [resetKey]);

    const pinchGesture = Gesture.Pinch()
      .onUpdate((e) => {
        'worklet';
        const nextScale = Math.min(Math.max(savedScale.value * e.scale, minScale), maxScale);
        scale.value = nextScale;

        // Dynamic translation bounds clamping
        const maxTranslate = ((nextScale - 1) * size) / 2;
        translateX.value = Math.min(Math.max(translateX.value, -maxTranslate), maxTranslate);
        translateY.value = Math.min(Math.max(translateY.value, -maxTranslate), maxTranslate);

        runOnJS(updateDisplayScale)(nextScale);
      })
      .onEnd(() => {
        'worklet';
        if (scale.value < 1.05) {
          scale.value = withSpring(1.0);
          savedScale.value = 1.0;
          translateX.value = withSpring(0);
          savedTranslateX.value = 0;
          translateY.value = withSpring(0);
          savedTranslateY.value = 0;
          runOnJS(updateDisplayScale)(1.0);
        } else {
          savedScale.value = scale.value;
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        }
      });

    const panGesture = Gesture.Pan()
      .minPointers(1)
      .averageTouches(true)
      .onUpdate((e) => {
        'worklet';
        if (scale.value > 1.05) {
          const maxTranslate = ((scale.value - 1) * size) / 2;
          const targetX = savedTranslateX.value + e.translationX;
          const targetY = savedTranslateY.value + e.translationY;
          translateX.value = Math.min(Math.max(targetX, -maxTranslate), maxTranslate);
          translateY.value = Math.min(Math.max(targetY, -maxTranslate), maxTranslate);
        }
      })
      .onEnd(() => {
        'worklet';
        if (scale.value > 1.05) {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        } else {
          translateX.value = withSpring(0);
          savedTranslateX.value = 0;
          translateY.value = withSpring(0);
          savedTranslateY.value = 0;
        }
      });

    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd(() => {
        'worklet';
        resetZoom();
      });

    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
      };
    });

    const isZoomed = displayScale > 1.05;

    return (
      <View style={[styles.wrapper, { width: size, height: size }, containerStyle]}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[styles.animatedContent, { width: size, height: size }, animatedStyle]}
            ref={canvasRef}
            collapsable={false}
          >
            {children}
          </Animated.View>
        </GestureDetector>

        {/* Floating Zoom Badge / Reset button */}
        {isZoomed && (
          <Pressable
            style={styles.zoomBadge}
            onPress={() => resetZoom()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.zoomBadgeText}>🔍 {displayScale}x</Text>
            <View style={styles.resetPill}>
              <Text style={styles.resetPillText}>↺ 1.0x</Text>
            </View>
          </Pressable>
        )}
      </View>
    );
  }
);

ZoomableCanvas.displayName = 'ZoomableCanvas';

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 20,
  },
  animatedContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 26, 40, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 99,
  },
  zoomBadgeText: {
    color: '#e0f2fe',
    fontSize: 11,
    fontWeight: '700',
  },
  resetPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resetPillText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
});
