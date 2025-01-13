import * as React from 'react';
import { Platform, StyleProp, TextStyle } from 'react-native';
import { Text } from './Themed';

interface MonoTextProps {
  style?: StyleProp<TextStyle>;
  lightColor?: string;
  darkColor?: string;
  children: React.ReactNode;
}

export function MonoText(props: MonoTextProps) {
  return (
    <Text
      {...props}
      style={[
        props.style,
        {
          // The "code" font is different on each platform.
          fontFamily: Platform.select({
            default: 'Courier',
            ios: 'Courier New',
            android: 'monospace',
          }),
          fontWeight: '500',
        },
      ]}
    />
  );
}
