"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowRight, ArrowLeft, Loader2, Globe, Palette, Type, Image as ImageIcon, Users, MessageSquare, Sparkles, Target, Building2, Pencil, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface BrandDNA {
  accent_color: string
  brand_name: string
  brand_values: string[]
  business_overview: string
  colors: string[]
  fonts: string[]
  images: string[]
  logo: {
    logo: string
    logo_small: string
  }
  main_font: string
  tagline: string
  target_audience: string[]
  tone_of_voice: string[]
}

export default function BrandDNAPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null)
  const [selectedMainFont, setSelectedMainFont] = useState<string>("")
  const [editingBrandValues, setEditingBrandValues] = useState(false)
  const [editingToneOfVoice, setEditingToneOfVoice] = useState(false)
  const [newBrandValue, setNewBrandValue] = useState("")
  const [newToneOfVoice, setNewToneOfVoice] = useState("")
  const [selectedLogo, setSelectedLogo] = useState<string>("")
  const [brandNameModalOpen, setBrandNameModalOpen] = useState(false)
  const [taglineModalOpen, setTaglineModalOpen] = useState(false)
  const [tempBrandName, setTempBrandName] = useState("")
  const [tempTagline, setTempTagline] = useState("")
  const [editingImages, setEditingImages] = useState(false)

  // Check for brand DNA in localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDNA = localStorage.getItem('brandDNA')
      if (storedDNA) {
        try {
          const data = JSON.parse(storedDNA)
          setBrandDNA(data)
          setSelectedMainFont(data.main_font || (data.fonts && data.fonts[0]) || "")
          setSelectedLogo(data.logo?.logo || "")
        } catch (err) {
          console.error('Failed to parse stored brand DNA:', err)
        }
      }
    }
  }, [])


  const handleScrape = async () => {
    if (!websiteUrl.trim()) {
      setError("Please enter a valid website URL")
      return
    }

    // Basic URL validation
    try {
      new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`)
    } catch {
      setError("Please enter a valid website URL")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const urlToSend = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
      const response = await fetch("http://localhost:5000/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToSend }),
      })

      if (!response.ok) {
        throw new Error("Failed to scrape brand DNA")
      }

      const data = await response.json()
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('brandDNA', JSON.stringify(data))
      }
      setBrandDNA(data)
      setSelectedMainFont(data.main_font || (data.fonts && data.fonts[0]) || "")
      setSelectedLogo(data.logo?.logo || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape brand DNA. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    // If user is logged in, go back to dashboard. Otherwise, go to home
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-full.png" alt="Mayvn" width={120} height={40} />
            </Link>
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)]">
          <div className="w-full max-w-6xl">
            {!brandDNA ? (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-8 md:p-12">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Pull Brand DNA</h2>
                    <p className="text-muted-foreground">
                      Enter your website URL to extract your brand identity
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="url" className="block text-sm font-medium mb-2">
                        Website URL
                      </label>
                      <Input
                        id="url"
                        type="text"
                        placeholder="https://example.com or example.com"
                        value={websiteUrl}
                        onChange={(e) => {
                          setWebsiteUrl(e.target.value)
                          setError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !loading) {
                            handleScrape()
                          }
                        }}
                        className="text-lg py-6"
                        disabled={loading}
                      />
                      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                    </div>

                    <Button
                      onClick={handleScrape}
                      disabled={loading || !websiteUrl.trim()}
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Extract Brand DNA
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-8 md:p-12">
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold mb-2">Your Brand DNA</h2>
                  <p className="text-muted-foreground">Here's what we discovered about your brand</p>
                </div>
                <div className="space-y-6">
                  {/* Logo | Brand Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border/50">
                    {/* Logo */}
                    <Card className="border-border/50 bg-card/60 p-6">
                      <label className="text-sm font-medium text-muted-foreground mb-3 block">Logo</label>
                      {selectedLogo && (
                        <div className="flex justify-center mb-3">
                          <Image
                            src={selectedLogo}
                            alt={brandDNA.brand_name}
                            width={150}
                            height={60}
                            className="h-auto max-h-20 w-auto"
                          />
                        </div>
                      )}
                      <Select
                        value={selectedLogo}
                        onValueChange={(value) => {
                          setSelectedLogo(value)
                          setBrandDNA({
                            ...brandDNA,
                            logo: { ...brandDNA.logo, logo: value },
                          })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select logo" />
                        </SelectTrigger>
                        <SelectContent>
                          {brandDNA.logo?.logo && brandDNA.logo.logo !== selectedLogo && (
                            <SelectItem value={brandDNA.logo.logo}>
                              <div className="flex items-center gap-2">
                                <Image
                                  src={brandDNA.logo.logo}
                                  alt="Main logo"
                                  width={40}
                                  height={16}
                                  className="h-4 w-auto"
                                />
                                <span>Main Logo</span>
                              </div>
                            </SelectItem>
                          )}
                          {brandDNA.logo?.logo_small && brandDNA.logo.logo_small !== selectedLogo && (
                            <SelectItem value={brandDNA.logo.logo_small}>
                              <div className="flex items-center gap-2">
                                <Image
                                  src={brandDNA.logo.logo_small}
                                  alt="Small logo"
                                  width={40}
                                  height={16}
                                  className="h-4 w-auto"
                                />
                                <span>Small Logo</span>
                              </div>
                            </SelectItem>
                          )}
                          {selectedLogo && (
                            <SelectItem value={selectedLogo}>
                              <div className="flex items-center gap-2">
                                <Image
                                  src={selectedLogo}
                                  alt="Selected logo"
                                  width={40}
                                  height={16}
                                  className="h-4 w-auto"
                                />
                                <span>Current Selection</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </Card>

                    {/* Brand Name */}
                    <Card className="border-border/50 bg-card/60 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-muted-foreground">Brand Name</label>
                        <Dialog open={brandNameModalOpen} onOpenChange={setBrandNameModalOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTempBrandName(brandDNA.brand_name)
                                setBrandNameModalOpen(true)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Brand Name</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Brand Name</label>
                                <Input
                                  type="text"
                                  value={tempBrandName}
                                  onChange={(e) => setTempBrandName(e.target.value)}
                                  className="text-2xl font-bold"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      setBrandDNA({ ...brandDNA, brand_name: tempBrandName })
                                      setBrandNameModalOpen(false)
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setBrandNameModalOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => {
                                    setBrandDNA({ ...brandDNA, brand_name: tempBrandName })
                                    setBrandNameModalOpen(false)
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="text-5xl md:text-6xl font-bold min-h-[80px] flex items-center">
                        {brandDNA.brand_name || <span className="text-muted-foreground">No brand name</span>}
                      </div>
                    </Card>
                  </div>

                  {/* Tagline */}
                  <Card className="border-border/50 bg-card/60 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-muted-foreground">Tagline</label>
                      <Dialog open={taglineModalOpen} onOpenChange={setTaglineModalOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTempTagline(brandDNA.tagline || "")
                              setTaglineModalOpen(true)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Tagline</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Tagline</label>
                              <Textarea
                                value={tempTagline}
                                onChange={(e) => setTempTagline(e.target.value)}
                                placeholder="Enter tagline"
                                className="text-xl italic font-serif min-h-[100px] resize-none"
                                style={{ fontFamily: "cursive, serif" }}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setTaglineModalOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  setBrandDNA({ ...brandDNA, tagline: tempTagline })
                                  setTaglineModalOpen(false)
                                }}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div
                      className="text-2xl md:text-3xl italic font-serif min-h-[60px] flex items-center"
                      style={{ fontFamily: "cursive, serif" }}
                    >
                      {brandDNA.tagline || <span className="text-muted-foreground">No tagline</span>}
                    </div>
                  </Card>

                  {/* Business Overview */}
                  <Card className="border-border/50 bg-card/60 p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <Building2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <label className="text-sm font-medium text-muted-foreground">Business Overview</label>
                    </div>
                    <Textarea
                      value={brandDNA.business_overview || ""}
                      onChange={(e) => setBrandDNA({ ...brandDNA, business_overview: e.target.value })}
                      placeholder="Enter business overview"
                      className="min-h-[120px] leading-relaxed"
                    />
                  </Card>

                  {/* Colour Palette | Brand Values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Colour Palette */}
                    <Card className="border-border/50 bg-card/60 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Palette className="w-5 h-5 text-primary flex-shrink-0" />
                          <label className="text-sm font-medium text-muted-foreground">Colour Palette</label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newColors = [...(brandDNA.colors || []), "#000000"]
                            setBrandDNA({ ...brandDNA, colors: newColors })
                          }}
                          className="h-8 px-3"
                        >
                          Add Color
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          {brandDNA.colors?.map((color, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                              <div className="relative">
                                <div
                                  className="w-16 h-16 rounded-lg border-2 border-border/50 shadow-sm cursor-pointer"
                                  style={{ backgroundColor: color }}
                                />
                                <button
                                  onClick={() => {
                                    const newColors = brandDNA.colors?.filter((_, i) => i !== index) || []
                                    setBrandDNA({ ...brandDNA, colors: newColors })
                                  }}
                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <input
                                type="color"
                                value={color}
                                onChange={(e) => {
                                  const newColors = [...(brandDNA.colors || [])]
                                  newColors[index] = e.target.value
                                  setBrandDNA({ ...brandDNA, colors: newColors })
                                }}
                                className="w-16 h-8 rounded border border-border/50 cursor-pointer"
                              />
                            </div>
                          ))}
                          {brandDNA.accent_color && (
                            <div className="flex flex-col items-center gap-2">
                              <div className="relative">
                                <div
                                  className="w-16 h-16 rounded-lg border-2 border-border/50 shadow-sm cursor-pointer"
                                  style={{ backgroundColor: brandDNA.accent_color }}
                                />
                                <button
                                  onClick={() => setBrandDNA({ ...brandDNA, accent_color: "" })}
                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="space-y-1">
                                <input
                                  type="color"
                                  value={brandDNA.accent_color}
                                  onChange={(e) => setBrandDNA({ ...brandDNA, accent_color: e.target.value })}
                                  className="w-16 h-8 rounded border border-border/50 cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground text-center">Accent</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {!brandDNA.accent_color && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBrandDNA({ ...brandDNA, accent_color: "#000000" })}
                            className="w-full"
                          >
                            Add Accent Color
                          </Button>
                        )}
                      </div>
                    </Card>

                    {/* Brand Values */}
                    <Card className="border-border/50 bg-card/60 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                          <label className="text-sm font-medium text-muted-foreground">Brand Values</label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingBrandValues(!editingBrandValues)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {brandDNA.brand_values?.map((value, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 text-sm font-medium"
                            >
                              <span>{value}</span>
                              {editingBrandValues && (
                                <button
                                  onClick={() => {
                                    const newValues = brandDNA.brand_values?.filter((_, i) => i !== index) || []
                                    setBrandDNA({ ...brandDNA, brand_values: newValues })
                                  }}
                                  className="ml-1 hover:bg-green-500/20 rounded-md p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {editingBrandValues && (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Add new value"
                              value={newBrandValue}
                              onChange={(e) => setNewBrandValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newBrandValue.trim()) {
                                  setBrandDNA({
                                    ...brandDNA,
                                    brand_values: [...(brandDNA.brand_values || []), newBrandValue.trim()],
                                  })
                                  setNewBrandValue("")
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (newBrandValue.trim()) {
                                  setBrandDNA({
                                    ...brandDNA,
                                    brand_values: [...(brandDNA.brand_values || []), newBrandValue.trim()],
                                  })
                                  setNewBrandValue("")
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Tone of Voice | Fonts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tone of Voice */}
                    <Card className="border-border/50 bg-card/60 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
                          <label className="text-sm font-medium text-muted-foreground">Tone of Voice</label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingToneOfVoice(!editingToneOfVoice)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {brandDNA.tone_of_voice?.map((tone, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 text-sm font-medium"
                            >
                              <span>{tone}</span>
                              {editingToneOfVoice && (
                                <button
                                  onClick={() => {
                                    const newTones = brandDNA.tone_of_voice?.filter((_, i) => i !== index) || []
                                    setBrandDNA({ ...brandDNA, tone_of_voice: newTones })
                                  }}
                                  className="ml-1 hover:bg-green-500/20 rounded-md p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {editingToneOfVoice && (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Add new tone"
                              value={newToneOfVoice}
                              onChange={(e) => setNewToneOfVoice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newToneOfVoice.trim()) {
                                  setBrandDNA({
                                    ...brandDNA,
                                    tone_of_voice: [...(brandDNA.tone_of_voice || []), newToneOfVoice.trim()],
                                  })
                                  setNewToneOfVoice("")
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (newToneOfVoice.trim()) {
                                  setBrandDNA({
                                    ...brandDNA,
                                    tone_of_voice: [...(brandDNA.tone_of_voice || []), newToneOfVoice.trim()],
                                  })
                                  setNewToneOfVoice("")
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Fonts */}
                    <Card className="border-border/50 bg-card/60 p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <Type className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <label className="text-sm font-medium text-muted-foreground">Fonts</label>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground mb-2 block">Main Font</label>
                          <div
                            className="text-2xl font-medium mb-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                            style={{ fontFamily: selectedMainFont }}
                          >
                            {selectedMainFont}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-2 block">Change Main Font</label>
                          <Select value={selectedMainFont} onValueChange={setSelectedMainFont}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent>
                              {brandDNA.fonts?.map((font, index) => (
                                <SelectItem key={index} value={font}>
                                  <span style={{ fontFamily: font }}>{font}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Brand Images */}
                  <Card className="border-border/50 bg-card/60 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-primary flex-shrink-0" />
                        <label className="text-sm font-medium text-muted-foreground">Brand Images</label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingImages(!editingImages)}
                        className="h-8 px-3"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {editingImages ? "Done" : "Edit"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                      {brandDNA.images?.map((imageUrl, index) => (
                        <div key={index} className="space-y-2">
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group">
                            <Image
                              src={imageUrl}
                              alt={`Brand image ${index + 1}`}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            />
                            {editingImages && (
                              <button
                                onClick={() => {
                                  const newImages = brandDNA.images?.filter((_, i) => i !== index) || []
                                  setBrandDNA({ ...brandDNA, images: newImages })
                                }}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors z-10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {editingImages && (
                            <Input
                              type="url"
                              value={imageUrl}
                              onChange={(e) => {
                                const newImages = [...(brandDNA.images || [])]
                                newImages[index] = e.target.value
                                setBrandDNA({ ...brandDNA, images: newImages })
                              }}
                              className="text-xs"
                              placeholder="Image URL"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    {editingImages && (
                      <div className="mt-4">
                        <label className="text-sm font-medium mb-2 block">Upload New Image</label>
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            placeholder="Enter image URL"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                setBrandDNA({
                                  ...brandDNA,
                                  images: [...(brandDNA.images || []), e.currentTarget.value.trim()],
                                })
                                e.currentTarget.value = ""
                              }
                            }}
                            className="flex-1"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  const base64String = reader.result as string
                                  setBrandDNA({
                                    ...brandDNA,
                                    images: [...(brandDNA.images || []), base64String],
                                  })
                                }
                                reader.readAsDataURL(file)
                              }
                              e.target.value = ""
                            }}
                            className="hidden"
                            id="image-upload"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("image-upload")?.click()}
                          >
                            Upload File
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
                    <Button
                      onClick={() => {
                        setBrandDNA(null)
                        setWebsiteUrl("")
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('brandDNA')
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Analyze Another Website
                    </Button>
                    <Button
                      onClick={() => {
                        // If user is logged in, go to onboarding. Otherwise, go to register
                        if (user) {
                          router.push("/onboarding")
                        } else {
                          router.push("/register")
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      Confirm Brand DNA
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

