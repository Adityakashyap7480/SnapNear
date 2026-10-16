import { Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

// Let these non-core components take `className` like View does
cssInterop(LinearGradient, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
