import { View } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import Text from '../components/ui/Text';
import { ROUTES } from '../config/routes';

export default function NotFound() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-slate-50 px-4">
      <Logo />
      <View className="items-center">
        <Text className="font-display text-7xl font-black text-brand-orange">404</Text>
        <Text role="heading" className="mt-2 text-center font-display text-xl font-bold text-slate-900">
          This page went out of frame
        </Text>
        <Text className="mt-1 text-center text-sm text-slate-500">The page you are looking for does not exist or was moved.</Text>
      </View>
      <Button variant="dark" onPress={() => router.replace(ROUTES.HOME)}>
        Back to SnapNear
      </Button>
    </View>
  );
}
