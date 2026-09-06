import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface CohortPlacementDatum {
  name: string;
  ready: number;
  placed: number;
}

export function CohortPlacementChart({ data }: { data: CohortPlacementDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted) / .55)' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 14px 40px rgba(36,42,67,.14)',
            fontSize: 12,
            fontWeight: 600,
          }}
        />
        <Bar dataKey="ready" name="Career-ready" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} maxBarSize={38} />
        <Bar dataKey="placed" name="Placed" fill="hsl(var(--accent))" radius={[5, 5, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
}
