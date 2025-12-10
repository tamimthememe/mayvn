"use client"

import { TrendingWidget } from "@/components/TrendingWidget"
import { InstaAITrends } from "@/components/InstaAITrends"

export default function TrendsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Trending Keywords & Hashtags</h1>
                <p className="text-muted-foreground">
                    Discover trending topics and generate AI-powered hashtags for your brand
                </p>
            </div>

            <TrendingWidget />

            <div className="pt-4">
                <InstaAITrends />
            </div>
        </div>
    )
}
