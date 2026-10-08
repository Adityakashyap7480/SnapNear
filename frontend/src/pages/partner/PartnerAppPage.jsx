import { useState } from 'react';
import { BadgeCheck, CheckCheck, History, IndianRupee, Locate, Power, Radar, Star, Wallet, Camera, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { EmptyState, StatCard } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { PageLoader } from '../../components/ui/Spinner';
import RequestCard from '../../components/partner/RequestCard';
import ActiveJobCard from '../../components/partner/ActiveJobCard';
import JobHistory from '../../components/partner/JobHistory';
import { creatorApi } from '../../api/services';
import { useSocketEvent } from '../../context/SocketContext';
import useAsync from '../../hooks/useAsync';
import { CREATOR_NEXT_ACTION } from '../../utils/bookingStatus';
import { formatINR } from '../../utils/format';
import { playChime } from '../../utils/sound';

export default function PartnerAppPage() {
  const { data, setData, loading, error, reload } = useAsync(() => creatorApi.dashboard(), []);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useSocketEvent('feed:update', async (payload) => {
    const fresh = await reload();
    if (payload.event !== 'booking:created' || !fresh?.profile.creatorProfile.isOnline) return;
    const isForMe = fresh.requests.some((r) => r.id === payload.bookingId);
    if (isForMe) {
      playChime('broadcast');
      toast(`🔔 New shoot request: ${payload.occasion} for ${formatINR(payload.creatorPayout)}`, { duration: 6000 });
    }
  });

  useSocketEvent('booking:update', async (payload) => {
    await reload();
    if (payload.event === 'booking:cancelled') {
      playChime('ping');
      toast.error(`Booking ${payload.code} was cancelled`);
    }
  });

  if (loading) return <PageLoader label="Loading SnapNear Partner..." />;
  if (error || !data) return <p className="py-20 text-center text-sm text-red-600">{error}</p>;

  const { profile, requests, activeJob, history, stats } = data;
  const cp = profile.creatorProfile;
  const online = cp.isOnline;

  const toggleDuty = async () => {
    setTogglingDuty(true);
    try {
      await creatorApi.setDuty(!online);
      await reload();
      toast.success(online ? 'You are offline. No new pings.' : "You're online! Nearby requests will ping you.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingDuty(false);
    }
  };

  const accept = async (req) => {
    setBusyId(req.id);
    try {
      await creatorApi.accept(req.id);
      playChime('ping');
      toast.success(`Shoot accepted! Head to ${req.client.name}'s location.`);
      await reload();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.message);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (req) => {
    setData((d) => ({ ...d, requests: d.requests.filter((r) => r.id !== req.id) }));
    try {
      await creatorApi.decline(req.id);
    } catch {
      reload();
    }
  };

  const advance = async (job) => {
    setBusyId(job.id);
    try {
      const { booking } = await creatorApi.advance(job.id);
      playChime('ping');
      if (booking.status === 'completed') {
        toast.success(`Shoot completed! ${formatINR(booking.creatorPayout, { fixed: true })} added to your earnings.`);
      } else {
        toast.success(`Status updated: ${CREATOR_NEXT_ACTION[job.status].label}`);
      }
      await reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-col justify-between gap-4 p-4 sm:p-5 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar name={profile.name} size="lg" ring="ring-2 ring-brand-violet ring-offset-2" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-slate-900">{profile.name}</h2>
              {cp.isVerified && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCheck className="h-3 w-3" /> Verified Partner
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
              <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-brand-violet">
                {cp.experienceYears}+ Years &bull; {cp.services.map((s) => (s === 'photo' ? 'Photography' : 'Videography')).join(' & ')}
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {cp.rating.toFixed(1)} ({stats.completed} shoots)
              </span>
            </div>
            {cp.gear && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                <Camera className="h-3 w-3" /> {cp.gear}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-2.5 md:justify-start">
          <div>
            <span className="block text-[11px] font-semibold text-slate-500">Duty Status</span>
            {online ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Online & Ready
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Offline
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={toggleDuty}
            disabled={togglingDuty}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-60 sm:py-2 ${
              online ? 'bg-slate-800 hover:bg-slate-700' : 'bg-emerald-600 shadow-md shadow-emerald-600/30 hover:bg-emerald-700'
            }`}
          >
            <Power className="h-3.5 w-3.5" /> {online ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="emerald" icon={Wallet} label="Today's Net Earnings" value={formatINR(stats.todayEarnings, { fixed: true })} hint={`${stats.todayCompleted} shoot(s) today • your 80%`} />
        <StatCard icon={BadgeCheck} label="Completed Shoots" value={stats.completed} hint="Lifetime on SnapNear" />
        <StatCard tone="violet" icon={IndianRupee} label="Lifetime Earnings" value={formatINR(stats.lifetimeEarnings, { fixed: true })} hint="Your 80% payouts" />
        <StatCard icon={Landmark} label="Platform Commission" value={formatINR(stats.platformFeePaid, { fixed: true })} hint="20% tech fee contribution" />
      </div>

      {activeJob && <ActiveJobCard job={activeJob} onAdvance={advance} busy={busyId === activeJob.id} />}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-slate-900">Nearby Shoot Requests</h3>
            {online && requests.length > 0 && (
              <span className="rounded-full bg-brand-orange px-2 py-0.5 text-[11px] font-bold text-white">{requests.length} New</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Locate className="h-3.5 w-3.5 text-brand-orange" /> Live matching
          </span>
        </div>

        {!online ? (
          <Card>
            <EmptyState
              icon={Power}
              title="You're offline"
              description="Go online to start receiving shoot requests from customers near you."
              action={
                <button type="button" onClick={toggleDuty} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                  Go Online
                </button>
              }
            />
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <EmptyState
              icon={Radar}
              title="No pending requests right now"
              description="Stay online! New booking requests from nearby customers will pop up here with an audio ping."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onAccept={accept}
                onDecline={decline}
                busy={busyId === r.id}
                disabledReason={activeJob ? 'Finish your current shoot first' : null}
              />
            ))}
          </div>
        )}
      </section>

      <Card className="p-4 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          <h3 className="font-display text-base font-bold text-slate-900">Recent Jobs</h3>
        </div>
        <JobHistory history={history} />
      </Card>
    </div>
  );
}
