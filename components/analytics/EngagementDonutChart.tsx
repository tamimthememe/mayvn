'use client'

import { Card } from "@/components/ui/card"
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from "recharts"

interface EngagementData {
    name: string
    displayName: string
    value: number
    color: string
}

interface EngagementDonutChartProps {
    likes: number
    comments: number
    shares: number
    saves: number
    title?: string
}

export function EngagementDonutChart({
    likes,
    comments,
    shares,
    saves,
    title = "What People Do With Your Posts"
}: EngagementDonutChartProps) {
    const total = likes + comments + shares + saves

    const data: EngagementData[] = [
        {
            name: 'likes',
            displayName: 'Quick Love',
            value: likes,
            color: '#ef4444' // Red for hearts/likes
        },
        {
            name: 'comments',
            displayName: 'Conversations',
            value: comments,
            color: '#3b82f6' // Blue for comments
        },
        {
            name: 'shares',
            displayName: 'Amplification',
            value: shares,
            color: '#8b5cf6' // Purple for shares
        },
        {
            name: 'saves',
            displayName: 'Future Intent',
            value: saves,
            color: '#10b981' // Highlighted green for saves (highest value action)
        },
    ]

    // Calculate percentages
    const getPercentage = (value: number) => {
        if (total === 0) return 0
        return ((value / total) * 100).toFixed(1)
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload
            return (
                <div className="bg-background/95 border border-border rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-sm font-medium" style={{ color: item.color }}>
                        {item.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {item.value.toLocaleString()} ({getPercentage(item.value)}%)
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="p-6 bg-card/60 border-border/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

            <div className="flex items-center gap-6">
                {/* Donut Chart */}
                <div className="h-[180px] w-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                dataKey="value"
                                paddingAngle={2}
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        style={{
                                            filter: entry.name === 'saves'
                                                ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))'
                                                : 'none'
                                        }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-white">{total.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">Total Actions</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: item.color,
                                        boxShadow: item.name === 'saves'
                                            ? '0 0 8px rgba(16, 185, 129, 0.5)'
                                            : 'none'
                                    }}
                                />
                                <span className={`text-sm ${item.name === 'saves'
                                        ? 'font-medium text-white'
                                        : 'text-muted-foreground'
                                    }`}>
                                    {item.displayName}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                    {item.value.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({getPercentage(item.value)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Insight about saves */}
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-emerald-400">💡 Saves indicate high value:</span>{' '}
                    People who save your content plan to reference it later — a strong signal of quality.
                </p>
            </div>
        </Card>
    )
}

export default EngagementDonutChart
