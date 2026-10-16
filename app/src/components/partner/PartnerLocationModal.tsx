import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LocateFixed, MapPin } from 'lucide-react-native';
import Button from '../ui/Button';
import { Input } from '../ui/FormField';
import Overlay from '../ui/Overlay';
import Text from '../ui/Text';
import { FadeUp } from '../ui/motion';
import { authApi } from '../../api/services';
import { MATCH_RADIUS_KM } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import { getCurrentPlace } from '../../lib/location';
import toast from '../../lib/toast';
import type { ApiFailure } from '../../types';
import { shadows } from '../../theme/shadows';

/**
 * Blocks the partner dashboard until GPS + reverse-geocoded address are saved.
 * Address is stored on the account and shown read-only in profile.
 */
export default function PartnerLocationModal() {
  const { setUser, logout } = useAuth();
  const { width, height } = useWindowDimensions();
  const sm = width >= 640;
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const detect = async () => {
    setLoading(true);
    try {
      const place = await getCurrentPlace();
      setAddress(place.address);
      setCoords({ latitude: place.latitude, longitude: place.longitude });
      toast.success('Current location detected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!coords || address.trim().length < 8) {
      toast.error('Detect your current location to continue');
      return;
    }
    setSaving(true);
    try {
      const { user } = await authApi.updateMe({
        address: address.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setUser(user);
      toast.success('Location saved — you can go online for nearby shoots');
    } catch (err) {
      toast.error((err as ApiFailure).message);
      setSaving(false);
    }
  };

  return (
    <Overlay>
      <View
        className={`flex-1 bg-slate-950/75 ${sm ? 'items-center justify-center p-4' : 'justify-end'}`}
        role="dialog"
        aria-modal
        aria-label="Share current location"
      >
        <FadeUp
          className={`w-full max-w-lg overflow-hidden bg-white ${sm ? 'rounded-3xl' : 'rounded-t-3xl'}`}
          style={[shadows['2xl'], { maxHeight: height * 0.92 }]}
        >
          <View className="gap-4 p-5 sm:p-6">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
              <LocateFixed size={22} color="#ff8008" />
            </View>
            <View className="gap-1">
              <Text className="font-display text-xl font-bold text-slate-900">Share your current location</Text>
              <Text className="text-sm leading-5 text-slate-500">
                We use this to show you shoots within {MATCH_RADIUS_KM} km. The address is saved on your profile and
                cannot be edited manually.
              </Text>
            </View>

            <Input
              label="Current location"
              icon={MapPin}
              value={address}
              editable={false}
              placeholder="Tap Detect location"
              hint={coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : undefined}
            />

            <Button variant="dark" icon={LocateFixed} loading={loading} onPress={detect} className="w-full">
              Detect location
            </Button>
            <Button size="lg" loading={saving} disabled={!coords} onPress={save} className="w-full" icon={MapPin}>
              Save & continue
            </Button>
            <Button variant="ghost" onPress={logout} className="w-full">
              Log out
            </Button>
          </View>
        </FadeUp>
      </View>
    </Overlay>
  );
}
