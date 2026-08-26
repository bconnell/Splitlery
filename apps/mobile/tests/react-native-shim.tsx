import React from 'react';

const host = (name: string) => React.forwardRef<unknown, React.PropsWithChildren<Record<string, unknown>>>((props, ref) => React.createElement(name, { ...props, ref }, props.children as React.ReactNode));
export const Alert = { alert: () => undefined };
export const Pressable = host('Pressable');
export const SafeAreaView = host('SafeAreaView');
export const ScrollView = host('ScrollView');
export const Text = host('Text');
export const TextInput = host('TextInput');
export const View = host('View');
export const StyleSheet = { create: <T extends Record<string, unknown>>(styles: T): T => styles };
