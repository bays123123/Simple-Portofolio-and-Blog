import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Eye,
  BarChart3,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  FileText,
  Link2,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface PageView {
  id: string;
  path: string;
  source: string;
  device: string;
  country: string | null;
  country_code: string | null;
  session_id: string | null;
  created_at: string;
}

const RANGES = [
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: '90 Hari', days: 90 },
];

const deviceIcon = (device: string) => {
  if (device === 'mobile') return <Smartphone size={14} />;
  if (device === 'tablet') return <Tablet size={14} />;
  return <Monitor size={14} />;
};

const countryFlag = (code: string | null) => {
  if (!code || code.length !== 2) return '🌐';
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
};

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const RankList = ({
  title,
  icon,
  items,
  renderLabel,
}: {
  title: string;
  icon: React.ReactNode;
  items: { key: string; label: string; value: number; meta?: string | null }[];
  renderLabel?: (item: { key: string; label: string; meta?: string | null }) => React.ReactNode;
}) => {
  const max = items.length ? Math.max(...items.map((i) => i.value)) : 0;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        ) : (
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate flex items-center gap-2 min-w-0">
                    {renderLabel ? renderLabel(item) : item.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {item.value}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${max ? (item.value / max) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AnalyticsDashboard = () => {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-page-views', days],
    queryFn: async () => {
      const since = startOfDay(subDays(new Date(), days - 1)).toISOString();
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as PageView[];
    },
  });

  const stats = useMemo(() => {
    const rows = data || [];
    const totalViews = rows.length;
    const visitors = new Set(rows.map((r) => r.session_id || r.id)).size;
    const pvPerVisit = visitors ? (totalViews / visitors).toFixed(1) : '0';

    const tally = (key: keyof PageView) => {
      const map = new Map<string, { value: number; meta?: string | null }>();
      rows.forEach((r) => {
        const k = (r[key] as string) || 'Unknown';
        const existing = map.get(k);
        map.set(k, {
          value: (existing?.value || 0) + 1,
          meta: key === 'country' ? r.country_code : existing?.meta,
        });
      });
      return Array.from(map.entries())
        .map(([label, v]) => ({ key: label, label, value: v.value, meta: v.meta }))
        .sort((a, b) => b.value - a.value);
    };

    // Time series by day
    const seriesMap = new Map<string, { views: number; sessions: Set<string> }>();
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
      seriesMap.set(d, { views: 0, sessions: new Set() });
    }
    rows.forEach((r) => {
      const d = format(new Date(r.created_at), 'yyyy-MM-dd');
      const entry = seriesMap.get(d);
      if (entry) {
        entry.views += 1;
        entry.sessions.add(r.session_id || r.id);
      }
    });
    const series = Array.from(seriesMap.entries()).map(([date, v]) => ({
      date: format(new Date(date), 'dd MMM'),
      Kunjungan: v.sessions.size,
      Tampilan: v.views,
    }));

    return {
      totalViews,
      visitors,
      pvPerVisit,
      countries: tally('country').length,
      pages: tally('path'),
      sources: tally('source'),
      devices: tally('device'),
      countryList: tally('country'),
      series,
    };
  }, [data, days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          Statistik Pengunjung
        </h2>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? 'default' : 'ghost'}
              className="h-7 px-3 text-xs"
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Memuat data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Users size={18} />} label="Pengunjung" value={stats.visitors} />
            <StatCard icon={<Eye size={18} />} label="Tampilan Halaman" value={stats.totalViews} />
            <StatCard
              icon={<BarChart3 size={18} />}
              label="Halaman / Kunjungan"
              value={stats.pvPerVisit}
            />
            <StatCard icon={<Globe size={18} />} label="Negara" value={stats.countries} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tren Trafik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.series} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Tampilan"
                      stroke="hsl(var(--primary))"
                      fill="url(#gViews)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Kunjungan"
                      stroke="hsl(var(--muted-foreground))"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <RankList
              title="Halaman Teratas"
              icon={<FileText size={16} className="text-primary" />}
              items={stats.pages}
            />
            <RankList
              title="Sumber Trafik"
              icon={<Link2 size={16} className="text-primary" />}
              items={stats.sources}
            />
            <RankList
              title="Perangkat"
              icon={<Monitor size={16} className="text-primary" />}
              items={stats.devices}
              renderLabel={(item) => (
                <span className="flex items-center gap-2 capitalize">
                  {deviceIcon(item.label)}
                  {item.label}
                </span>
              )}
            />
            <RankList
              title="Negara"
              icon={<Globe size={16} className="text-primary" />}
              items={stats.countryList}
              renderLabel={(item) => (
                <span className="flex items-center gap-2">
                  <span>{countryFlag(item.meta ?? null)}</span>
                  {item.label}
                </span>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
