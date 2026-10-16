import type { ReactNode } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { X, type LucideIcon } from 'lucide-react-native';
import Overlay from './Overlay';
import Text from './Text';
import { FadeUp } from './motion';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconBox?: string;
  iconColor?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ open, onClose, title, description, icon: Icon, iconBox = '', iconColor = colors.slate[700], children, footer }: ModalProps) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 640;

  return (
    <Overlay visible={open} onRequestClose={onClose}>
      <View className={`flex-1 bg-slate-950/50 ${wide ? 'items-center justify-center p-4' : 'justify-end'}`}>
        <Pressable accessibilityLabel="Close" className="absolute inset-0" onPress={onClose} />
        <FadeUp
          className={`w-full bg-white ${wide ? 'max-w-md rounded-2xl' : 'rounded-t-2xl'}`}
          style={[shadows['2xl'], { maxHeight: height * 0.92 }]}
        >
          <ScrollView contentContainerClassName={wide ? 'p-6' : 'p-5'} keyboardShouldPersistTaps="handled">
            <View accessibilityRole="none" aria-modal role="dialog" aria-label={title}>
              <View className="flex-row items-start gap-3">
                {Icon && (
                  <View className={`h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBox}`}>
                    <Icon size={20} color={iconColor} />
                  </View>
                )}
                <View className="min-w-0 flex-1">
                  <Text className="font-display text-base font-bold text-slate-900">{title}</Text>
                  {description && <Text className="mt-1 text-xs leading-5 text-slate-500">{description}</Text>}
                </View>
                <Pressable accessibilityLabel="Close" onPress={onClose} className="-mr-1 -mt-1 rounded-lg p-1.5">
                  <X size={16} color={colors.slate[400]} />
                </Pressable>
              </View>
              {children && <View className="mt-4">{children}</View>}
              {footer && <View className={`mt-5 gap-2 ${wide ? 'flex-row justify-end' : 'flex-col-reverse'}`}>{footer}</View>}
            </View>
          </ScrollView>
        </FadeUp>
      </View>
    </Overlay>
  );
}
