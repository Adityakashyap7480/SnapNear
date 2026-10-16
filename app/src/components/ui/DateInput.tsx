import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { Field } from './FormField';
import Text from './Text';
import { colors } from '../../theme/colors';
import { formatDate, toISODate } from '../../utils/format';

export interface DateInputProps {
  label?: string;
  error?: string;
  name?: string;
  /** YYYY-MM-DD */
  value: string;
  min?: string;
  onChange: (value: string) => void;
  className?: string;
}

const parse = (iso?: string) => (iso ? new Date(`${iso}T00:00:00`) : undefined);

export default function DateInput({ label, error, name, value, min, onChange, className = '' }: DateInputProps) {
  const current = parse(value) || new Date();
  const minimumDate = parse(min);
  const box = `flex-row items-center rounded-xl border bg-white ${error ? 'border-red-300' : 'border-slate-200'}`;

  if (Platform.OS === 'ios') {
    return (
      <Field label={label} error={error} className={className}>
        <View className={`${box} py-1.5 pl-3.5`}>
          <Calendar size={16} color={colors.slate[400]} />
          <DateTimePicker
            testID={name}
            value={current}
            minimumDate={minimumDate}
            mode="date"
            display="compact"
            onChange={(_, d) => d && onChange(toISODate(d))}
          />
        </View>
      </Field>
    );
  }

  const open = () =>
    DateTimePickerAndroid.open({
      value: current,
      minimumDate,
      mode: 'date',
      onChange: (event, d) => event.type === 'set' && d && onChange(toISODate(d)),
    });

  return (
    <Field label={label} error={error} className={className}>
      <Pressable testID={name} accessibilityRole="button" onPress={open} className={`${box} gap-2.5 px-3.5 py-3`}>
        <Calendar size={16} color={colors.slate[400]} />
        <Text className="text-base text-slate-900">{value ? formatDate(value) : 'Pick a date'}</Text>
      </Pressable>
    </Field>
  );
}
