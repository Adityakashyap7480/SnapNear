import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { PageLoader } from '../ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { type Role } from '../../config/constants';
import { ROUTES } from '../../config/routes';
import { homeFor } from '../../lib/roleHome';

function Loading() {
  return (
    <View className="flex-1 bg-slate-50">
      <PageLoader />
    </View>
  );
}

/** Signed-in users with one of `roles`; everyone else goes to login or their own home. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, initializing } = useAuth();
  if (initializing) return <Loading />;
  if (!user) return <Redirect href={ROUTES.LOGIN} />;
  if (!roles.includes(user.role)) return <Redirect href={homeFor(user.role)} />;
  return children;
}

/** Login and signup: signed-in users are sent to their home. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  if (initializing) return <Loading />;
  if (user) return <Redirect href={homeFor(user.role)} />;
  return children;
}

export function HomeRedirect() {
  const { user, initializing } = useAuth();
  if (initializing) return <Loading />;
  return <Redirect href={user ? homeFor(user.role) : ROUTES.LOGIN} />;
}
