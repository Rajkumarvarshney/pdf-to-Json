import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, FileText, Clock, Zap, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Area, AreaChart } from 'recharts'
import { mockStats } from '../../data/mockData'

const weeklyData = [
  { day: 'Mon', docs: 8, exports: 15 },
  { day: 'Tue', docs: 12, exports: 22 },
  { day: 'Wed', docs: 6, exports: 11 },
  { day: 'Thu', docs: 18, exports: 30 },
  { day: 'Fri', docs: 14, exports: 25 },
  { day: 'Sat', docs: 5, exports: 8 },
  { day: 'Sun', docs: 3, exports: 6 },
]

const accuracyData = [
  { month: 'Aug', accuracy: 94 },
  { month: 'Sep', accuracy: 95.5 },
  { month: 'Oct', accuracy: 96.8 },
  { month: 'Nov', accuracy: 97.2 },
  { month: 'Dec', accuracy: 98.1 },
  { month: 'Jan', accuracy: 99.2 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 rounded-xl text-xs border border-white/10">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    )
  }
  return null
}

const StatCard = ({ label, value, change, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-5"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex items-center gap-1 text-xs text-green-400">
        <ArrowUpRight size={12} />
        {change}
      </div>
    </div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-gray-500 text-sm">{label}</div>
  </motion.div>
)

export default function AnalyticsSection() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-white/5 flex-shrink-0">
        <h1 className="text-2xl font-black text-white mb-1">Analytics</h1>
        <p className="text-gray-400 text-sm">Usage metrics and performance insights</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Documents Parsed" value={mockStats.documents} change="+12%" icon={FileText} color="bg-indigo-500" delay={0} />
          <StatCard label="Schemas Generated" value={mockStats.schemasGenerated} change="+12%" icon={Zap} color="bg-purple-500" delay={0.08} />
          <StatCard label="Total Exports" value={mockStats.exportsCreated} change="+34%" icon={BarChart3} color="bg-cyan-500" delay={0.16} />
          <StatCard label="RAG Chunks" value={mockStats.ragChunks} change="+58%" icon={TrendingUp} color="bg-emerald-500" delay={0.24} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activity chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5 rounded-xl"
          >
            <h3 className="text-white font-semibold mb-4">Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barSize={12} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="docs" name="Documents" fill="#6366f1" radius={4} />
                <Bar dataKey="exports" name="Exports" fill="#a855f7" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Accuracy trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5 rounded-xl"
          >
            <h3 className="text-white font-semibold mb-4">Extraction Accuracy</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 100]} tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#06b6d4" fill="url(#accuracyGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-white/5">
            <h3 className="text-white font-semibold">Recent Activity</h3>
          </div>
          <div className="divide-y divide-white/4">
            {[
              { icon: '📄', action: 'Parsed', doc: 'Resume_John_Doe.pdf', time: '2m ago', badge: 'completed' },
              { icon: '📊', action: 'Exported', doc: 'Invoice_Q4_2023.pdf → CSV', time: '18m ago', badge: 'export' },
              { icon: '🧠', action: 'Schema generated', doc: 'Research_Paper_ML.pdf', time: '1h ago', badge: 'schema' },
              { icon: '⚡', action: 'RAG pipeline', doc: 'Contract_Services_2024.pdf', time: '3h ago', badge: 'rag' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-white/2 transition-colors">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <span className="text-sm text-gray-300">{item.action}</span>
                  <span className="text-sm text-gray-500"> — {item.doc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 flex items-center gap-1"><Clock size={10} /> {item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
