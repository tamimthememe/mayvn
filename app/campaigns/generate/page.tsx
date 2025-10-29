"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw, Save, Wand2 } from "lucide-react"
import Image from "next/image"

export default function CampaignGeneratePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {["/smp-1.jpg","/smp-2.jpeg","/smp-3.jpeg"].map((src,i)=>(
          <Card key={i} className="p-0 overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="relative w-full aspect-video">
              <Image src={src} alt="post" fill className="object-cover" />
            </div>
            <div className="p-4 text-sm">
              Generated caption variant {i+1}
            </div>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-3">Edit Panel</h3>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs mb-1">Tone</label>
              <select className="w-full bg-input border border-border/50 rounded-md px-3 py-2 text-sm"><option>Professional</option><option>Playful</option></select>
            </div>
            <div>
              <label className="block text-xs mb-1">Style</label>
              <select className="w-full bg-input border border-border/50 rounded-md px-3 py-2 text-sm"><option>Minimal</option><option>Bold</option></select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="gap-2"><RefreshCw className="w-4 h-4"/>Regenerate</Button>
              <Button variant="outline" className="gap-2"><Wand2 className="w-4 h-4"/>Approve</Button>
              <Button className="gap-2 bg-primary hover:bg-primary/90"><Save className="w-4 h-4"/>Save Draft</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}



