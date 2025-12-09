'use client'

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line
} from "recharts"

type ChartType = 'sparkline' | 'line' | 'bar'

interface KPICardProps {
    title: string
    value: string | number
    delta?: number
    deltaLabel?: string
    chartType?: ChartType
    chartData?: Array<{ value: number }>
    chartColor?: string
    icon?: React.ReactNode
}

export function KPICard({
    title,
    value,
    delta,
    deltaLabel = "vs last period",
    chartType = 'sparkline',
    chartData = [],
    chartColor = '#047286',
    icon
}: KPICardProps) {
    const isPositive = delta !== undefined && delta >= 0

    const renderChart = () => {
        if (chartData.length === 0) return null

        const commonProps = {
            data: chartData,
            margin: { top: 0, right: 0, left: 0, bottom: 0 }
        }

        switch (chartType) {
            case 'sparkline':
                return (
                    <ResponsiveContainer width="100%" height={40}>
                        <AreaChart {...commonProps}>
                            <defs>
                                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={chartColor}
                                strokeWidth={2}
                                fill={`url(#gradient-${title})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={40}>
                        <LineChart {...commonProps}>
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={chartColor}
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={40}>
                        <BarChart {...commonProps}>
                            <Bar
                                dataKey="value"
                                fill={chartColor}
                                radius={[2, 2, 0, 0]}
                                opacity={0.8}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )

            default:
                return null
        }
    }

    return (
        <Card className="p-5 bg-card/60 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {icon && (
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                    <span className="text-sm text-muted-foreground font-medium">{title}</span>
                </div>
            </div>

            <div className="flex items-end justify-between">
                <div className="flex-1">
                    <p className="text-3xl font-bold text-white tracking-tight mb-1">
                        {typeof value === 'number' && value >= 0 ? '+' : ''}{value}
                    </p>

                    {delta !== undefined && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                                {isPositive ? '+' : ''}{delta.toFixed(1)}% {deltaLabel}
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-24 ml-4">
                    {renderChart()}
                </div>
            </div>
        </Card>
    )
}

export default KPICard
