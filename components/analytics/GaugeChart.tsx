'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle, TrendingUp, TrendingDown } from "lucide-react"

interface GaugeChartProps {
    value: number
    maxValue?: number
    delta?: number
    label: string
    tooltipText: string
}

export function GaugeChart({
    value,
    maxValue = 10,
    delta,
    label,
    tooltipText
}: GaugeChartProps) {
    // Calculate percentage for the arc
    const percentage = Math.min(value / maxValue, 1)
    const radius = 80
    const strokeWidth = 12
    const circumference = Math.PI * radius // Half circle
    const strokeDashoffset = circumference * (1 - percentage)

    // Gradient colors based on score
    const getGradientColor = () => {
        if (percentage >= 0.7) return { start: '#10b981', end: '#047286' } // Green to Teal
        if (percentage >= 0.4) return { start: '#047286', end: '#0ea5e9' } // Teal to Blue
        return { start: '#ef4444', end: '#f97316' } // Red to Orange
    }

    const colors = getGradientColor()
    const gradientId = `gauge-gradient-${Math.random().toString(36).substr(2, 9)}`

    return (
        <div className="flex flex-col items-center justify-center p-6">
            <div className="relative">
                {/* SVG Gauge */}
                <svg
                    width="200"
                    height="120"
                    viewBox="0 0 200 120"
                    className="transform -rotate-0"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colors.start} />
                            <stop offset="100%" stopColor={colors.end} />
                        </linearGradient>
                    </defs>

                    {/* Background Arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Foreground Arc - Progress */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-out"
                        style={{
                            filter: 'drop-shadow(0 0 8px rgba(4, 114, 134, 0.5))'
                        }}
                    />
                </svg>

                {/* Center Score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                    <span className="text-5xl font-bold text-white tracking-tight">
                        {value.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Label with Tooltip */}
            <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-semibold text-white">{label}</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-white transition-colors">
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px] text-center">
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Delta Indicator */}
            {delta !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                    {delta >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                    ) : (
                        <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs last period
                    </span>
                </div>
            )}
        </div>
    )
}

export default GaugeChart
