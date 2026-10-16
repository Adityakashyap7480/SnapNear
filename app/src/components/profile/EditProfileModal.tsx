import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { MapPin, UserRound } from 'lucide-react-native';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { Input } from '../ui/FormField';
import Modal from '../ui/Modal';
import Text from '../ui/Text';
import { authApi } from '../../api/services';
import { ROLES } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import toast from '../../lib/toast';
import type { ApiFailure } from '../../types';
import { MESSAGES, isValidPhone } from '../../utils/validators';

type Gender = 'male' | 'female' | 'other';

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState<Gender>('male');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setErrors({});
  }, [open, user]);

  if (!user) return null;

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!isValidPhone(phone)) next.phone = MESSAGES.PHONE;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { user: updated } = await authApi.updateMe({ name: name.trim(), phone: phone.trim() });
      setUser(updated);
      toast.success('Profile updated');
      onClose();
    } catch (err) {
      toast.error((err as ApiFailure).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <View className="items-center pb-2">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <Avatar name={name || user.name} size="lg" />
        </View>
      </View>

      <View className="gap-3.5">
        <Input label="Name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
        <Input label="E-mail" value={user.email} editable={false} />
        <Input
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
          placeholder="10-digit mobile"
        />

        {user.role === ROLES.CREATOR && (
          <Input
            label="Current location"
            icon={MapPin}
            value={user.address || 'Not shared yet'}
            editable={false}
            hint="Filled from GPS when you log in — cannot be edited here"
          />
        )}

        <View>
          <Text className="mb-2 text-xs font-semibold text-slate-600">Gender</Text>
          <View className="flex-row gap-2">
            {GENDERS.map((g) => {
              const selected = gender === g.id;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => setGender(g.id)}
                  className={`flex-1 items-center rounded-full border px-3 py-2.5 ${
                    selected ? 'border-brand-orange bg-orange-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-semibold ${selected ? 'text-brand-orange' : 'text-slate-600'}`}>{g.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button size="lg" loading={saving} onPress={save} className="mt-2 w-full" icon={UserRound}>
          Update
        </Button>
      </View>
    </Modal>
  );
}
