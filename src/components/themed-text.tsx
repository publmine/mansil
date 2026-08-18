import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import i18n from '@/i18n';
import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  const flattenedStyle = StyleSheet.flatten([
    type === 'default' && styles.default,
    type === 'title' && styles.title,
    type === 'small' && styles.small,
    type === 'smallBold' && styles.smallBold,
    type === 'subtitle' && styles.subtitle,
    type === 'link' && styles.link,
    type === 'linkPrimary' && styles.linkPrimary,
    type === 'code' && styles.code,
    style,
  ]);

  const isEn = i18n.language?.startsWith('en');
  const styleObj = flattenedStyle as any;
  const specifiedFont = styleObj?.fontFamily;
  const shouldOverrideFont = !specifiedFont || (isEn && specifiedFont === 'BookkMyungjo_Bold');

  let finalFontFamily = specifiedFont || (isEn ? 'Lato-Regular' : 'Pretendard-Regular');

  if (shouldOverrideFont) {
    const weight = flattenedStyle?.fontWeight;
    const isBold = weight === 'bold' || weight === '700' || weight === '800' || weight === '900' || specifiedFont === 'BookkMyungjo_Bold';
    const isSemi = weight === '600';
    const isMedium = weight === '500';

    if (isEn) {
      if (isBold || isSemi) {
        finalFontFamily = 'Lato-Bold';
      } else {
        finalFontFamily = 'Lato-Regular';
      }
    } else {
      if (isBold) {
        finalFontFamily = 'Pretendard-Bold';
      } else if (isSemi) {
        finalFontFamily = 'Pretendard-SemiBold';
      } else if (isMedium) {
        finalFontFamily = 'Pretendard-Medium';
      } else {
        finalFontFamily = 'Pretendard-Regular';
      }
    }
  }

  // Strip fontWeight if we are overriding with the custom weight-specific font family to prevent synthetic double-bolding
  let finalStyle: any;
  if (shouldOverrideFont && flattenedStyle) {
    const { fontWeight, ...restStyle } = flattenedStyle;
    finalStyle = [
      { color: theme[themeColor ?? 'text'] },
      restStyle,
      { fontFamily: finalFontFamily }
    ];
  } else {
    finalStyle = [
      { color: theme[themeColor ?? 'text'] },
      flattenedStyle
    ];
  }

  return (
    <Text
      {...rest}
      style={finalStyle}
      lineBreakStrategyIOS="hangul-word"
      android_hyphenationFrequency="none"
      textBreakStrategy="simple"
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  title: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontWeight: '400',
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
    fontWeight: '400',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
