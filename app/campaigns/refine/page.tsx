"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Send } from "lucide-react"

export default function CampaignRefinePage() {
  return (
    <div className="space-y-6">
      <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
        <h3 className="font-semibold mb-2">Inline Editor</h3>
        <textarea rows={8} className="w-full bg-input border border-border/50 rounded-md px-3 py-2 text-sm" defaultValue={"Edit your campaign copy here..."} />
        <div className="mt-3 text-xs text-muted-foreground">Compliance: No banned words detected. Tone: Consistent.</div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" className="gap-2 text-destructive hover:text-destructive"><X className="w-4 h-4"/>Reject</Button>
        <Button variant="outline" className="gap-2"><Send className="w-4 h-4"/>Send for Review</Button>
        <Button className="gap-2 bg-primary hover:bg-primary/90"><Check className="w-4 h-4"/>Approve</Button>
      </div>
    </div>
  )
}



