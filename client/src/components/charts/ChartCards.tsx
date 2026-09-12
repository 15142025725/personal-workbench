import { Card, CardHeader } from '../ui/Card'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'

const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899']

export function LineChartCard({ title, data, lines }: {
  title: string
  data: any[]
  lines: { key: string; label: string }[]
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
          <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12 }} />
          {lines.map((line, i) => (
            <Line key={line.key} type="monotone" dataKey={line.key} name={line.label} stroke={colors[i]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function BarChartCard({ title, data, dataKey = 'count', nameKey = 'name' }: {
  title: string
  data: any[]
  dataKey?: string
  nameKey?: string
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} stroke="#a3a3a3" />
          <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12 }} />
          <Bar dataKey={dataKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function PieChartCard({ title, data }: {
  title: string
  data: { name: string; value: number }[]
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={70}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function AreaChartCard({ title, data, areas }: {
  title: string
  data: any[]
  areas: { key: string; label: string }[]
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
          <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12 }} />
          {areas.map((area, i) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.label}
              stackId="1"
              stroke={colors[i]}
              fill={colors[i]}
              fillOpacity={0.15}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
