import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

interface ChartData {
  name: string;
  vendas?: number;
  comissoes?: number;
  arrecadacao?: number;
  cartelas?: number;
  [key: string]: string | number | undefined;
}

interface SalesChartProps {
  title: string;
  data: ChartData[];
  type?: 'area' | 'bar' | 'line';
  dataKeys: { key: string; label: string; color: string }[];
  height?: number;
}

const chartConfig = {
  vendas: { label: 'Vendas', color: 'hsl(var(--primary))' },
  comissoes: { label: 'Comissões', color: 'hsl(var(--success))' },
  arrecadacao: { label: 'Arrecadação', color: 'hsl(var(--accent))' },
  cartelas: { label: 'Cartelas', color: 'hsl(var(--secondary))' },
};

export function SalesChart({ title, data, type = 'area', dataKeys, height = 300 }: SalesChartProps) {
  const config = dataKeys.reduce((acc, { key, label, color }) => {
    acc[key] = { label, color };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="w-full" style={{ height }}>
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {dataKeys.map(({ key, color }) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {dataKeys.map(({ key, color }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#gradient-${key})`}
                />
              ))}
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {dataKeys.map(({ key, color }) => (
                <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {dataKeys.map(({ key, color }) => (
                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ fill: color }} />
              ))}
            </LineChart>
          )}
        </ChartContainer>
        <div className="flex justify-center gap-4 mt-4">
          {dataKeys.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
