"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Check, Clock, FileText, MessageSquare, RefreshCw, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type HistoryItem = {
  id: string
  type: 'created' | 'generated' | 'edited' | 'scheduled' | 'published' | 'comment'
  platform?: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube'
  user: string
  at: string
  title: string
  description?: string
  media?: string
}

const platformColors: Record<string, string> = {
  instagram: 'bg-gradient-to-br from-fuchsia-500 to-purple-500',
  facebook: 'bg-blue-600',
  twitter: 'bg-slate-900',
  linkedin: 'bg-sky-700',
  tiktok: 'bg-slate-800',
  youtube: 'bg-red-600',
}

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  // Sample timeline history – in a real app, fetch by params.id
  const history: HistoryItem[] = [
    {
      id: 'h6',
      type: 'published',
      platform: 'instagram',
      user: 'John D.',
      at: '2025-10-30 16:20',
      title: 'Published on Instagram',
      description: 'Summer Essentials post went live',
      media: '/smp-1.jpg',
    },
    {
      id: 'h5',
      type: 'scheduled',
      platform: 'twitter',
      user: 'John D.',
      at: '2025-10-30 12:05',
      title: 'Scheduled on X/Twitter',
      description: 'Auto-publish at 6pm local time',
    },
    {
      id: 'h4',
      type: 'edited',
      platform: 'facebook',
      user: 'Maya K.',
      at: '2025-10-30 10:12',
      title: 'Caption refined',
      description: 'Adjusted CTA and removed #sale for higher CTR',
    },
    {
      id: 'h3',
      type: 'generated',
      platform: 'instagram',
      user: 'AI Copilot',
      at: '2025-10-30 09:40',
      title: 'Generated 3 post variants',
      media: '/smp-2.jpeg',
    },
    {
      id: 'h2',
      type: 'comment',
      user: 'Alex P.',
      at: '2025-10-30 09:15',
      title: 'Comment',
      description: 'Let’s go with Variant B for IG and Variant A for X.',
    },
    {
      id: 'h1',
      type: 'created',
      user: 'John D.',
      at: '2025-10-29 17:05',
      title: 'Campaign created',
      description: 'Summer Collection Launch – Goal: Awareness',
    },
  ]

  const meta = {
    name: 'Summer Collection Launch',
    status: 'Active',
    goal: 'Brand Awareness',
    platforms: ['instagram','facebook','twitter'],
    id: params.id,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{meta.name}</h1>
          <p className="text-sm text-muted-foreground">Goal: {meta.goal} • ID: {meta.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/campaigns/create"><Button variant="outline" className="gap-2"><Sparkles className="w-4 h-4"/>New Campaign</Button></Link>
          <Link href="/campaigns/schedule"><Button variant="outline" className="gap-2"><Calendar className="w-4 h-4"/>Schedule</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {history.map((h) => (
                  <div key={h.id} className="relative pl-10">
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-full border border-border/50 bg-card flex items-center justify-center">
                      {h.type === 'created' && <Check className="w-3.5 h-3.5"/>}
                      {h.type === 'generated' && <Sparkles className="w-3.5 h-3.5"/>}
                      {h.type === 'edited' && <RefreshCw className="w-3.5 h-3.5"/>}
                      {h.type === 'scheduled' && <Clock className="w-3.5 h-3.5"/>}
                      {h.type === 'published' && <Check className="w-3.5 h-3.5"/>}
                      {h.type === 'comment' && <MessageSquare className="w-3.5 h-3.5"/>}
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{h.title}</span>
                          {h.platform && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-md text-white ${platformColors[h.platform]}`}>{h.platform}</span>
                          )}
                        </div>
                        {h.description && (<p className="text-sm text-muted-foreground mt-1">{h.description}</p>)}
                        {h.media && (
                          <div className="relative mt-3 w-48 aspect-video rounded-lg overflow-hidden border border-border/50">
                            <Image src={h.media} alt="media" fill className="object-cover" />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">{h.user} • {h.at}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-1"><FileText className="w-3 h-3"/>View</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-3">Status</h3>
            <div className="flex items-center gap-2"><span className="px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-500 border border-green-500/30">Active</span></div>
          </Card>
          <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-3">Platforms</h3>
            <div className="flex flex-wrap gap-2">
              {meta.platforms.map(p => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">{p}</span>
              ))}
            </div>
          </Card>
          <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Link href="/campaigns/generate"><Button className="w-full bg-primary hover:bg-primary/90">Generate More</Button></Link>
              <Link href="/campaigns/refine"><Button variant="outline" className="w-full">Refine</Button></Link>
              <Link href="/campaigns/schedule"><Button variant="outline" className="w-full">Schedule</Button></Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}



