import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { CalendarClock, Hourglass, Landmark, Pencil, Send, Wallet as WalletIcon } from 'lucide-react-native';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Input } from '../ui/FormField';
import Gradient from '../ui/Gradient';
import Text from '../ui/Text';
import { creatorApi } from '../../api/services';
import { useCatalog } from '../../context/CatalogContext';
import toast from '../../lib/toast';
import type { ApiFailure, Wallet } from '../../types';
import { colors } from '../../theme/colors';
import { formatDate, formatINR } from '../../utils/format';
import { MESSAGES, isValidUpiId } from '../../utils/validators';

function UpiIdEditor({ upiId, onSaved }: { upiId: string; onSaved: () => void }) {
  const { partnerPct } = useCatalog();
  const [editing, setEditing] = useState(!upiId);
  const [value, setValue] = useState(upiId);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = value.trim().toLowerCase();
    if (!isValidUpiId(next)) {
      setError(MESSAGES.UPI_ID);
      return;
    }
    setSaving(true);
    try {
      await creatorApi.updateProfile({ upiId: next });
      toast.success('Payout UPI ID saved');
      setEditing(false);
      onSaved();
    } catch (err) {
      setError((err as ApiFailure).message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <View className="flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
        <View className="min-w-0 shrink">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payouts go to</Text>
          <Text className="truncate text-sm font-bold text-slate-900">{upiId}</Text>
        </View>
        <Button variant="outline" size="sm" onPress={() => setEditing(true)} icon={Pencil} iconSize={12}>
          Change
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
      <Input
        label="Your UPI ID for payouts"
        name="upiId"
        placeholder="yourname@okaxis"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={value}
        onChangeText={(v) => {
          setValue(v);
          setError('');
        }}
        onSubmitEditing={save}
        returnKeyType="done"
        error={error}
        hint={`SnapNear sends your ${partnerPct} earnings here.`}
      />
      <View className="flex-row justify-end gap-2">
        {upiId ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setValue(upiId);
              setError('');
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        ) : null}
        <Button testID="save-upi" variant="success" size="sm" loading={saving} onPress={save}>
          Save UPI ID
        </Button>
      </View>
    </View>
  );
}

export default function WalletCard({ wallet, onChanged }: { wallet: Wallet; onChanged: () => void }) {
  const { partnerPct } = useCatalog();
  const { width } = useWindowDimensions();
  const lg = width >= 1024;

  return (
    <Card className={`overflow-hidden ${lg ? 'flex-row' : ''}`}>
      <Gradient colors={[colors.slate[900], colors.brand.navy]} to="br" className={`p-4 sm:p-5 ${lg ? 'flex-1' : ''}`}>
        <View className="flex-row flex-wrap items-start justify-between gap-2">
          <View className="flex-row items-center gap-1.5">
            <WalletIcon size={14} color={colors.amber[300]} />
            <Text className="text-[11px] font-bold uppercase tracking-wider text-amber-300">SnapNear Wallet</Text>
          </View>
          {wallet.nextPayoutAt && (
            <View className="flex-row items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
              <CalendarClock size={12} color={colors.slate[200]} />
              <Text className="text-[10px] font-bold text-slate-200">Payout by {formatDate(wallet.nextPayoutAt, { day: 'numeric', month: 'short' })}</Text>
            </View>
          )}
        </View>
        <Text testID="wallet-balance" className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
          {formatINR(wallet.balance, { fixed: true })}
        </Text>
        <Text className="mt-1 text-xs text-slate-300">
          {wallet.balanceCount > 0
            ? `${wallet.balanceCount} paid shoot(s) • sent to your UPI within ${wallet.holdDays} days of payment`
            : `Your ${partnerPct} from paid shoots lands here`}
        </Text>

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-xl border border-white/10 bg-white/5 p-2.5">
            <View className="flex-row items-center gap-1">
              <Hourglass size={12} color={colors.slate[400]} />
              <Text className="text-[10px] font-semibold uppercase text-slate-400">Awaiting customer</Text>
            </View>
            <Text className="mt-0.5 text-sm font-bold text-amber-300">{formatINR(wallet.awaitingCustomer, { fixed: true })}</Text>
            <Text className="text-[10px] text-slate-400">{wallet.awaitingCount} unpaid shoot(s)</Text>
          </View>
          <View className="flex-1 rounded-xl border border-white/10 bg-white/5 p-2.5">
            <View className="flex-row items-center gap-1">
              <Landmark size={12} color={colors.slate[400]} />
              <Text className="text-[10px] font-semibold uppercase text-slate-400">Paid out to you</Text>
            </View>
            <Text className="mt-0.5 text-sm font-bold text-emerald-400">{formatINR(wallet.withdrawn, { fixed: true })}</Text>
            <Text className="text-[10px] text-slate-400">Lifetime transfers</Text>
          </View>
        </View>
      </Gradient>

      <View className={`gap-3 p-4 sm:p-5 ${lg ? 'flex-1' : ''}`}>
        <UpiIdEditor key={wallet.upiId} upiId={wallet.upiId} onSaved={onChanged} />

        <View>
          <Text className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent payouts</Text>
          {wallet.payouts.length === 0 ? (
            <View className="rounded-xl bg-slate-50 p-3">
              <Text className="text-xs text-slate-500">
                No payouts yet. Once a customer pays, your {partnerPct} is sent to your UPI within {wallet.holdDays} days.
              </Text>
            </View>
          ) : (
            <View className="rounded-xl border border-slate-200">
              {wallet.payouts.map((p, i) => (
                <View key={p.id} className={`flex-row items-center justify-between gap-2 px-3 py-2.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                  <View className="min-w-0 shrink flex-row items-center gap-2.5">
                    <View className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <Send size={14} color={colors.emerald[600]} />
                    </View>
                    <View className="min-w-0 shrink">
                      <Text className="text-xs font-bold text-slate-900">Sent to your UPI</Text>
                      <Text className="truncate text-[10px] text-slate-500">
                        {formatDate(p.paidAt)} • {p.bookingCount} shoot(s)
                        {p.reference ? ` • Ref ${p.reference}` : ''}
                      </Text>
                    </View>
                  </View>
                  <Text className="shrink-0 text-sm font-black text-emerald-600">{formatINR(p.amount, { fixed: true })}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}
