import { Pressable, View, useWindowDimensions } from 'react-native';
import { Camera, Video } from 'lucide-react-native';
import Text from '../ui/Text';
import { useCatalog } from '../../context/CatalogContext';
import { colors } from '../../theme/colors';
import { formatINR } from '../../utils/format';

const SERVICES = [
  {
    id: 'photo',
    title: 'Photos Only',
    text: 'Portraits, candids, baby & event stills',
    icon: Camera,
    active: 'border-brand-orange bg-orange-50/60',
    iconBox: 'bg-orange-100',
    iconColor: colors.brand.orange,
    pill: 'bg-slate-900',
  },
  {
    id: 'video',
    title: 'Video & Cinema',
    text: 'Reels, 4K video, stabilizer & audio',
    icon: Video,
    active: 'border-brand-violet bg-indigo-50/60',
    iconBox: 'bg-indigo-100',
    iconColor: colors.brand.violet,
    pill: 'bg-brand-violet',
  },
];

export default function ServicePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { startingPrice } = useCatalog();
  const { width } = useWindowDimensions();

  return (
    <View className={`gap-2.5 sm:gap-3 ${width >= 360 ? 'flex-row' : ''}`}>
      {SERVICES.map(({ id, title, text, icon: Icon, active, iconBox, iconColor, pill }) => (
        <Pressable
          key={id}
          testID={`service-${id}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === id }}
          onPress={() => onChange(id)}
          className={`flex-1 rounded-xl border-2 p-3 sm:p-4 ${value === id ? active : 'border-slate-200'}`}
        >
          <View className="mb-2 flex-row flex-wrap items-center justify-between gap-1.5">
            <View className={`h-8 w-8 items-center justify-center rounded-lg ${iconBox}`}>
              <Icon size={16} color={iconColor} />
            </View>
            <View className={`rounded-full px-2 py-0.5 ${pill}`}>
              <Text className="text-[10px] font-bold text-white">Starts {formatINR(startingPrice[id])}</Text>
            </View>
          </View>
          <Text className="text-sm font-bold text-slate-900">{title}</Text>
          <Text className="mt-0.5 text-xs text-slate-500">{text}</Text>
        </Pressable>
      ))}
    </View>
  );
}
