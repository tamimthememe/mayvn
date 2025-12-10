'use client'

import { Card } from "@/components/ui/card"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Cell,
    Tooltip
} from "recharts"
import { Lightbulb } from "lucide-react"

interface ContentData {
    name: string
    displayName: string
    score: number
}

interface ContentComparisonChartProps {
    data: ContentData[]
    title?: string
}

export function ContentComparisonChart({
    data,
    title = "What Type of Content Resonates Most?"
}: ContentComparisonChartProps) {
    // Find the highest scoring content type
    const maxScore = Math.max(...data.map(d => d.score))
    const topPerformer = data.find(d => d.score === maxScore)

    // Chart colors
    const accentColor = '#047286'
    const mutedColor = 'rgba(255, 255, 255, 0.2)'

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 border border-border rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-sm font-medium text-white">{payload[0].payload.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                        Score: <span className="text-primary">{payload[0].value.toFixed(1)}</span>
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="p-6 bg-card/60 border-border/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                        <XAxis
                            type="number"
                            domain={[0, 10]}
                            tick={{ fill: '#a3a3a3', fontSize: 12 }}
                            axisLine={{ stroke: '#262626' }}
                            tickLine={{ stroke: '#262626' }}
                        />
                        <YAxis
                            type="category"
                            dataKey="displayName"
                            tick={{ fill: '#a3a3a3', fontSize: 12 }}
                            axisLine={{ stroke: '#262626' }}
                            tickLine={false}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Bar
                            dataKey="score"
                            radius={[0, 4, 4, 0]}
                            barSize={24}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.score === maxScore ? accentColor : mutedColor}
                                    style={{
                                        filter: entry.score === maxScore
                                            ? 'drop-shadow(0 0 6px rgba(4, 114, 134, 0.5))'
                                            : 'none'
                                    }}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Recommendation callout */}
            {topPerformer && (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-white">Recommendation:</span>{' '}
                        {topPerformer.displayName} have the highest score. Focus on creating more{' '}
                        <span className="text-primary">{topPerformer.displayName.toLowerCase()}</span> content.
                    </p>
                </div>
            )}
        </Card>
    )
}

export default ContentComparisonChart
