"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft, Check, Target, Users, Zap, Calendar } from "lucide-react"

export default function CreateCampaignPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    objective: "",
    targetAudience: [] as string[],
    platforms: [] as string[],
    budget: "",
    duration: "",
    startDate: "",
  })
  const [schedMonth, setSchedMonth] = useState(new Date())
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)

  const steps = [
    { title: "Campaign Basics", icon: Zap },
    { title: "Target Audience", icon: Users },
    { title: "Platforms", icon: Target },
    { title: "Budget & Timeline", icon: Calendar },
    { title: "Schedule", icon: Calendar },
    { title: "Review", icon: Check },
  ]

  const objectives = [
    { id: "awareness", label: "Brand Awareness" },
    { id: "engagement", label: "Engagement" },
    { id: "conversion", label: "Conversions" },
    { id: "traffic", label: "Website Traffic" },
    { id: "leads", label: "Lead Generation" },
    { id: "sales", label: "Sales" },
  ]

  const audiences = [
    { id: "age-18-24", label: "18-24 years old" },
    { id: "age-25-34", label: "25-34 years old" },
    { id: "age-35-44", label: "35-44 years old" },
    { id: "age-45-54", label: "45-54 years old" },
    { id: "age-55+", label: "55+ years old" },
    { id: "students", label: "Students" },
    { id: "professionals", label: "Professionals" },
    { id: "entrepreneurs", label: "Entrepreneurs" },
  ]

  const platforms = [
    { id: "instagram", name: "Instagram", icon: "📷" },
    { id: "tiktok", name: "TikTok", icon: "🎵" },
    { id: "twitter", name: "Twitter/X", icon: "𝕏" },
    { id: "linkedin", name: "LinkedIn", icon: "💼" },
    { id: "facebook", name: "Facebook", icon: "f" },
    { id: "youtube", name: "YouTube", icon: "▶️" },
  ]

  const handleNext = () => setCurrentStep((s)=> Math.min(steps.length-1, s+1))
  const handlePrev = () => setCurrentStep((s)=> Math.max(0, s-1))

  const toggleAudience = (id: string) => setFormData((prev)=> ({...prev, targetAudience: prev.targetAudience.includes(id) ? prev.targetAudience.filter(a=>a!==id) : [...prev.targetAudience, id]}))
  const togglePlatform = (id: string) => setFormData((prev)=> ({...prev, platforms: prev.platforms.includes(id) ? prev.platforms.filter(p=>p!==id) : [...prev.platforms, id]}))

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return formData.name && formData.description && formData.objective
      case 1: return formData.targetAudience.length>0
      case 2: return formData.platforms.length>0
      case 3: return formData.budget && formData.duration && formData.startDate
      case 4: return true
      default: return true
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${i<=currentStep ? 'bg-gradient-to-br from-primary to-accent border-primary text-primary-foreground':'border-border bg-card text-muted-foreground'}`}>
                  {i<currentStep ? <Check className="w-5 h-5"/> : <Icon className="w-5 h-5"/>}
                </div>
                {i<steps.length-1 && (<div className={`flex-1 h-1 mx-2 rounded-full ${i<currentStep ? 'bg-gradient-to-r from-primary to-accent':'bg-border'}`}></div>)}
              </div>
            )
          })}
        </div>
        <div className="text-sm text-muted-foreground">Step {currentStep+1} of {steps.length}</div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm p-8 mb-8">
        {currentStep===0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{steps[0].title}</h2>
              <p className="text-muted-foreground">Let's start with the basics of your campaign</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <Input value={formData.name} onChange={(e)=>setFormData({...formData, name:e.target.value})} placeholder="e.g., Summer Sale 2025" className="bg-input border-border/50"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={formData.description} onChange={(e)=>setFormData({...formData, description:e.target.value})} rows={4} className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Campaign Objective</label>
                <div className="grid grid-cols-2 gap-3">
                  {objectives.map((obj)=> (
                    <button key={obj.id} onClick={()=>setFormData({...formData, objective: obj.id})} className={`p-3 rounded-lg border-2 text-left ${formData.objective===obj.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-card/50 hover:border-primary/50'}`}>
                      <span className="font-medium text-sm">{obj.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep===1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{steps[1].title}</h2>
              <p className="text-muted-foreground">Who do you want to reach with this campaign?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {audiences.map((a)=> (
                <button key={a.id} onClick={()=>toggleAudience(a.id)} className={`p-4 rounded-lg border-2 flex items-center gap-3 ${formData.targetAudience.includes(a.id)? 'border-secondary bg-secondary/10':'border-border/50 bg-card/50 hover:border-secondary/50'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${formData.targetAudience.includes(a.id)? 'border-secondary bg-secondary':'border-border'}`}>{formData.targetAudience.includes(a.id) && (<Check className="w-3 h-3 text-secondary-foreground"/>)}</div>
                  <span className="font-medium text-sm">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep===2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{steps[2].title}</h2>
              <p className="text-muted-foreground">Which platforms do you want to use?</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((p)=> (
                <button key={p.id} onClick={()=>togglePlatform(p.id)} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${formData.platforms.includes(p.id)? 'border-accent bg-accent/10':'border-border/50 bg-card/50 hover:border-accent/50'}`}>
                  <span className="text-3xl">{p.icon}</span>
                  <span className="font-medium text-sm">{p.name}</span>
                  {formData.platforms.includes(p.id) && <Check className="w-4 h-4 text-accent absolute"/>}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep===3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{steps[3].title}</h2>
              <p className="text-muted-foreground">Set your budget and campaign timeline</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Budget</label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input type="number" value={formData.budget} onChange={(e)=>setFormData({...formData, budget:e.target.value})} className="bg-input border-border/50"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Duration</label>
                <select value={formData.duration} onChange={(e)=>setFormData({...formData, duration:e.target.value})} className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select duration</option>
                  <option value="1-week">1 Week</option>
                  <option value="2-weeks">2 Weeks</option>
                  <option value="1-month">1 Month</option>
                  <option value="3-months">3 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input type="date" value={formData.startDate} onChange={(e)=>setFormData({...formData, startDate:e.target.value})} className="bg-input border-border/50"/>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Schedule (range selection) */}
        {currentStep===4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{steps[4].title}</h2>
              <p className="text-muted-foreground">Allocate start and end dates for this campaign</p>
            </div>
            <ScheduleRange
              month={schedMonth}
              onPrev={()=> setSchedMonth(new Date(schedMonth.getFullYear(), schedMonth.getMonth()-1))}
              onNext={()=> setSchedMonth(new Date(schedMonth.getFullYear(), schedMonth.getMonth()+1))}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onDayClick={(d)=> {
                const clicked = new Date(schedMonth.getFullYear(), schedMonth.getMonth(), d)
                if (!rangeStart || (rangeStart && rangeEnd)) { setRangeStart(clicked); setRangeEnd(null) }
                else if (rangeStart && !rangeEnd) { if (clicked < rangeStart) { setRangeEnd(rangeStart); setRangeStart(clicked) } else { setRangeEnd(clicked) } }
              }}
            />
            <p className="text-xs text-muted-foreground">Tip: You can adjust detailed slots in the Schedule tab later.</p>
          </div>
        )}

        {currentStep===5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{steps[5].title}</h2>
              <p className="text-muted-foreground">Review your campaign details before creating</p>
            </div>
            <div className="space-y-4">
              <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Campaign Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="font-medium">{formData.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Objective:</span><span className="font-medium capitalize">{formData.objective}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Budget:</span><span className="font-medium">${formData.budget}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration:</span><span className="font-medium capitalize">{formData.duration}</span></div>
                </div>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.platforms.map(pid => {
                    const p = platforms.find(pp=>pp.id===pid)
                    return <span key={pid} className="px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 text-sm">{p?.name}</span>
                  })}
                </div>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Target Audience</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.targetAudience.map(aid => {
                    const a = audiences.find(aa=>aa.id===aid)
                    return <span key={aid} className="px-3 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/30 text-sm">{a?.label}</span>
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep===0} className="flex-1 border-border/50 bg-transparent"><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
        <Button onClick={handleNext} disabled={!isStepValid()} className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90">{currentStep===steps.length-1 ? (<>Create Campaign<Check className="w-4 h-4 ml-2"/></>) : (<>Next<ArrowRight className="w-4 h-4 ml-2"/></>)}</Button>
      </div>
    </div>
  )
}

function ScheduleRange({ month, onPrev, onNext, rangeStart, rangeEnd, onDayClick }: { month: Date; onPrev: ()=>void; onNext: ()=>void; rangeStart: Date | null; rangeEnd: Date | null; onDayClick: (day: number)=>void }) {
  const monthName = month.toLocaleString("default", { month: "long", year: "numeric" })
  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate()
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const isWithinRange = (day: number) => {
    if (!rangeStart || !rangeEnd) return false
    const d = new Date(month.getFullYear(), month.getMonth(), day)
    const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate())
    const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate())
    return d >= start && d <= end
  }
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{monthName}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onPrev} className="border-border/50 bg-transparent">‹</Button>
          <Button size="sm" variant="outline" onClick={onNext} className="border-border/50 bg-transparent">›</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d)=> (<div key={d} className="text-center text-sm font-semibold text-muted-foreground py-2">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} className="aspect-square"/>))}
        {days.map((day)=> (
          <button key={day} onClick={()=> onDayClick(day)} className={`aspect-square p-2 rounded-lg border-2 transition-all text-left ${isWithinRange(day) ? 'border-primary bg-primary/10' : 'border-border/50 bg-card/50 hover:border-primary/50'}`}>
            <span className="text-xs font-semibold">{day}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        {rangeStart ? `Start: ${rangeStart.toLocaleDateString()}` : 'Select start date'}
        {rangeEnd ? ` • End: ${rangeEnd.toLocaleDateString()}` : ''}
      </div>
    </Card>
  )
}



