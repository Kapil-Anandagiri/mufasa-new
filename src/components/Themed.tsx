import React from 'react';
import {
  Text as DefaultText,
  useColorScheme,
  View as DefaultView,
  StyleProp,
  TextStyle,
  ViewStyle
} from 'react-native';
import Colors from '../../constants/Colors';

interface ThemeProps {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<TextStyle | ViewStyle>;
  [key: string]: any;
}

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: ThemeProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ThemeProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
