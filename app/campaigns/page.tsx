"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Search, Filter, SortAsc, Eye, Pencil, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CampaignsOverviewPage() {
  const [view, setView] = useState<'grid'|'table'>('grid')
  const [query, setQuery] = useState("")

  const campaigns = [
    { id: 1, name: "Summer Collection Launch", goal: "Brand Awareness", status: "Active", platforms: ["Instagram","TikTok"], reach: "45.2K", ctr: "3.2%", conv: "312", image: "/smp-1.jpg" },
    { id: 2, name: "Back to School", goal: "Sales", status: "Draft", platforms: ["Meta","LinkedIn"], reach: "12.0K", ctr: "1.8%", conv: "96", image: "/smp-3.jpeg" },
    { id: 3, name: "Holiday Gift Guide", goal: "Leads", status: "Completed", platforms: ["YouTube","TikTok"], reach: "72.9K", ctr: "2.4%", conv: "540", image: "/smp-4.jpg" },
  ].filter(c => c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-input border border-border/50 rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search campaigns" className="bg-transparent border-0 outline-none text-sm flex-1" />
          </div>
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4"/>Filter</Button>
          <Button variant="outline" className="gap-2"><SortAsc className="w-4 h-4"/>Sort</Button>
        </div>
        <Link href="/campaigns/create">
          <Button className="bg-primary hover:bg-primary/90"><Sparkles className="w-4 h-4 mr-2"/>Create Campaign</Button>
        </Link>
      </div>

      {view === 'grid' ? (
        campaigns.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <Card key={c.id} className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden p-0">
                <div className="relative w-full aspect-video bg-muted">
                  <Image src={c.image} alt={c.name} fill className="object-cover" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-2xl">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">Goal: {c.goal}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md border border-border/50">{c.status}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.platforms.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">{p}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs  mt-5">
                    <div><p className="text-muted-foreground">Reach</p><p className="font-semibold text-2xl">{c.reach}</p></div>
                    <div><p className="text-muted-foreground">CTR</p><p className="font-semibold text-2xl">{c.ctr}</p></div>
                    <div><p className="text-muted-foreground">Conv.</p><p className="font-semibold text-2xl">{c.conv}</p></div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-4">
                    <Link href={`/campaigns/${c.id}`}><Button size="sm" variant="outline" className="gap-1"><Eye className="w-3 h-3"/>View</Button></Link>
                    <Link href={`/campaigns/create?id=${c.id}`}><Button size="sm" variant="outline" className="gap-1"><Pencil className="w-3 h-3"/>Edit</Button></Link>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive"><Trash2 className="w-3 h-3"/>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-12 flex flex-col items-center justify-center min-h-72">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground text-center mb-6">Create your first campaign to get started</p>
            <Link href="/campaigns/create"><Button className="bg-primary hover:bg-primary/90">Create your first campaign</Button></Link>
          </Card>
        )
      ) : null}
    </div>
  )
}


