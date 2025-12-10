"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Loader2, AlertCircle, RefreshCw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TrendsResponse {
    trends: string[]
    error?: string
    note?: string
    isSample?: boolean
}

export function TrendingWidget() {
    const [trends, setTrends] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSample, setIsSample] = useState(false)

    const fetchTrends = async () => {
        setLoading(true)
        setError(null)
        setIsSample(false)

        try {
            const res = await fetch("/api/trends")
            const data: TrendsResponse = await res.json()

            if (data.error && (!data.trends || data.trends.length === 0)) {
                throw new Error(data.error)
            }

            setTrends(data.trends || [])
            setIsSample(data.isSample || false)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Something went wrong"
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTrends()
    }, [])

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Trending Keywords</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading trends...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Trending Keywords</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <AlertCircle className="h-8 w-8 text-amber-500 mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTrends}
                        className="gap-2 mt-3"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Trending Keywords</h3>
                <span className="ml-auto text-xs text-muted-foreground">
                    {isSample ? "Sample Data" : "US Daily Trends"}
                </span>
            </div>

            {isSample && (
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        Showing sample trends. Live data temporarily unavailable.
                    </p>
                </div>
            )}

            {trends.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trends available</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {trends.map((trend, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium 
                                       bg-gradient-to-r from-green-500/10 to-teal-500/10 
                                       border border-green-500/20 text-foreground
                                       hover:from-green-500/20 hover:to-teal-500/20 
                                       hover:border-green-500/40 hover:shadow-sm
                                       transition-all duration-200 cursor-default"
                        >
                            <TrendingUp className="h-3 w-3 mr-1.5 text-green-500" />
                            {trend}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
