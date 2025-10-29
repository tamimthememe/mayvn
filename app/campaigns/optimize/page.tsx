"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Repeat } from "lucide-react"

export default function CampaignOptimizePage() {
  const tips = [
    { title: "Best posting time", desc: "Post at 6pm local time for +12% engagement." },
    { title: "Top-performing format", desc: "Short-form video outperforms images by 23%." },
    { title: "Hashtag changes", desc: "Add #newdrop, #style, remove #sale for higher CTR." },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Optimization</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2"><Repeat className="w-4 h-4"/>Re-run Analytics</Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2"><Sparkles className="w-4 h-4"/>Apply Suggestions</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map((t,i)=> (
          <Card key={i} className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-1">{t.title}</h3>
            <p className="text-sm text-muted-foreground">{t.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}



