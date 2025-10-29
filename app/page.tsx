"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft, Menu, Sparkles, Zap, BarChart3, MessageSquare, Calendar, Shield, Instagram, Linkedin, Facebook, Twitter, Youtube } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [energize, setEnergize] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const features = [
    {
      icon: Sparkles,
      title: "AI Content Generation",
      description: "Create engaging posts, captions, and hashtags in seconds with our intelligent AI",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: "Smart Automation",
      description: "Automate campaign creation, scheduling, and engagement across all platforms",
      color: "from-cyan-500 to-blue-500",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track performance metrics and get AI-powered insights to optimize campaigns",
      color: "from-pink-500 to-orange-500",
    },
    {
      icon: MessageSquare,
      title: "Engagement Hub",
      description: "Manage mentions, comments, and DMs with AI-powered auto-reply suggestions",
      color: "from-teal-500 to-cyan-500",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Schedule posts at optimal times with drag-and-drop calendar interface",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Shield,
      title: "Brand Safety",
      description: "Maintain brand consistency with custom tone guidelines and compliance checks",
      color: "from-green-500 to-teal-500",
    },
  ]

  const stats = [
    { label: "Campaigns Created", value: "10K+" },
    { label: "Content Generated", value: "500K+" },
    { label: "Engagement Rate", value: "3.5x" },
    { label: "Time Saved", value: "40hrs/mo" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-full.png" alt="Mayvn Logo" width={150} height={60} className="hidden md:block" />
            <Image src="/logo-small.png" alt="Mayvn" width={36} height={36} className="md:hidden" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-primary transition-colors">
              Features
            </a>
            <a href="#stats" className="text-sm hover:text-primary transition-colors">
              Impact
            </a>
            <a href="#pricing" className="text-sm hover:text-primary transition-colors">
              Pricing
            </a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Get Started
              </Button>
            </Link>
          </div>
          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border/60 bg-card/60 backdrop-blur hover:bg-card">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 overflow-hidden">
                <div className="relative h-full">
                  {/* gradient header */}
                  <div className="px-5 pt-6 pb-4 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <Image src="/logo-small.png" alt="Mayvn" width={28} height={28} />
                      <div>
                        <div className="font-semibold">Mayvn</div>
                        <div className="text-xs text-muted-foreground">AI Marketing Copilot</div>
                      </div>
                    </div>
                  </div>
                  {/* nav links */}
                  <div className="px-5 py-5 space-y-2">
                    <a href="#features" className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card px-4 py-3">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span className="text-sm">Features</span>
                    </a>
                    <a href="#stats" className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card px-4 py-3">
                      <BarChart3 className="h-4 w-4 text-accent" />
                      <span className="text-sm">Impact</span>
                    </a>
                    <a href="#pricing" className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card px-4 py-3">
                      <Zap className="h-4 w-4 text-accent" />
                      <span className="text-sm">Pricing</span>
                    </a>
                    <a href="#how-it-works" className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card px-4 py-3">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span className="text-sm">How it works</span>
                    </a>
                  </div>
                  {/* actions */}
                  <div className="px-5 pb-6 pt-2 border-t border-border/60">
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/login" className="text-sm">
                        <Button variant="ghost" className="w-full rounded-xl">Sign In</Button>
                      </Link>
                      <Link href="/onboarding" className="text-sm">
                        <Button className="w-full rounded-xl bg-accent hover:bg-accent/90">Get Started</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section - Simple Waitlist style */}
      <section className={`relative flex items-center justify-center min-h-[100svh] px-4 sm:px-6 lg:px-8 overflow-hidden hero ${energize ? 'hero-energize' : ''}`}>
        {/* star field */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_130%,rgba(4,114,134,0.15),transparent_65%)]"/>
        <div className="starfield">
          <div className="star-layer star-small"></div>
          <div className="star-layer star-medium"></div>
          <div className="star-layer star-large"></div>
        </div>
        {/* earth horizon glow */}
        <div className="pointer-events-none absolute bottom-[-180px] left-1/2 -translate-x-1/2 w-[1400px] h-[360px] rounded-[50%] bg-gradient-to-t from-accent/30 via-accent/10 to-transparent blur-3xl"/>
        

        <div className="relative max-w-3xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-xs text-muted-foreground">Mayvn • Beta Access</div>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
            Because great marketing <br/> shouldn’t feel <span className="italic text-muted-foreground font-instrument">like work.</span>
          </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Mayvn automates your campaigns from creation to engagement – powered by AI that learns your brand.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/onboarding">
                <Button
                  size="lg"
                  className="px-8 bg-accent hover:bg-accent/90 hover:shadow-[0_0_30px_rgba(4,114,134,0.55)]"
                  onMouseEnter={()=> setEnergize(true)}
                  onMouseLeave={()=> setEnergize(false)}
                >
                  Start Automating
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 border-primary/50 hover:bg-primary/10 hover:border-accent/60 hover:shadow-[0_0_18px_rgba(4,114,134,0.35)] transition-shadow"
                  onMouseEnter={()=> setEnergize(true)}
                  onMouseLeave={()=> setEnergize(false)}
                >
                  See It in Action
                </Button>
              </Link>
            </div>
        </div>
      </section>


      {/* Feature Strip — Built for Modern Brands */}
      <section className="relative py-32 px-0">
        <div className="w-full">
          <div className="text-center mb-12 space-y-2">
            <h3 className="text-sm text-primary/80">Built for Modern Brands</h3>
            <h2 className="text-3xl md:text-4xl font-semibold">Automation that feels human.</h2>
          </div>

          <FeatureStrip />
        </div>
      </section>

      {/* Generated Posts Moving Bento Row */}
      <section className="relative py-24 px-0">
        <div className="w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-muted-foreground">See AI in Action</h2>
          </div>
          <div className="relative overflow-hidden border-t border-b border-border/50 bg-card/30">
            {/* edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background/80 to-transparent z-10"/>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/80 to-transparent z-10"/>
            <div className={`marquee-track marquee-rtl`}> 
              {Array.from({length:2}).map((_,seg)=>{
                const cols = 14
                const rows = 8
                const images = ['/smp-1.jpg','/smp-2.jpeg','/smp-3.jpeg','/smp-4.jpg','/smp-5.jpeg','/smp-6.jpg']
                // Predefined large squares (4x4) and mediums (2x2)
                const preset = [
                  // frame bands 2x2
                  ...[1,3,5,7,9,11].map((c,i)=>({ c, r:1, w:2, h:2, src: images[i%images.length] })),
                  ...[1,13].flatMap((c)=>[
                    { c, r:3, w:2, h:2, src: images[2] },
                    { c, r:5, w:2, h:2, src: images[3] },
                  ]),
                  ...[1,3,5,7,9,11].map((c,i)=>({ c, r:7, w:2, h:2, src: images[(i+1)%images.length] })),
                  // center big 4x4 and four 2x2 anchors
                  { c:5, r:3, w:4, h:4, src: images[3] },
                  { c:3, r:3, w:2, h:2, src: images[0] },
                  { c:9, r:3, w:2, h:2, src: images[4] },
                  { c:3, r:5, w:2, h:2, src: images[2] },
                  { c:9, r:5, w:2, h:2, src: images[5] },
                ]
                // Occupancy map
                const occupied = new Set<string>()
                preset.forEach(t=>{
                  for(let x=t.c; x<t.c+t.w; x++){
                    for(let y=t.r; y<t.r+t.h; y++){
                      occupied.add(`${x},${y}`)
                    }
                  }
                })
                const tiles = [...preset]
                // Fill the rest with 1x1 squares
                for(let y=1; y<=rows; y++){
                  for(let x=1; x<=cols; x++){
                    if(!occupied.has(`${x},${y}`)){
                      tiles.push({ c:x, r:y, w:1, h:1, src: images[(x+y)%images.length] })
                    }
                  }
                }
                return (
                  <div key={seg} className="flex-none py-10" style={{ width: 'calc((75svh / 8) * 14)' }}>
                    <div
                      className="relative grid gap-2"
                      style={{ ['--cell' as any]: 'calc(75svh / 8)', gridTemplateColumns: 'repeat(14, var(--cell))', gridAutoRows: 'var(--cell)', height: '75svh' }}
                    >
                      {tiles.map((t,i)=> (
                        <div key={`tile-${seg}-${i}`} className="relative rounded-xl overflow-hidden" style={{ gridColumn: `${t.c} / span ${t.w}`, gridRow: `${t.r} / span ${t.h}` }}>
                          <Image src={t.src} alt="post" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

       {/* How It Works — Card Strip layout */}
       <section id="how-it-works" className="relative py-24 px-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <h3 className="text-sm text-primary/80">How it works</h3>
            <h2 className="text-3xl md:text-4xl font-semibold">Unleash AI across your workflow</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Mayvn automates every phase of your campaign lifecycle, continuously learning from performance to make your next campaign even better.
            </p>
          </div>

          {/* Mobile/Tablet: stacked */}
          <div className="relative grid grid-cols-1 gap-6 md:hidden">
            <HowCard step={1} title="Create Campaign" desc="Define goals, audience, tone and platforms in minutes."/>
            <HowCard step={2} title="Generate AI Content" desc="Auto‑create posts, captions, visuals and hashtags — all brand‑aligned."/>
            <HowCard step={3} title="Refine" desc="Tweak tone, brand consistency and compliance before publishing." highlight/>
            <HowCard step={4} title="Schedule & Engage" desc="Publish at the best time and keep conversations going with smart replies."/>
            <HowCard step={5} title="Analyze & Optimize" desc="Measure results and let AI improve the next campaign automatically."/>
          </div>

          {/* Large screens (lg): 3 on top, 2 below */}
          <div className="hidden lg:block xl:hidden">
            <div className="grid grid-cols-3 gap-8 items-end">
              <HowCard step={1} title="Create Campaign" desc="Define goals, audience, tone and platforms in minutes." className="mt-12"/>
              <HowCard step={2} title="Generate AI Content" desc="Auto‑create posts, captions, visuals and hashtags — all brand‑aligned." className="mt-4"/>
              <HowCard step={3} title="Refine" desc="Tweak tone, brand consistency and compliance before publishing." className="mt-0 shadow-xl" highlight/>
            </div>
            <div className="grid grid-cols-2 gap-8 items-end mt-8 max-w-4xl mx-auto">
              <HowCard step={4} title="Schedule & Engage" desc="Publish at the best time and keep conversations going with smart replies." className="mt-8"/>
              <HowCard step={5} title="Analyze & Optimize" desc="Measure results and let AI improve the next campaign automatically." className="mt-8"/>
            </div>
          </div>

          {/* XL and above: five across */}
          <div className="relative hidden xl:grid grid-cols-5 gap-6 xl:gap-8 items-end">
            <HowCard step={1} title="Create Campaign" desc="Define goals, audience, tone and platforms in minutes." className="-rotate-6 mt-16"/>
            <HowCard step={2} title="Generate AI Content" desc="Auto‑create posts, captions, visuals and hashtags — all brand‑aligned." className="-rotate-3 mt-8"/>
            <HowCard step={3} title="Refine" desc="Tweak tone, brand consistency and compliance before publishing." className="scale-[1.02] shadow-xl mt-0" highlight/>
            <HowCard step={4} title="Schedule & Engage" desc="Publish at the best time and keep conversations going with smart replies." className="rotate-3 mt-8"/>
            <HowCard step={5} title="Analyze & Optimize" desc="Measure results and let AI improve the next campaign automatically." className="rotate-6 mt-16"/>
          </div>
        </div>
      </section>

      {/* CTA Footer — Start Automating Today */}
      <section className="pb-24 sm:pt-24 px-4 sm:px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -inset-x-40 top-1/2 -translate-y-1/2 h-[420px] rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-8 border border-border/60 rounded-2xl bg-card/60 backdrop-blur p-12">
          <div className="absolute left-0 right-0 top-0 h-[2px] shimmer-line rounded-t-2xl" />
          <h2 className="text-4xl sm:text-5xl font-bold">Start Automating Today.</h2>
          <p className="text-lg text-muted-foreground">Ready to launch your first AI campaign?</p>
          <p className="text-muted-foreground">Create, publish, and optimize in minutes - powered by Mayvn.</p>
          <Link href="/onboarding">
            <Button size="lg" className="relative text-lg px-10 mb-2 bg-accent hover:bg-accent/90 shadow-[0_0_40px_rgba(4,114,134,0.45)]">
              Launch Beta
            </Button>
          </Link>
          <div className="text-xs text-muted-foreground">Free for early users. No credit card needed.</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo-full.png" alt="Mayvn" width={120} height={40} />
              </div>
              <p className="text-sm text-muted-foreground">AI-powered marketing automation for the modern creator</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2025 Mayvn. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-primary transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                LinkedIn
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureStrip() {
  const items = [
    {
      title: "Learn your brand’s tone",
      desc: "Adaptive models align to your voice across every post.",
    },
    {
      title: "Create authentic Gen‑Z content",
      desc: "Trends-aware drafts with on-brand visuals and slang moderation.",
    },
    {
      title: "Engage audiences automatically",
      desc: "Smart replies and comment routing keep conversations alive.",
    },
    {
      title: "Optimize through real data",
      desc: "Continuous experiments that improve each campaign’s results.",
    },
  ]

  const trackRef = React.useRef<HTMLDivElement | null>(null)
  useCoverflow(trackRef)

  React.useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const cards = el.querySelectorAll<HTMLElement>('.cover-card')
    const start = cards[1] || cards[0]
    if (!start) return
    const target = start.offsetLeft - (el.clientWidth - start.offsetWidth) / 2
    el.scrollLeft = target
  }, [])

  const getCenteredIndex = () => {
    const el = trackRef.current
    if (!el) return 0
    const cards = Array.from(el.querySelectorAll<HTMLElement>(`.cover-card`))
    if (cards.length === 0) return 0
    const centers = cards.map(c => c.offsetLeft + c.offsetWidth / 2)
    const viewportCenter = el.scrollLeft + el.clientWidth / 2
    let currentIndex = 0
    let minDelta = Infinity
    centers.forEach((c, i) => {
      const d = Math.abs(c - viewportCenter)
      if (d < minDelta) { minDelta = d; currentIndex = i }
    })
    return currentIndex
  }

  const centerToIndex = (index: number) => {
    const el = trackRef.current
    if (!el) return
    const cards = Array.from(el.querySelectorAll<HTMLElement>(`.cover-card`))
    if (cards.length === 0) return
    const clamped = Math.max(0, Math.min(cards.length - 1, index))
    const card = cards[clamped]
    const target = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
    el.scrollTo({ left: target, behavior: 'smooth' })
  }

  const scrollStep = (dir: 1 | -1) => {
    const current = getCenteredIndex()
    const cards = Array.from(trackRef.current?.querySelectorAll<HTMLElement>(`.cover-card`) || [])
    const next = Math.max(0, Math.min(cards.length - 1, current + dir))
    centerToIndex(next)
  }

  // Auto-advance every 5s with wrap to first
  React.useEffect(() => {
    const tick = () => {
      const cards = Array.from(trackRef.current?.querySelectorAll<HTMLElement>(`.cover-card`) || [])
      if (cards.length === 0) return
      const current = getCenteredIndex()
      const next = (current + 1) % cards.length
      centerToIndex(next)
    }
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative ">
      <button
        aria-label="Previous"
        onClick={() => scrollStep(-1)}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/80 border border-border/60 backdrop-blur hover:bg-background"
      >
        <ArrowLeft className="h-5 w-5 mx-auto" />
      </button>
      <button
        aria-label="Next"
        onClick={() => scrollStep(1)}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/80 border border-border/60 backdrop-blur hover:bg-background"
      >
        <ArrowRight className="h-5 w-5 mx-auto" />
      </button>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10"/>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10"/>
      <div
        ref={trackRef}
        className="group relative flex gap-10 overflow-x-auto no-scrollbar p-12 items-stretch scroll-smooth"
        style={{ perspective: 1400 }}
      >
        {/* left spacer to allow centering first card */}
        <div className="flex-none" style={{ width: '50vw' }} />
        {items.map((it, i) => (
          <CoverCard key={i} title={it.title} desc={it.desc} />
        ))}
        {/* right spacer to allow centering last card */}
        <div className="flex-none" style={{ width: '50vw' }} />
      </div>
    </div>
  )
}

function CoverCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className="cover-card select-none min-w-[280px] md:min-w-[420px] lg:min-w-[500px] min-h-[220px] md:min-h-[320px] lg:min-h-[380px] will-change-transform rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_70px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out p-6 md:p-8"
      style={{ transform: "translateZ(0)" }}
    >
      <div className="h-32 md:h-48 w-full rounded-lg bg-muted/10 border border-border/30 mb-4 md:mb-6" />
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

function StepCard({ index, title, desc }: { index: number; title: string; desc: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="reveal-on-scroll relative bg-card/70 border border-border/60 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 -top-8 w-2 h-2 rounded-full bg-accent shadow-[0_0_0_4px_rgba(4,114,134,0.15)]"/>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-semibold">
          {index}
        </div>
        <div>
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  )
}

function VerticalStep({ index, title, desc, delay = 0 }: { index: number; title: string; desc: string; delay?: number }) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          el.classList.add('is-visible')
        }
      })
    }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="reveal-on-scroll relative pl-14">
      <div className="absolute left-2.5 top-3 h-3 w-3 rounded-full bg-accent shadow-[0_0_0_6px_rgba(4,114,134,0.15)]" />
      <div className="bg-card/70 border border-border/60 rounded-2xl p-5 md:p-6 backdrop-blur-sm" style={{ transitionDelay: `${delay}ms` }}>
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-semibold">
            {index}
          </div>
          <div>
            <h4 className="font-semibold mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HowCard({ step, title, desc, className = '', highlight = false }: { step: number; title: string; desc: string; className?: string; highlight?: boolean }) {
  return (
    <div
      className={`relative rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-accent text-background text-sm font-semibold flex items-center justify-center border border-accent/50 shadow-[0_0_0_4px_rgba(4,114,134,0.15)]">
        {String(step).padStart(2, '0')}
      </div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{desc}</p>
      <div className={`h-40 rounded-xl border ${highlight ? 'border-accent/50 bg-gradient-to-br from-primary/10 to-accent/10' : 'border-border/40 bg-muted/10'}`} />
      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-accent/80"/>
        <span>AI‑assisted • real‑time • brand‑aware</span>
      </div>
    </div>
  )
}

// removed auto-advance; arrow controls are used

function useCoverflow(containerRef: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const cards = Array.from(el.querySelectorAll<HTMLDivElement>(`.cover-card`))
    const update = () => {
      const mid = el.scrollLeft + el.clientWidth / 2
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect()
        const center = rect.left + rect.width / 2 + el.scrollLeft - el.getBoundingClientRect().left
        const dist = (center - mid) / el.clientWidth // -0.5..0.5
        const scale = 1 - Math.min(Math.abs(dist) * 0.4, 0.4)
        const rotY = -dist * 18
        const translateZ = (1 - Math.abs(dist)) * 60
        card.style.transform = `translateZ(${translateZ}px) rotateY(${rotY}deg) scale(${scale})`
        card.style.boxShadow = `0 20px 60px rgba(4,114,134,${0.15 * (1 - Math.abs(dist))})`
      })
    }
    update()
    const onScroll = () => requestAnimationFrame(update)
    el.addEventListener('scroll', onScroll, { passive: true })
    const onResize = () => update()
    window.addEventListener('resize', onResize)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [containerRef])
}
