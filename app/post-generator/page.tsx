"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBrand } from "@/contexts/BrandContext"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Edit, Image as ImageIcon, Calendar, Plus, X, Send, Bot, User as UserIcon, ArrowLeft, ArrowRight, Instagram, Square, Maximize2, MessageSquare, Palette, Type, MousePointerClick, ChevronDown, ChevronUp, Download, Eye, EyeOff, ArrowRightCircle, ZoomIn, ZoomOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import type { Frame, FrameType, FrameStyles } from "@/components/post-generator/types"
import { getBrandPosts, saveBrandPost, type BrandPost } from "@/lib/userService"
import HeaderSection from "@/components/post-generator/sidebar/HeaderSection"
import SubtextSection from "@/components/post-generator/sidebar/SubtextSection"
import { storage } from "@/lib/firebase"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

type Post = {
  id: string
  title: string
  image?: string
  caption: string
  status: "draft" | "scheduled" | "published"
  createdAt: Date
  scheduledFor?: Date
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type StoredFrame = {
  id: string
  typeId: string
  x: number
  y: number
  name?: string
  content?: {
    image?: string
    text?: string
  }
  styles?: FrameStyles
  connections?: {
    parentId?: string
    childIds?: string[]
  }
}

type SavedProject = {
  id: string
  title: string
  brandId?: string
  frames: StoredFrame[]
  createdAt: string
  updatedAt: string
}

const ConnectionSourceDot = ({
  frame,
  scale,
  frameTypes,
  onAddConnectedFrame
}: {
  frame: Frame
  scale: number
  frameTypes: FrameType[]
  onAddConnectedFrame: (frameId: string, frameType: FrameType) => void
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const headerHeight = 20
  const frameWidth = frame.type.width * scale
  const frameHeight = frame.type.height * scale
  const hasCaption = frame.styles?.captionVisible
  let captionHeight = 0
  if (hasCaption) {
    if (frame.type.id === "reddit-post") {
      captionHeight = 120 * scale
    } else {
      captionHeight = 80 * scale
    }
  }
  const totalHeight = headerHeight + frameHeight + (hasCaption ? captionHeight + 8 : 0)
  // Position on the right edge of the frame
  const dotX = frameWidth
  const dotY = totalHeight / 2

  return (
    <div
      className="absolute z-50 flex items-center justify-center"
      style={{
        left: `${dotX}px`,
        top: `${dotY}px`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full bg-[#026a79] hover:bg-[#026a79] text-white shadow-md hover:shadow-lg transition-all p-0"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Plus className={`w-3 h-3 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuLabel>Generate a post on</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            const redditPostType = frameTypes.find(ft => ft.id === "reddit-post")
            if (redditPostType) {
              onAddConnectedFrame(frame.id, redditPostType)
            }
          }}>
            Reddit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log("Generate for Meta")}>
            Meta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log("Generate for Linkedin")}>
            Linkedin
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log("Generate for Email")}>
            Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function PostGeneratorPage() {
  const { selectedBrand, loading: brandLoading } = useBrand()
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>("")
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([])
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")

  // Frame types
  const frameTypes: FrameType[] = [
    {
      id: "instagram-story",
      name: "Instagram Story",
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      icon: <Instagram className="w-4 h-4" />,
      platform: "Instagram"
    },
    {
      id: "instagram-post",
      name: "Instagram Post",
      width: 1080,
      height: 1080,
      aspectRatio: "1:1",
      icon: <Square className="w-4 h-4" />,
      platform: "Instagram"
    },
    {
      id: "instagram-reel",
      name: "Instagram Reel",
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      icon: <Maximize2 className="w-4 h-4" />,
      platform: "Instagram"
    },
    {
      id: "instagram-carousel",
      name: "Instagram Carousel",
      width: 1080,
      height: 1080,
      aspectRatio: "1:1",
      icon: <Square className="w-4 h-4" />,
      platform: "Instagram"
    },
    {
      id: "reddit-post",
      name: "Reddit Post",
      width: 1080,
      height: 1200,
      aspectRatio: "9:10",
      icon: <Square className="w-4 h-4" />,
      platform: "Reddit"
    },
  ]

  // View mode state
  const [viewMode, setViewMode] = useState<"spaces" | "layer">("spaces")
  const [layerSidebarTab, setLayerSidebarTab] = useState<"layers" | "properties">("layers")

  // Canvas state
  const [frames, setFrames] = useState<Frame[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [canvasZoom, setCanvasZoom] = useState(1)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Panning state (spacebar + drag)
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  // Drag state
  const [draggingFrameId, setDraggingFrameId] = useState<string | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [draggingGradientHandle, setDraggingGradientHandle] = useState<'start' | 'end' | null>(null)
  const gradientSliderRef = useRef<HTMLDivElement>(null)
  const [aiPromptInput, setAIPromptInput] = useState("")
  const [generatingAIPrompt, setGeneratingAIPrompt] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const frameRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const dragStartPositionRef = useRef({ x: 0, y: 0 })
  const dragFrameRef = useRef<HTMLDivElement | null>(null)
  const dragPositionRef = useRef({ x: 0, y: 0 })

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Frame editing state
  const [isTabsOpen, setIsTabsOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    background: true,
    header: true,
    subtext: true,
    cta: true,
    logo: true,
  })

  // Layer mode caption overlay state
  const [isLayerCaptionOpen, setIsLayerCaptionOpen] = useState(false)

  useEffect(() => {
    // Close caption overlay when switching frames or view modes
    setIsLayerCaptionOpen(false)
  }, [selectedFrameId, viewMode])

  // Load saved drafts/posts for current brand from Firestore
  useEffect(() => {
    async function fetchBrandPosts() {
      if (!user || !selectedBrand?.id) return
      try {
        const brandPosts = await getBrandPosts(user.uid, selectedBrand.id)

        // Map to Post list for main screen
        const mappedPosts: Post[] = brandPosts.map(p => ({
          id: p.id || "",
          title: p.title,
          image: p.image,
          caption: p.caption || "",
          status: p.status || "draft",
          createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date(),
          scheduledFor: p.updatedAt?.toDate ? p.updatedAt.toDate() : undefined,
        }))
        setPosts(mappedPosts)

        // Also store as savedProjects (with frames) for drafts UI
        const projects: SavedProject[] = brandPosts.map(p => {
          let frames: StoredFrame[] = []
          if (Array.isArray(p.frames)) {
            frames = p.frames as StoredFrame[]
          } else if (typeof (p as any).framesJson === "string") {
            try {
              frames = JSON.parse((p as any).framesJson) as StoredFrame[]
            } catch {
              frames = []
            }
          }

          return {
            id: p.id || "",
            title: p.title,
            brandId: selectedBrand.id,
            frames,
            createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate().toISOString() : new Date().toISOString(),
          }
        })
        setSavedProjects(projects)
      } catch (err) {
        console.error("Failed to load brand posts from Firestore", err)
      }
    }
    fetchBrandPosts()
  }, [user, selectedBrand?.id])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSaveProject = async () => {
    if (!frames.length || !selectedBrand) {
      alert("Add at least one frame and select a brand before saving.")
      return
    }
    try {
      setIsSavingProject(true)
      const serializableFrames: StoredFrame[] = frames.map((f) => {
        // Ensure content is plain JSON-safe
        const safeContent = f.content
          ? {
            image:
              typeof f.content.image === "string" &&
                !f.content.image.startsWith("data:image")
                ? f.content.image
                : undefined,
            text: typeof f.content.text === "string" ? f.content.text : undefined,
          }
          : undefined

        // Ensure styles only contain primitive values (string/number/boolean)
        const rawStyles = f.styles || {}
        const safeStyles: FrameStyles = {}
        Object.entries(rawStyles).forEach(([key, value]) => {
          const t = typeof value
          if (t === "string" || t === "number" || t === "boolean") {
            // Skip large data URLs; they should be stored in Storage instead
            if (
              t === "string" &&
              typeof value === "string" &&
              (key === "backgroundImage" || key === "logoImage") &&
              value.startsWith("data:image")
            ) {
              return
            }
            ; (safeStyles as any)[key] = value
          }
        })

        // Ensure connections only contain strings / string[]
        const safeConnections = f.connections
          ? {
            parentId:
              typeof f.connections.parentId === "string"
                ? f.connections.parentId
                : undefined,
            childIds: Array.isArray(f.connections.childIds)
              ? f.connections.childIds.filter(
                (id): id is string => typeof id === "string"
              )
              : undefined,
          }
          : undefined

        return {
          id: f.id,
          typeId: f.type.id,
          x: f.x,
          y: f.y,
          name: f.name,
          content: safeContent,
          styles: safeStyles,
          connections: safeConnections,
        }
      })

      const postData: Omit<BrandPost, "id" | "createdAt" | "updatedAt"> = {
        title: currentProjectTitle || (editingPost?.title || `${selectedBrand.brand_name} post`),
        caption: "",
        status: "draft",
        // Store frames as JSON string to avoid Firestore nested entity issues
        framesJson: JSON.stringify(serializableFrames),
      }

      // If we somehow don't have a currentProjectId (e.g. after reload or name reuse),
      // try to reuse an existing draft with the same title instead of creating a duplicate.
      const existingWithSameTitle = savedProjects.find(
        (p) => p.title === postData.title
      );
      const targetProjectId = currentProjectId || existingWithSameTitle?.id || null;

      // Save to Firestore under users/{uid}/brands/{brandId}/posts/{postId}
      const savedId = await saveBrandPost(
        user!.uid,
        selectedBrand.id!,
        targetProjectId,
        postData
      )

      // Refresh local posts/drafts list from Firestore
      const brandPosts = await getBrandPosts(user!.uid, selectedBrand.id!)
      const mappedPosts: Post[] = brandPosts.map(p => ({
        id: p.id || "",
        title: p.title,
        image: p.image,
        caption: p.caption || "",
        status: p.status || "draft",
        createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date(),
        scheduledFor: p.updatedAt?.toDate ? p.updatedAt.toDate() : undefined,
      }))
      setPosts(mappedPosts)

      const projects: SavedProject[] = brandPosts.map(p => {
        let frames: StoredFrame[] = []
        if (Array.isArray(p.frames)) {
          frames = p.frames as StoredFrame[]
        } else if (typeof (p as any).framesJson === "string") {
          try {
            frames = JSON.parse((p as any).framesJson) as StoredFrame[]
          } catch {
            frames = []
          }
        }

        return {
          id: p.id || "",
          title: p.title,
          brandId: selectedBrand.id!,
          frames,
          createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate().toISOString() : new Date().toISOString(),
        }
      })
      setSavedProjects(projects)
      setCurrentProjectId(savedId)
      setCurrentProjectTitle(postData.title)
      alert("Draft saved.")
    } catch (err) {
      console.error("Error saving project", err)
      alert("Error saving draft.")
    } finally {
      setIsSavingProject(false)
    }
  }

  // Right sidebar resize state
  const [rightSidebarWidth, setRightSidebarWidth] = useState(256) // 64 * 4 = 256px (w-64)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartXRef = useRef(0)
  const resizeStartWidthRef = useRef(256)

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    resizeStartXRef.current = e.clientX
    resizeStartWidthRef.current = rightSidebarWidth
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeStartXRef.current - e.clientX // Inverted because we're resizing from the left
      const newWidth = Math.max(256, Math.min(512, resizeStartWidthRef.current + deltaX)) // Min 256px, Max 512px
      setRightSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  const handleCreatePost = () => {
    setEditingPost(null)
    setFrames([])
    setSelectedFrameId(null)
    setChatMessages([])
    setCurrentProjectId(null)
    setCurrentProjectTitle("")
    setNewProjectName("")
    setIsNewProjectModalOpen(true)
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setFrames([])
    setSelectedFrameId(null)
    setChatMessages([])
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingPost(null)
    setFrames([])
    setSelectedFrameId(null)
    setChatMessages([])
    setCurrentProjectId(null)
    setCurrentProjectTitle("")
  }

  const handleAddFrame = (frameType: FrameType) => {
    const frameNumber = frames.filter(f => f.type.id === frameType.id).length + 1
    const frameName = frameType.id === "instagram-story"
      ? `story-${frameNumber}`
      : frameType.id === "instagram-post"
        ? `post-${frameNumber}`
        : frameType.id === "instagram-reel"
          ? `reel-${frameNumber}`
          : frameType.id === "instagram-carousel"
            ? `carousel-${frameNumber}`
            : frameType.id === "reddit-post"
              ? `reddit-post-${frameNumber}`
              : `frame-${frameNumber}`

    const newFrame: Frame = {
      id: `frame-${Date.now()}`,
      type: frameType,
      name: frameName,
      x: 100 + frames.length * 50,
      y: 100 + frames.length * 50,
      content: {},
      styles: {
        backgroundType: "solid",
        backgroundColor: "#ffffff",
        backgroundGradientStart: "#3b82f6",
        backgroundGradientEnd: "#8b5cf6",
        backgroundGradientStartStop: 0,
        backgroundGradientEndStop: 100,
        backgroundGradientType: "linear",
        backgroundGradientAngle: 0,
        headerAlignment: "center",
      }
    }
    setFrames([...frames, newFrame])
    setSelectedFrameId(newFrame.id)
  }

  const handleAddConnectedFrame = (sourceFrameId: string, targetFrameType: FrameType) => {
    const sourceFrame = frames.find(f => f.id === sourceFrameId)
    if (!sourceFrame) return

    const scale = 0.3 // Same scale used in canvas view
    const sourceFrameRef = frameRefs.current[sourceFrameId]

    // Calculate position to the right of source frame
    const sourceWidth = sourceFrame.type.width * scale
    const sourceHeight = sourceFrame.type.height * scale
    const spacing = 100 // Space between frames
    const newX = sourceFrame.x + sourceWidth + spacing
    const newY = sourceFrame.y // Align vertically

    const frameNumber = frames.filter(f => f.type.id === targetFrameType.id).length + 1
    const frameName = targetFrameType.id === "reddit-post"
      ? `reddit-post-${frameNumber}`
      : `${targetFrameType.id}-${frameNumber}`

    const newFrame: Frame = {
      id: `frame-${Date.now()}`,
      type: targetFrameType,
      name: frameName,
      x: newX,
      y: newY,
      content: {},
      styles: {
        backgroundType: "solid",
        backgroundColor: "#ffffff",
        backgroundGradientStart: "#3b82f6",
        backgroundGradientEnd: "#8b5cf6",
        backgroundGradientStartStop: 0,
        backgroundGradientEndStop: 100,
        backgroundGradientType: "linear",
        backgroundGradientAngle: 0,
        headerAlignment: "center",
        captionVisible: true,
        captionText: "This is a longer caption for the Reddit post. Reddit posts typically have more detailed captions that provide context, explanations, or additional information about the content. This allows users to better understand the post and engage with the community through discussions and comments.",
      },
      connections: {
        parentId: sourceFrameId,
      }
    }

    // Update source frame to include this as a child
    setFrames(prevFrames =>
      prevFrames.map(frame =>
        frame.id === sourceFrameId
          ? {
            ...frame,
            connections: {
              ...frame.connections,
              childIds: [...(frame.connections?.childIds || []), newFrame.id],
            }
          }
          : frame
      ).concat([newFrame])
    )

    setSelectedFrameId(newFrame.id)
  }

  const updateFrameStyleById = (frameId: string, styleKey: keyof NonNullable<Frame['styles']>, value: any) => {
    setFrames(prevFrames =>
      prevFrames.map(frame =>
        frame.id === frameId
          ? {
            ...frame,
            styles: {
              ...frame.styles,
              [styleKey]: value,
            }
          }
          : frame
      )
    )
  }

  const updateFrameStyle = (styleKey: keyof NonNullable<Frame['styles']>, value: any) => {
    if (!selectedFrameId) return
    updateFrameStyleById(selectedFrameId, styleKey, value)
  }

  const generateSimplePrompt = async (userPrompt: string) => {
    if (!userPrompt.trim()) return

    setGeneratingAIPrompt(true)
    try {
      // Simple prompt - just return a cleaned version of the user's prompt
      const simplePrompt = userPrompt.trim()
      updateFrameStyle('backgroundAIPrompt', simplePrompt)
      setAIPromptInput("")
    } catch (error) {
      console.error('Error generating simple prompt:', error)
      alert('Failed to generate simple prompt')
    } finally {
      setGeneratingAIPrompt(false)
    }
  }

  const generateMagicPrompt = async (userPrompt: string) => {
    if (!userPrompt.trim() || !selectedBrand) return

    setGeneratingAIPrompt(true)
    try {
      const response = await fetch('/api/ollama/generate-image-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: userPrompt,
          concept: userPrompt,
          brandData: selectedBrand,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate magic prompt')
      }

      const data = await response.json()
      if (data.imagePrompt) {
        updateFrameStyle('backgroundAIPrompt', data.imagePrompt)
        setAIPromptInput("")
      } else if (data.error) {
        throw new Error(data.details || data.error)
      } else {
        throw new Error('No prompt returned')
      }
    } catch (error: any) {
      console.error('Error generating magic prompt:', error)
      const errorMessage = error.message || 'Failed to generate magic prompt. Make sure OLLAMA is running.'
      alert(errorMessage)
    } finally {
      setGeneratingAIPrompt(false)
    }
  }

  const generateImage = async () => {
    const selectedFrame = frames.find(f => f.id === selectedFrameId)
    
    if (!selectedFrameId || !selectedFrame?.styles?.backgroundAIPrompt) {
      alert("Please generate a prompt first before generating an image.")
      return
    }

    setIsGeneratingImage(true)
    try {
      // Step 3.1: Call the API endpoint
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: selectedFrame.styles.backgroundAIPrompt,
          frameId: selectedFrameId,
          width: selectedFrame.type.width,
          height: selectedFrame.type.height,
        }),
      })

      // Step 3.3: Handle errors - read error body for details
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to generate image')
      }

      const data = await response.json()

      // Step 3.2: Update frame with image URL
      if (data.success && data.imageUrl) {
        // Update background type to 'image' if it's currently 'ai'
        if (selectedFrame.styles?.backgroundType === 'ai') {
          updateFrameStyle('backgroundType', 'image')
        }
        // Set the background image URL
        updateFrameStyle('backgroundImage', data.imageUrl)
      } else if (data.error) {
        throw new Error(data.details || data.error)
      } else {
        throw new Error('No image URL returned')
      }
    } catch (error: any) {
      console.error('Error generating image:', error)
      const errorMessage = error.message || 'Failed to generate image. Please try again.'
      alert(errorMessage)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const downloadFrame = async (frameId: string) => {
    const frame = frames.find(f => f.id === frameId)
    if (!frame) {
      console.error('Frame not found')
      return
    }

    try {
      // Dynamically import html2canvas
      // @ts-ignore - html2canvas types may not be available
      const html2canvas = (await import('html2canvas')).default

      // Create a temporary container off-screen with full-size frame
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'fixed'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      tempContainer.style.width = `${frame.type.width}px`
      tempContainer.style.height = `${frame.type.height}px`
      tempContainer.style.zIndex = '9999'
      tempContainer.style.backgroundColor = frame.styles?.backgroundType === 'solid'
        ? (frame.styles?.backgroundColor || '#ffffff')
        : (frame.styles?.backgroundType === 'gradient'
          ? 'transparent'
          : '#ffffff')
      document.body.appendChild(tempContainer)

      // Render the frame at full size
      const frameContent = document.createElement('div')
      frameContent.style.width = `${frame.type.width}px`
      frameContent.style.height = `${frame.type.height}px`
      frameContent.style.position = 'relative'
      frameContent.style.overflow = 'hidden'
      frameContent.style.borderRadius = '8px'

      // Apply background
      if (frame.styles?.backgroundType === 'solid') {
        frameContent.style.backgroundColor = frame.styles?.backgroundColor || '#ffffff'
      } else if (frame.styles?.backgroundType === 'gradient') {
        if (frame.styles?.backgroundGradientType === 'radial') {
          frameContent.style.background = `radial-gradient(circle, ${frame.styles?.backgroundGradientStart || "#3b82f6"} ${frame.styles?.backgroundGradientStartStop ?? 0}%, ${frame.styles?.backgroundGradientEnd || "#8b5cf6"} ${frame.styles?.backgroundGradientEndStop ?? 100}%)`
        } else {
          frameContent.style.background = `linear-gradient(${(frame.styles?.backgroundGradientAngle || 0) + 180}deg, ${frame.styles?.backgroundGradientStart || "#3b82f6"} ${frame.styles?.backgroundGradientStartStop ?? 0}%, ${frame.styles?.backgroundGradientEnd || "#8b5cf6"} ${frame.styles?.backgroundGradientEndStop ?? 100}%)`
        }
      } else if (frame.styles?.backgroundType === 'image' && frame.styles?.backgroundImage) {
        frameContent.style.backgroundImage = `url(${frame.styles.backgroundImage})`
        frameContent.style.backgroundSize = 'cover'
        frameContent.style.backgroundPosition = 'center'
      } else {
        frameContent.style.backgroundColor = frame.styles?.backgroundColor || '#ffffff'
      }

      tempContainer.appendChild(frameContent)

      // Store font sizes and scale all text effects proportionally since frame is displayed at 0.3x in canvas but downloaded at 1x
      const canvasScale = 0.3 // The scale used in canvas view
      const scaleFactor = 1 / canvasScale // 1 / 0.3 = 3.33...
      const headerFontSizeValue = Math.round(((typeof frame.styles.headerFontSize === 'number'
        ? frame.styles.headerFontSize
        : (frame.styles.headerFontSize ? parseInt(String(frame.styles.headerFontSize)) : 32)) * scaleFactor))
      const subtextFontSizeValue = Math.round(((typeof frame.styles.subtextFontSize === 'number'
        ? frame.styles.subtextFontSize
        : (frame.styles.subtextFontSize ? parseInt(String(frame.styles.subtextFontSize)) : 16)) * scaleFactor))

      // Scale text effects
      const headerStrokeWidth = frame.styles.headerStrokeWidth ? Math.round(frame.styles.headerStrokeWidth * scaleFactor) : 0
      const subtextStrokeWidth = frame.styles.subtextStrokeWidth ? Math.round(frame.styles.subtextStrokeWidth * scaleFactor) : 0
      const headerTextShadowX = frame.styles.headerTextShadowX !== undefined ? Math.round(frame.styles.headerTextShadowX * scaleFactor) : 0
      const headerTextShadowY = frame.styles.headerTextShadowY !== undefined ? Math.round(frame.styles.headerTextShadowY * scaleFactor) : 0
      const headerTextShadowBlur = frame.styles.headerTextShadowBlur !== undefined ? Math.round(frame.styles.headerTextShadowBlur * scaleFactor) : 0
      const subtextTextShadowX = frame.styles.subtextTextShadowX !== undefined ? Math.round(frame.styles.subtextTextShadowX * scaleFactor) : 0
      const subtextTextShadowY = frame.styles.subtextTextShadowY !== undefined ? Math.round(frame.styles.subtextTextShadowY * scaleFactor) : 0
      const subtextTextShadowBlur = frame.styles.subtextTextShadowBlur !== undefined ? Math.round(frame.styles.subtextTextShadowBlur * scaleFactor) : 0
      const paddingValue = 24 // Keep consistent padding with canvas preview
      const textureBackgroundSize = `${40 * scaleFactor}%` // Scale texture overlay from 40%
      const headerOffsetX = Math.round((frame.styles?.headerOffsetX ?? 0) * scaleFactor)
      const headerOffsetY = Math.round((frame.styles?.headerOffsetY ?? 0) * scaleFactor)
      const subtextOffsetX = Math.round((frame.styles?.subtextOffsetX ?? 0) * scaleFactor)
      const subtextOffsetY = Math.round((frame.styles?.subtextOffsetY ?? 0) * scaleFactor)
      const ctaOffsetX = Math.round((frame.styles?.ctaOffsetX ?? 0) * scaleFactor)
      const ctaOffsetY = Math.round((frame.styles?.ctaOffsetY ?? 0) * scaleFactor)

      // Add text content
      const textContainer = document.createElement('div')
      textContainer.style.position = 'absolute'
      textContainer.style.inset = '0'
      textContainer.style.zIndex = '10'
      frameContent.appendChild(textContainer)

      // Header Text
      if (frame.styles?.headerText && (frame.styles?.headerVisible !== false)) {
        const headerDiv = document.createElement('div')
        headerDiv.style.position = 'absolute'
        headerDiv.style.left = '0'
        headerDiv.style.right = '0'
        headerDiv.style.padding = `${paddingValue}px`
        headerDiv.style.top = '19%'
        headerDiv.style.transform = `translateY(-50%) translate(${headerOffsetX}px, ${headerOffsetY}px)`

        const header = document.createElement('h2')
        header.textContent = frame.styles.headerText
        console.log('Download - Header font size:', headerFontSizeValue, 'from frame.styles:', frame.styles.headerFontSize, 'Frame type width:', frame.type.width, 'height:', frame.type.height)
        // Apply styles directly to ensure they're set
        header.style.cssText = `font-size: ${headerFontSizeValue}px !important; font-weight: bold; text-align: ${frame.styles.headerAlignment || 'center'}; font-family: ${frame.styles.headerFontFamily || 'inherit'}; line-height: ${frame.styles.headerLineHeight || 1.2}; position: relative; z-index: 2; opacity: ${frame.styles.headerOpacity ?? 1}; margin: 0; padding: 0; display: block;`

        if (frame.styles.headerUseGradient && frame.styles.headerGradientStart && frame.styles.headerGradientEnd) {
          header.style.background = `linear-gradient(135deg, ${frame.styles.headerGradientStart}, ${frame.styles.headerGradientEnd})`
          header.style.webkitBackgroundClip = 'text'
          header.style.webkitTextFillColor = 'transparent'
          header.style.backgroundClip = 'text'
        } else {
          header.style.color = frame.styles.headerColor || '#000000'
        }

        if (frame.styles.headerTextShadowX !== undefined || frame.styles.headerTextShadowY !== undefined || frame.styles.headerTextShadowBlur !== undefined) {
          header.style.textShadow = `${headerTextShadowX}px ${headerTextShadowY}px ${headerTextShadowBlur}px ${frame.styles.headerTextShadowColor || '#000000'}`
        }

        if (frame.styles.headerStrokeWidth && frame.styles.headerStrokeColor) {
          const strokeSpan = document.createElement('span')
          strokeSpan.textContent = frame.styles.headerText
          strokeSpan.style.cssText = `position: absolute; inset: 0; -webkit-text-stroke: ${headerStrokeWidth}px ${frame.styles.headerStrokeColor}; -webkit-text-fill-color: transparent; color: transparent; z-index: 1; font-size: ${headerFontSizeValue}px !important; font-weight: bold; text-align: ${frame.styles.headerAlignment || 'center'}; font-family: ${frame.styles.headerFontFamily || 'inherit'}; line-height: ${frame.styles.headerLineHeight || 1.2}; margin: 0; padding: 0; display: block;`
          header.appendChild(strokeSpan)
        }

        // Texture overlay for header
        if (frame.styles.headerTextureOverlay) {
          const textureSpan = document.createElement('span')
          textureSpan.textContent = frame.styles.headerText
          textureSpan.style.cssText = `position: absolute; inset: 0; pointer-events: none; background-image: url(/textures/texture.jpg); background-size: ${textureBackgroundSize}; background-position: center; background-repeat: no-repeat; mix-blend-mode: multiply; opacity: ${frame.styles.headerTextureOverlayOpacity ?? 1}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; z-index: 3; font-size: ${headerFontSizeValue}px !important; font-weight: bold; text-align: ${frame.styles.headerAlignment || 'center'}; font-family: ${frame.styles.headerFontFamily || 'inherit'}; line-height: ${frame.styles.headerLineHeight || 1.2}; margin: 0; padding: 0; display: block;`
          header.style.position = 'relative'
          header.appendChild(textureSpan)
        }

        headerDiv.appendChild(header)
        textContainer.appendChild(headerDiv)
      }

      // Subtext
      if (frame.styles?.subtext && (frame.styles?.subtextVisible !== false)) {
        const subtextDiv = document.createElement('div')
        subtextDiv.style.position = 'absolute'
        subtextDiv.style.left = '0'
        subtextDiv.style.right = '0'
        subtextDiv.style.padding = `${paddingValue}px`
        subtextDiv.style.top = frame.styles?.ctaText
          ? '25%'
          : '83.33%'
        subtextDiv.style.transform = frame.styles?.ctaText
          ? `translate(${subtextOffsetX}px, ${subtextOffsetY}px)`
          : `translateY(-50%) translate(${subtextOffsetX}px, ${subtextOffsetY}px)`

        const subtext = document.createElement('p')
        subtext.textContent = frame.styles.subtext
        console.log('Download - Subtext font size:', subtextFontSizeValue, 'from frame.styles:', frame.styles.subtextFontSize)
        // Apply styles directly to ensure they're set
        subtext.style.cssText = `font-size: ${subtextFontSizeValue}px !important; line-height: ${frame.styles.subtextLineHeight || 1.5}; text-align: ${frame.styles.subtextAlignment || frame.styles.headerAlignment || 'center'}; font-family: ${frame.styles.subtextFontFamily || 'inherit'}; position: relative; z-index: 2; opacity: ${frame.styles.subtextOpacity ?? 1}; margin: 0; padding: 0; display: block;`

        if (frame.styles.subtextUseGradient && frame.styles.subtextGradientStart && frame.styles.subtextGradientEnd) {
          subtext.style.background = `linear-gradient(135deg, ${frame.styles.subtextGradientStart}, ${frame.styles.subtextGradientEnd})`
          subtext.style.webkitBackgroundClip = 'text'
          subtext.style.webkitTextFillColor = 'transparent'
          subtext.style.backgroundClip = 'text'
        } else {
          subtext.style.color = frame.styles.subtextColor || '#666666'
        }

        if (frame.styles.subtextTextShadowX !== undefined || frame.styles.subtextTextShadowY !== undefined || frame.styles.subtextTextShadowBlur !== undefined) {
          subtext.style.textShadow = `${subtextTextShadowX}px ${subtextTextShadowY}px ${subtextTextShadowBlur}px ${frame.styles.subtextTextShadowColor || '#000000'}`
        }

        if (frame.styles.subtextStrokeWidth && frame.styles.subtextStrokeColor) {
          const strokeSpan = document.createElement('span')
          strokeSpan.textContent = frame.styles.subtext
          strokeSpan.style.cssText = `position: absolute; inset: 0; -webkit-text-stroke: ${subtextStrokeWidth}px ${frame.styles.subtextStrokeColor}; -webkit-text-fill-color: transparent; color: transparent; z-index: 1; font-size: ${subtextFontSizeValue}px !important; line-height: ${frame.styles.subtextLineHeight || 1.5}; text-align: ${frame.styles.subtextAlignment || frame.styles.headerAlignment || 'center'}; font-family: ${frame.styles.subtextFontFamily || 'inherit'}; margin: 0; padding: 0; display: block;`
          subtext.appendChild(strokeSpan)
        }

        // Texture overlay for subtext
        if (frame.styles.subtextTextureOverlay) {
          const textureSpan = document.createElement('span')
          textureSpan.textContent = frame.styles.subtext
          textureSpan.style.cssText = `position: absolute; inset: 0; pointer-events: none; background-image: url(/textures/texture.jpg); background-size: ${textureBackgroundSize}; background-position: center; background-repeat: no-repeat; mix-blend-mode: multiply; opacity: ${frame.styles.subtextTextureOverlayOpacity ?? 1}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; z-index: 3; font-size: ${subtextFontSizeValue}px !important; line-height: ${frame.styles.subtextLineHeight || 1.5}; text-align: ${frame.styles.subtextAlignment || frame.styles.headerAlignment || 'center'}; font-family: ${frame.styles.subtextFontFamily || 'inherit'}; margin: 0; padding: 0; display: block;`
          subtext.style.position = 'relative'
          subtext.appendChild(textureSpan)
        }

        subtextDiv.appendChild(subtext)
        textContainer.appendChild(subtextDiv)
      }

      // CTA Button
      if (frame.styles?.ctaText) {
        const ctaDiv = document.createElement('div')
        ctaDiv.style.position = 'absolute'
        ctaDiv.style.left = '0'
        ctaDiv.style.right = '0'
        ctaDiv.style.bottom = '20%'
        ctaDiv.style.textAlign = frame.styles.headerAlignment || 'center'
        ctaDiv.style.transform = `translate(${ctaOffsetX}px, ${ctaOffsetY}px)`

        const ctaButton = document.createElement('button')
        ctaButton.textContent = frame.styles.ctaText
        ctaButton.style.padding = '12px 24px'
        ctaButton.style.borderRadius = '8px'
        ctaButton.style.fontWeight = '600'
        ctaButton.style.transition = 'opacity 0.2s'
        ctaButton.style.backgroundColor = frame.styles.ctaButtonColor || '#3b82f6'
        ctaButton.style.color = frame.styles.ctaTextColor || '#ffffff'
        ctaButton.style.border = 'none'
        ctaButton.style.cursor = 'pointer'

        ctaDiv.appendChild(ctaButton)
        textContainer.appendChild(ctaDiv)
      }

      // Logo - scale up proportionally for download
      if (frame.styles?.logoImage && (frame.styles?.logoVisible !== false)) {
        const canvasScale = 0.3 // The scale used in canvas view
        const scaleFactor = 1 / canvasScale // 1 / 0.3 = 3.33...
        const logoMaxWidth = Math.round(40 * scaleFactor) // 40px * 3.33 = ~133px
        const logoMaxHeight = Math.round(30 * scaleFactor) // 30px * 3.33 = ~100px
        const logoTopBottom = Math.round(8 * scaleFactor) // 8px * 3.33 = ~27px
        const logoLeftRight = Math.round(6 * scaleFactor) // 6px * 3.33 = ~20px
        const logoPadding = Math.round(2 * scaleFactor) // 2px * 3.33 = ~7px

        const logoDiv = document.createElement('div')
        logoDiv.style.position = 'absolute'
        logoDiv.style.padding = `${logoPadding}px`
        logoDiv.style.zIndex = '20'
        logoDiv.style.maxWidth = `${logoMaxWidth}px`
        logoDiv.style.maxHeight = `${logoMaxHeight}px`

        const position = frame.styles.logoPosition || 'top-right'
        if (position.includes('top')) {
          logoDiv.style.top = `${logoTopBottom}px`
        } else {
          logoDiv.style.bottom = `${logoTopBottom}px`
        }
        if (position.includes('left')) {
          logoDiv.style.left = `${logoLeftRight}px`
        } else {
          logoDiv.style.right = `${logoLeftRight}px`
        }

        const logoImg = document.createElement('img')
        logoImg.src = frame.styles.logoImage
        logoImg.alt = 'Logo'
        logoImg.style.width = '100%'
        logoImg.style.height = '100%'
        logoImg.style.objectFit = 'contain'
        logoImg.style.maxWidth = '100%'
        logoImg.style.maxHeight = '100%'
        logoImg.style.opacity = String(frame.styles.logoOpacity ?? 1)

        logoDiv.appendChild(logoImg)
        frameContent.appendChild(logoDiv)
      }

      // Preload images
      const imagePromises: Promise<void>[] = []

      // Preload texture image if texture overlay is used
      if (frame.styles.headerTextureOverlay || frame.styles.subtextTextureOverlay) {
        const textureImg = document.createElement('img')
        textureImg.crossOrigin = 'anonymous'
        imagePromises.push(new Promise<void>((resolve, reject) => {
          textureImg.onload = () => resolve()
          textureImg.onerror = () => {
            console.warn('Failed to load texture image')
            resolve()
          }
          textureImg.src = '/textures/texture.jpg'
        }))
      }

      // Preload logo image if logo is used
      if (frame.styles?.logoImage && (frame.styles?.logoVisible !== false)) {
        const logoImg = document.createElement('img')
        const logoSrc = frame.styles.logoImage
        if (logoSrc.startsWith('http') || logoSrc.startsWith('//')) {
          logoImg.crossOrigin = 'anonymous'
        }
        imagePromises.push(new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve()
          logoImg.onerror = () => {
            console.warn('Failed to load logo image, continuing without it')
            resolve()
          }
          logoImg.src = logoSrc
        }))
      }

      // Wait for all images to load
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises)
      }

      // Wait for rendering and ensure fonts are loaded
      await new Promise(resolve => setTimeout(resolve, 300))

      // Force a reflow to ensure styles are applied
      frameContent.offsetHeight

      // Create canvas from the frame content at full size
      // Note: scale: 2 means 2x resolution for quality, but the output dimensions match frame.type.width/height
      const canvas = await html2canvas(frameContent, {
        width: frame.type.width,
        height: frame.type.height,
        scale: 1, // Use scale 1 to match exact size (scale 2 was making it 2x larger)
        useCORS: true,
        backgroundColor: null,
        logging: false, // Disable logging
        allowTaint: true,
        windowWidth: frame.type.width,
        windowHeight: frame.type.height,
        onclone: (clonedDoc) => {
          // Ensure font sizes are preserved in the cloned document
          const clonedHeader = clonedDoc.querySelector('h2')
          const clonedSubtext = clonedDoc.querySelector('p')
          const clonedHeaderStroke = clonedHeader?.querySelector('span[style*="-webkit-text-stroke"]') as HTMLElement | null
          const clonedSubtextStroke = clonedSubtext?.querySelector('span[style*="-webkit-text-stroke"]') as HTMLElement | null
          const clonedHeaderTexture = clonedHeader?.querySelector('span[style*="background-image"]') as HTMLElement | null
          const clonedSubtextTexture = clonedSubtext?.querySelector('span[style*="background-image"]') as HTMLElement | null

          if (clonedHeader) {
            console.log('Cloned header - setting font-size to:', `${headerFontSizeValue}px`)
            clonedHeader.style.setProperty('font-size', `${headerFontSizeValue}px`, 'important')
            clonedHeader.style.setProperty('display', 'block', 'important')
            clonedHeader.style.setProperty('position', 'relative', 'important')
            // Force reflow
            clonedHeader.offsetHeight
            // Check computed style
            const computed = clonedDoc.defaultView?.getComputedStyle(clonedHeader)
            console.log('Cloned header computed font-size:', computed?.fontSize, 'Expected:', `${headerFontSizeValue}px`)
            if (computed && computed.fontSize !== `${headerFontSizeValue}px`) {
              // Try setting it again with cssText
              clonedHeader.style.cssText += `; font-size: ${headerFontSizeValue}px !important;`
            }
          }
          if (clonedHeaderStroke) {
            clonedHeaderStroke.style.setProperty('font-size', `${headerFontSizeValue}px`, 'important')
          }
          if (clonedHeaderTexture) {
            clonedHeaderTexture.style.setProperty('font-size', `${headerFontSizeValue}px`, 'important')
            clonedHeaderTexture.style.setProperty('background-size', textureBackgroundSize, 'important')
          }
          if (clonedSubtext) {
            console.log('Cloned subtext - setting font-size to:', `${subtextFontSizeValue}px`)
            clonedSubtext.style.setProperty('font-size', `${subtextFontSizeValue}px`, 'important')
            clonedSubtext.style.setProperty('display', 'block', 'important')
            clonedSubtext.style.setProperty('position', 'relative', 'important')
            // Force reflow
            clonedSubtext.offsetHeight
            // Check computed style
            const computed = clonedDoc.defaultView?.getComputedStyle(clonedSubtext)
            console.log('Cloned subtext computed font-size:', computed?.fontSize, 'Expected:', `${subtextFontSizeValue}px`)
            if (computed && computed.fontSize !== `${subtextFontSizeValue}px`) {
              // Try setting it again with cssText
              clonedSubtext.style.cssText += `; font-size: ${subtextFontSizeValue}px !important;`
            }
          }
          if (clonedSubtextStroke) {
            clonedSubtextStroke.style.setProperty('font-size', `${subtextFontSizeValue}px`, 'important')
          }
          if (clonedSubtextTexture) {
            clonedSubtextTexture.style.setProperty('font-size', `${subtextFontSizeValue}px`, 'important')
            clonedSubtextTexture.style.setProperty('background-size', textureBackgroundSize, 'important')
          }
        }
      })

      // Download the image
      const link = document.createElement('a')
      link.download = `${frame.name || frame.type.name || 'post'}-${frameId}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup
      document.body.removeChild(tempContainer)
    } catch (error) {
      console.error('Error downloading frame:', error)
      alert(`Failed to download frame: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    styleKey: "backgroundImage" | "logoImage"
  ) => {
    const file = e.target.files?.[0]
    // Reset input so same file can be selected again
    e.target.value = ""
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    try {
      const uid = user?.uid || "anonymous"
      const ext = file.name.split(".").pop() || "jpg"
      const path = `post-generator/${uid}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`

      const imgRef = storageRef(storage, path)
      await uploadBytes(imgRef, file)
      const downloadUrl = await getDownloadURL(imgRef)

      // Store only the download URL in frame styles
      updateFrameStyle(styleKey, downloadUrl)
    } catch (err) {
      console.error("Error uploading image to storage", err)
      alert("Failed to upload image. Please try again.")
    }
  }

  // Angle picker state and handlers (for sidebar)
  const [isDraggingAngle, setIsDraggingAngle] = useState(false)
  const anglePickerRef = useRef<HTMLDivElement>(null)

  const updateAngleFromCoordinates = (clientX: number, clientY: number) => {
    if (!anglePickerRef.current) return

    const rect = anglePickerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = clientX - centerX
    const deltaY = clientY - centerY

    // Calculate angle using swapped parameters to invert rotation direction
    // atan2(deltaX, -deltaY) inverts the rotation: counter-clockwise drag = counter-clockwise rotation
    // This gives: 0°=up, 90°=right, 180°=down, 270°=left (which matches CSS)
    let atan2Angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI)
    // Convert to 0-360 range
    atan2Angle = (atan2Angle + 360) % 360

    // The angle is already in CSS format (0°=up), so use it directly
    let cssAngle = atan2Angle

    updateFrameStyle('backgroundGradientAngle', Math.round(cssAngle))
  }

  const handleAnglePickerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingAngle(true)
    updateAngleFromCoordinates(e.clientX, e.clientY)
  }


  useEffect(() => {
    if (!isDraggingAngle) return

    const handleMouseMove = (e: MouseEvent) => {
      updateAngleFromCoordinates(e.clientX, e.clientY)
    }

    const handleMouseUp = () => {
      setIsDraggingAngle(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingAngle])

  const handleSelectFrame = (frameId: string) => {
    setSelectedFrameId(frameId)
  }

  const handleDeleteFrame = (frameId: string) => {
    setFrames(frames.filter(f => f.id !== frameId))
    if (selectedFrameId === frameId) {
      setSelectedFrameId(null)
    }
  }

  // Zoom functions
  const handleZoomIn = () => {
    setCanvasZoom(prev => Math.min(prev + 0.1, 3)) // Max zoom 3x
  }

  const handleZoomOut = () => {
    setCanvasZoom(prev => Math.max(prev - 0.1, 0.1)) // Min zoom 0.1x
  }

  const handleZoomReset = () => {
    setCanvasZoom(1)
    setCanvasOffset({ x: 0, y: 0 })
  }

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // Ctrl/Cmd + Plus to zoom in
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        handleZoomIn()
      }
      // Ctrl/Cmd + Minus to zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      }
      // Ctrl/Cmd + 0 to reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        handleZoomReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle wheel zoom directly
  const handleCanvasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Don't zoom if panning
    if (isPanning) {
      e.preventDefault()
      return
    }

    // Use Shift + scroll to zoom
    if (e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setCanvasZoom(prev => {
        const newZoom = Math.max(0.1, Math.min(3, prev + delta))
        return newZoom
      })
    }
  }

  // Handle spacebar keydown/keyup for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't activate if typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        setIsSpacebarPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        setIsSpacebarPressed(false)
        // Stop panning if spacebar is released
        if (isPanning) {
          setIsPanning(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPanning])

  // Handle panning (spacebar + drag)
  useEffect(() => {
    if (!isPanning) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - panStartRef.current.x
      const deltaY = e.clientY - panStartRef.current.y

      setCanvasOffset({
        x: panStartRef.current.offsetX + deltaX / canvasZoom,
        y: panStartRef.current.offsetY + deltaY / canvasZoom,
      })
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, canvasZoom])

  // Handle mouse down on canvas for panning
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start panning if spacebar is pressed
    if (isSpacebarPressed && e.button === 0) {
      e.preventDefault()
      e.stopPropagation()

      setIsPanning(true)
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: canvasOffset.x,
        offsetY: canvasOffset.y,
      }
    }
  }

  const handleFrameMouseDown = (e: React.MouseEvent<HTMLDivElement>, frameId: string) => {
    // Don't drag frame if spacebar is pressed - let canvas panning handle it
    if (isSpacebarPressed) {
      // Let the event bubble up to canvas for panning
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const frame = frames.find(f => f.id === frameId)
    if (!frame || !canvasRef.current) return

    setDraggingFrameId(frameId)
    setSelectedFrameId(frameId)

    const canvasRect = canvasRef.current.getBoundingClientRect()
    // Get the outer container (parent of the frame div)
    const frameContainer = (e.currentTarget as HTMLElement).parentElement

    // Calculate offset from mouse position to frame position
    const frameX = (e.clientX - canvasRect.left - 40) / canvasZoom - frame.x
    const frameY = (e.clientY - canvasRect.top - 40) / canvasZoom - frame.y

    dragOffsetRef.current = { x: frameX, y: frameY }
    dragStartPositionRef.current = { x: frame.x, y: frame.y }
    dragPositionRef.current = { x: frame.x, y: frame.y }

    // Store reference to the frame container for direct DOM manipulation
    if (frameContainer) {
      dragFrameRef.current = frameContainer as HTMLDivElement
    }
  }

  // Add global mouse event listeners for gradient slider dragging
  useEffect(() => {
    if (!draggingGradientHandle || !gradientSliderRef.current || !selectedFrameId) return

    const selectedFrame = frames.find(f => f.id === selectedFrameId)
    if (!selectedFrame) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gradientSliderRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))

      const currentFrame = frames.find(f => f.id === selectedFrameId)
      if (!currentFrame) return

      const startStop = currentFrame.styles?.backgroundGradientStartStop ?? 0
      const endStop = currentFrame.styles?.backgroundGradientEndStop ?? 100

      if (draggingGradientHandle === 'start') {
        updateFrameStyle('backgroundGradientStartStop', Math.round(Math.min(percent, endStop)))
      } else {
        updateFrameStyle('backgroundGradientEndStop', Math.round(Math.max(percent, startStop)))
      }
    }

    const handleMouseUp = () => {
      setDraggingGradientHandle(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingGradientHandle, selectedFrameId, frames])

  // Add global mouse event listeners for dragging with smooth performance
  useEffect(() => {
    if (!draggingFrameId) return

    let animationFrameId: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !dragFrameRef.current) return

      // Cancel previous animation frame if pending
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }

      // Use requestAnimationFrame for smooth, throttled updates
      animationFrameId = requestAnimationFrame(() => {
        const canvasRect = canvasRef.current?.getBoundingClientRect()
        if (!canvasRect || !dragFrameRef.current) return

        // Calculate new position accounting for zoom and offset
        const newX = (e.clientX - canvasRect.left - 40) / canvasZoom - dragOffsetRef.current.x
        const newY = (e.clientY - canvasRect.top - 40) / canvasZoom - dragOffsetRef.current.y

        // Constrain to positive values
        const constrainedX = Math.max(0, newX)
        const constrainedY = Math.max(0, newY)

        // Update ref for final position
        dragPositionRef.current = { x: constrainedX, y: constrainedY }

        // Update state for connection lines to re-render in real-time
        setDragPosition({ x: constrainedX, y: constrainedY })

        // Directly update the frame element's position via CSS transform
        // This avoids React re-renders during drag for smooth performance
        // Use translate relative to the original position
        const deltaX = constrainedX - dragStartPositionRef.current.x
        const deltaY = constrainedY - dragStartPositionRef.current.y

        dragFrameRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`
      })
    }

    const handleMouseUp = () => {
      // Cancel any pending animation frame
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }

      // Update the actual frame position in state only on mouse up
      if (draggingFrameId && dragPositionRef.current && dragFrameRef.current) {
        const finalX = dragPositionRef.current.x
        const finalY = dragPositionRef.current.y

        // Update the frame container's left/top styles directly to match the transform position
        // This prevents the visual jump when we remove the transform
        if (dragFrameRef.current) {
          dragFrameRef.current.style.left = `${finalX}px`
          dragFrameRef.current.style.top = `${finalY}px`

          // Remove transform immediately (synchronously) to prevent any slide animation
          dragFrameRef.current.style.transform = ''
        }

        // Update state immediately
        setFrames(prevFrames =>
          prevFrames.map(frame =>
            frame.id === draggingFrameId
              ? { ...frame, x: finalX, y: finalY }
              : frame
          )
        )

        // Clear the ref after a brief moment
        requestAnimationFrame(() => {
          dragFrameRef.current = null
        })
      } else {
        // Reset drag state if no position to save
        if (dragFrameRef.current) {
          dragFrameRef.current.style.transform = ''
          dragFrameRef.current = null
        }
      }

      setDraggingFrameId(null)
      setDragPosition(null)
      dragOffsetRef.current = { x: 0, y: 0 }
      dragStartPositionRef.current = { x: 0, y: 0 }
      dragPositionRef.current = { x: 0, y: 0 }
    }

    // Use passive listeners for better performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingFrameId, canvasZoom])

  const selectedFrame = frames.find(f => f.id === selectedFrameId)

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm here to help you create amazing posts! This is a placeholder response. The chat functionality will be connected to an AI model soon.",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, assistantMessage])
      setIsChatLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!selectedBrand) {
    return (
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Sidebar />
        <main className="md:ml-52 md:w-[calc(100%-13rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-6 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">No Brand Selected</h2>
                <p className="text-muted-foreground mb-6">
                  Please select a brand or create a new one to use the Post Generator.
                </p>
                <Button onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Editor View
  if (isEditorOpen) {
    return (
      <div className="min-h-screen bg-background text-foreground overflow-hidden flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center - Canvas */}
        <main className="md:ml-52 flex-1 flex flex-col overflow-hidden relative h-screen">
          {/* Editor Header */}
          <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm px-6 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseEditor}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold">
                  {editingPost ? "Edit Post" : "Create New Post"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {selectedBrand.brand_name}
                </p>
              </div>
            </div>
            {/* Mode Toggle - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 border border-border/50 rounded-md p-1 bg-background/80 backdrop-blur-sm">
              <Button
                variant={viewMode === "spaces" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("spaces")}
                className="h-7 px-3"
              >
                Spaces
              </Button>
              <Button
                variant={viewMode === "layer" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("layer")}
                className="h-7 px-3"
              >
                Layer
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border border-border/50 rounded-md p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-7 w-7"
                  title="Zoom Out (Ctrl/Cmd + -)"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <div className="px-2 py-1 text-xs text-muted-foreground min-w-[3rem] text-center">
                  {Math.round(canvasZoom * 100)}%
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-7 w-7"
                  title="Zoom In (Ctrl/Cmd + +)"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomReset}
                  className="h-7 w-7"
                  title="Reset Zoom (Ctrl/Cmd + 0)"
                >
                  <span className="text-xs">1:1</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveProject}
                disabled={isSavingProject}
              >
                {isSavingProject ? "Saving..." : "Save Draft"}
              </Button>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90" size="sm">
                Publish
              </Button>
            </div>
          </div>

          {/* Canvas Area - Only show in Spaces mode */}
          {viewMode === "spaces" ? (
            <div
              ref={canvasRef}
              className="flex-1 overflow-auto bg-muted/20 relative"
              onWheel={handleCanvasWheel}
              onMouseDown={handleCanvasMouseDown}
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,.15) 2px, transparent 2px)',
                backgroundSize: '24px 24px',
                cursor: isSpacebarPressed ? 'grab' : isPanning ? 'grabbing' : 'default',
              }}
            >
              <div
                className="relative"
                style={{
                  transform: `scale(${canvasZoom}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                  transformOrigin: 'top left',
                  minWidth: '100%',
                  minHeight: '100%',
                  padding: '40px'
                }}
              >
                {/* Connection Lines - Render before frames so they appear behind */}
                {frames.length > 0 && (
                  <svg
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{ width: '100%', height: '100%', overflow: 'visible' }}
                  >
                    {frames.map((frame) => {
                      if (!frame.connections?.childIds || frame.connections.childIds.length === 0) return null

                      const scale = 0.3
                      const headerHeight = 20 // Approximate height of frame header
                      const frameWidth = frame.type.width * scale
                      const frameHeight = frame.type.height * scale

                      // Check if frame has caption visible
                      const hasCaption = frame.styles?.captionVisible
                      let captionHeight = 0
                      if (hasCaption) {
                        // Caption height depends on content, approximate
                        if (frame.type.id === "reddit-post") {
                          captionHeight = 120 * scale // min-h-[120px] scaled
                        } else {
                          captionHeight = 80 * scale // min-h-[80px] scaled
                        }
                      }

                      // Calculate total height including header and caption
                      const totalHeight = headerHeight + frameHeight + (hasCaption ? captionHeight + 8 : 0) // 8px for spacing

                      // Use drag position if frame is being dragged, otherwise use frame position
                      const frameX = draggingFrameId === frame.id && dragPosition ? dragPosition.x : frame.x
                      const frameY = draggingFrameId === frame.id && dragPosition ? dragPosition.y : frame.y

                      // Source point: right edge of the frame (where connection dot is)
                      const sourceX = frameX + frameWidth
                      const sourceY = frameY + (totalHeight / 2)

                      return frame.connections.childIds.map((childId) => {
                        const childFrame = frames.find(f => f.id === childId)
                        if (!childFrame) return null

                        const childHeaderHeight = 20
                        const childFrameHeight = childFrame.type.height * scale
                        const childHasCaption = childFrame.styles?.captionVisible
                        let childCaptionHeight = 0
                        if (childHasCaption) {
                          if (childFrame.type.id === "reddit-post") {
                            childCaptionHeight = 120 * scale
                          } else {
                            childCaptionHeight = 80 * scale
                          }
                        }
                        const childTotalHeight = childHeaderHeight + childFrameHeight + (childHasCaption ? childCaptionHeight + 8 : 0)

                        // Use drag position if child frame is being dragged, otherwise use frame position
                        const childFrameX = draggingFrameId === childId && dragPosition ? dragPosition.x : childFrame.x
                        const childFrameY = draggingFrameId === childId && dragPosition ? dragPosition.y : childFrame.y

                        // Target point: left edge of child frame, vertically centered
                        const targetX = childFrameX
                        const targetY = childFrameY + (childTotalHeight / 2)

                        // Calculate control points for smooth curve
                        const distance = targetX - sourceX
                        const controlPoint1X = sourceX + distance * 0.5
                        const controlPoint1Y = sourceY
                        const controlPoint2X = sourceX + distance * 0.5
                        const controlPoint2Y = targetY

                        // Calculate arrowhead angle
                        const angle = Math.atan2(targetY - controlPoint2Y, targetX - controlPoint2X)
                        const arrowLength = 8
                        const arrowWidth = 4

                        return (
                          <g key={`${frame.id}-${childId}`}>
                            {/* Main curved connection line - solid */}
                            <path
                              d={`M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`}
                              stroke="#026a79"
                              strokeWidth="1.5"
                              fill="none"
                              opacity={0.7}
                            />
                            {/* Arrowhead at the end */}
                            <path
                              d={`M ${targetX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle)} ${targetY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)} L ${targetX} ${targetY} L ${targetX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle)} ${targetY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)}`}
                              stroke="#026a79"
                              strokeWidth="1.5"
                              fill="none"
                              opacity={0.7}
                            />
                          </g>
                        )
                      })
                    })}
                  </svg>
                )}

                {frames.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No frames yet</p>
                      <p className="text-sm text-muted-foreground">
                        Select a frame type from the right sidebar to get started
                      </p>
                    </div>
                  </div>
                ) : (
                  frames.map((frame) => {
                    const isSelected = selectedFrameId === frame.id
                    const isDragging = draggingFrameId === frame.id
                    const scale = 0.3 // Scale down frames for canvas view

                    return (
                      <div
                        key={frame.id}
                        data-frame={frame.id}
                        className="absolute"
                        style={{
                          left: `${frame.x}px`,
                          top: `${frame.y}px`,
                        }}
                      >
                        {/* Frame Header */}
                        <div className="mb-1">
                          <span className="text-xs font-medium text-foreground">
                            {frame.name || `${frame.type.id}-${frames.indexOf(frame) + 1}`}
                          </span>
                        </div>

                        {/* Frame Action Buttons - Moved to wrapper to align with title */}
                        {isSelected && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-0 right-8 w-6 h-6 p-0 z-50 bg-background hover:bg-muted"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                downloadFrame(frame.id)
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-0 right-0 w-6 h-6 p-0 z-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteFrame(frame.id)
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}

                        {/* Frame */}
                        <div
                          ref={(el) => {
                            if (el) {
                              frameRefs.current[frame.id] = el
                            }
                            if (isDragging && el?.parentElement) {
                              dragFrameRef.current = el.parentElement as HTMLDivElement
                            }
                          }}
                          onMouseDown={(e) => handleFrameMouseDown(e, frame.id)}
                          onClick={(e) => {
                            // Only select if we didn't just drag (check if transform was applied)
                            if (!isDragging && !dragFrameRef.current?.style.transform) {
                              handleSelectFrame(frame.id)
                            }
                          }}
                          className={`border-2 rounded-lg bg-white shadow-lg ${isDragging
                            ? 'cursor-grabbing z-50'
                            : 'cursor-grab'
                            } ${isSelected && !isDragging
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50'
                            } relative`}
                          style={{
                            width: `${frame.type.width * scale}px`,
                            height: `${frame.type.height * scale}px`,
                            userSelect: 'none',
                            pointerEvents: 'auto',
                            willChange: isDragging ? 'transform' : 'auto',
                            transition: 'none', // No transitions - frames should stay exactly where they are
                          }}
                        >
                          {/* Frame Content */}
                          <div
                            className="w-full h-full rounded relative overflow-hidden"
                            style={{
                              ...(frame.styles?.backgroundType === "solid" && {
                                backgroundColor: frame.styles?.backgroundColor || "#ffffff",
                              }),
                              ...(frame.styles?.backgroundType === "gradient" && {
                                background: frame.styles?.backgroundGradientType === "radial"
                                  ? `radial-gradient(circle, ${frame.styles?.backgroundGradientStart || "#3b82f6"} ${frame.styles?.backgroundGradientStartStop ?? 0}%, ${frame.styles?.backgroundGradientEnd || "#8b5cf6"} ${frame.styles?.backgroundGradientEndStop ?? 100}%)`
                                  : `linear-gradient(${(frame.styles?.backgroundGradientAngle || 0) + 180}deg, ${frame.styles?.backgroundGradientStart || "#3b82f6"} ${frame.styles?.backgroundGradientStartStop ?? 0}%, ${frame.styles?.backgroundGradientEnd || "#8b5cf6"} ${frame.styles?.backgroundGradientEndStop ?? 100}%)`,
                              }),
                              ...(frame.styles?.backgroundType === "image" && frame.styles?.backgroundImage && {
                                backgroundImage: `url(${frame.styles.backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }),
                              ...(!frame.styles?.backgroundType && {
                                backgroundColor: frame.styles?.backgroundColor || "#ffffff",
                              }),
                            }}
                          >
                            {frame.content?.image && (
                              <Image
                                src={frame.content.image}
                                alt={frame.type.name}
                                width={frame.type.width}
                                height={frame.type.height}
                                className="w-full h-full object-cover rounded absolute inset-0"
                              />
                            )}

                            {/* Text Content */}
                            <div className="absolute inset-0 z-10">
                              {/* Header Text - Center of top 1/3rd */}
                              {frame.styles?.headerText && (frame.styles?.headerVisible !== false) && (
                                <div
                                  className="absolute left-0 right-0 p-6"
                                  style={{
                                    top: `calc(19% + ${(frame.styles?.headerOffsetY ?? 0) * scale}px)`,
                                    transform: `translateY(-50%) translateX(${(frame.styles?.headerOffsetX ?? 0) * scale}px)`,
                                  }}
                                >
                                  <h2
                                    className="font-bold relative"
                                    style={{
                                      fontSize: `${Math.round((frame.styles.headerFontSize || 32) * scale)}px`,
                                      textAlign: frame.styles.headerAlignment || "center",
                                      fontFamily: frame.styles.headerFontFamily || "inherit",
                                      lineHeight: frame.styles.headerLineHeight || 1.2,
                                    }}
                                  >
                                    {/* Stroke layer (behind) */}
                                    {frame.styles.headerStrokeWidth && frame.styles.headerStrokeColor && (
                                      <span
                                        className="absolute inset-0"
                                        style={{
                                          WebkitTextStroke: `${Math.round((frame.styles.headerStrokeWidth || 0) * scale)}px ${frame.styles.headerStrokeColor}`,
                                          WebkitTextFillColor: 'transparent',
                                          color: 'transparent',
                                          zIndex: 1,
                                        } as React.CSSProperties}
                                      >
                                        {frame.styles.headerText}
                                      </span>
                                    )}
                                    {/* Text fill layer (on top) */}
                                    <span
                                      style={{
                                        position: 'relative',
                                        zIndex: 2,
                                        opacity: frame.styles.headerOpacity ?? 1,
                                        ...(frame.styles.headerTextShadowX !== undefined || frame.styles.headerTextShadowY !== undefined || frame.styles.headerTextShadowBlur !== undefined
                                          ? {
                                            textShadow: `${Math.round((frame.styles.headerTextShadowX ?? 0) * scale)}px ${Math.round((frame.styles.headerTextShadowY ?? 0) * scale)}px ${Math.round((frame.styles.headerTextShadowBlur ?? 0) * scale)}px ${frame.styles.headerTextShadowColor || '#000000'}`,
                                          }
                                          : {}),
                                        ...(frame.styles.headerUseGradient && frame.styles.headerGradientStart && frame.styles.headerGradientEnd
                                          ? {
                                            background: `linear-gradient(135deg, ${frame.styles.headerGradientStart}, ${frame.styles.headerGradientEnd})`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                          }
                                          : {
                                            color: frame.styles.headerColor || "#000000",
                                          }),
                                      }}
                                    >
                                      {frame.styles.headerText}
                                    </span>
                                    {/* Texture overlay layer */}
                                    {frame.styles.headerTextureOverlay && (
                                      <span
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                          backgroundImage: 'url(/textures/texture.jpg)',
                                          backgroundSize: '40%',
                                          backgroundPosition: 'center',
                                          mixBlendMode: 'multiply',
                                          opacity: frame.styles.headerTextureOverlayOpacity ?? 1,
                                          WebkitBackgroundClip: 'text',
                                          WebkitTextFillColor: 'transparent',
                                          backgroundClip: 'text',
                                          color: 'transparent',
                                          zIndex: 3,
                                        }}
                                      >
                                        {frame.styles.headerText}
                                      </span>
                                    )}
                                  </h2>
                                </div>
                              )}

                              {/* Subtext - Below header if CTA exists, otherwise center of bottom 1/3rd */}
                              {frame.styles?.subtext && (frame.styles?.subtextVisible !== false) && (
                                <div
                                  className="absolute left-0 right-0 p-6"
                                  style={{
                                    top: frame.styles?.ctaText
                                      ? `calc(25% + ${(frame.styles?.subtextOffsetY ?? 0) * scale}px)`
                                      : `calc(83.33% + ${(frame.styles?.subtextOffsetY ?? 0) * scale}px)`,
                                    transform: frame.styles?.ctaText
                                      ? `translateX(${(frame.styles?.subtextOffsetX ?? 0) * scale}px)`
                                      : `translateY(-50%) translateX(${(frame.styles?.subtextOffsetX ?? 0) * scale}px)`,
                                  }}
                                >
                                  <p
                                    className="relative"
                                    style={{
                                      fontSize: `${Math.round((frame.styles.subtextFontSize || 16) * scale)}px`,
                                      lineHeight: frame.styles.subtextLineHeight || 1.5,
                                      textAlign: frame.styles.subtextAlignment || frame.styles.headerAlignment || "center",
                                      fontFamily: frame.styles.subtextFontFamily || "inherit",
                                    }}
                                  >
                                    {/* Stroke layer (behind) */}
                                    {frame.styles.subtextStrokeWidth && frame.styles.subtextStrokeColor && (
                                      <span
                                        className="absolute inset-0"
                                        style={{
                                          fontSize: `${Math.round((frame.styles.subtextFontSize || 16) * scale)}px`,
                                          lineHeight: frame.styles.subtextLineHeight || 1.5,
                                          textAlign: frame.styles.subtextAlignment || frame.styles.headerAlignment || "center",
                                          fontFamily: frame.styles.subtextFontFamily || "inherit",
                                          WebkitTextStroke: `${Math.round((frame.styles.subtextStrokeWidth || 0) * scale)}px ${frame.styles.subtextStrokeColor}`,
                                          WebkitTextFillColor: 'transparent',
                                          color: 'transparent',
                                          zIndex: 1,
                                        } as React.CSSProperties}
                                      >
                                        {frame.styles.subtext}
                                      </span>
                                    )}
                                    {/* Text fill layer (on top) */}
                                    <span
                                      style={{
                                        position: 'relative',
                                        zIndex: 2,
                                        opacity: frame.styles.subtextOpacity ?? 1,
                                        ...(frame.styles.subtextTextShadowX !== undefined || frame.styles.subtextTextShadowY !== undefined || frame.styles.subtextTextShadowBlur !== undefined
                                          ? {
                                            textShadow: `${Math.round((frame.styles.subtextTextShadowX ?? 0) * scale)}px ${Math.round((frame.styles.subtextTextShadowY ?? 0) * scale)}px ${Math.round((frame.styles.subtextTextShadowBlur ?? 0) * scale)}px ${frame.styles.subtextTextShadowColor || '#000000'}`,
                                          }
                                          : {}),
                                        ...(frame.styles.subtextUseGradient && frame.styles.subtextGradientStart && frame.styles.subtextGradientEnd
                                          ? {
                                            background: `linear-gradient(135deg, ${frame.styles.subtextGradientStart}, ${frame.styles.subtextGradientEnd})`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                          }
                                          : {
                                            color: frame.styles.subtextColor || "#666666",
                                          }),
                                      }}
                                    >
                                      {frame.styles.subtext}
                                    </span>
                                    {/* Texture overlay layer */}
                                    {frame.styles.subtextTextureOverlay && (
                                      <span
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                          backgroundImage: 'url(/textures/texture.jpg)',
                                          backgroundSize: '40%',
                                          backgroundPosition: 'center',
                                          mixBlendMode: 'multiply',
                                          opacity: frame.styles.subtextTextureOverlayOpacity ?? 1,
                                          WebkitBackgroundClip: 'text',
                                          WebkitTextFillColor: 'transparent',
                                          backgroundClip: 'text',
                                          color: 'transparent',
                                          zIndex: 3,
                                        }}
                                      >
                                        {frame.styles.subtext}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* CTA Button - Center bottom area */}
                              {frame.styles?.ctaText && (
                                <div
                                  className="absolute left-0 right-0 p-6"
                                  style={{
                                    bottom: '20%',
                                    textAlign: frame.styles.headerAlignment || "center",
                                    transform: `translate(${(frame.styles?.ctaOffsetX ?? 0) * scale}px, ${(frame.styles?.ctaOffsetY ?? 0) * scale}px)`,
                                  }}
                                >
                                  <button
                                    className="rounded-lg font-semibold transition-opacity hover:opacity-90"
                                    style={{
                                      padding: `${Math.round(6 * scale)}px ${Math.round(12 * scale)}px`,
                                      fontSize: `${Math.round(14 * scale)}px`,
                                      backgroundColor: frame.styles.ctaButtonColor || "#3b82f6",
                                      color: frame.styles.ctaTextColor || "#ffffff",
                                    }}
                                  >
                                    {frame.styles.ctaText}
                                  </button>
                                </div>
                              )}

                              {/* Logo */}
                              {frame.styles?.logoImage && (frame.styles?.logoVisible !== false) && (
                                <div
                                  className="absolute z-20"
                                  style={{
                                    top: frame.styles.logoPosition?.includes('top') ? `${20 * scale}px` : 'auto',
                                    bottom: frame.styles.logoPosition?.includes('bottom') ? `${20 * scale}px` : 'auto',
                                    left: frame.styles.logoPosition?.includes('left') ? `${20 * scale}px` : 'auto',
                                    right: frame.styles.logoPosition?.includes('right') ? `${20 * scale}px` : 'auto',
                                    height: `${80 * scale}px`,
                                    padding: `${2 * scale}px`,
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <img
                                    src={frame.styles.logoImage}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '100%',
                                      opacity: frame.styles.logoOpacity ?? 1,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {frame.type.id === "instagram-post" && (
                            <div
                              className="mt-2 space-y-2"
                              style={{ width: `${frame.type.width * scale}px` }}
                            >
                              {frame.styles?.captionVisible && (
                                <div
                                  className="relative border border-border/60 rounded-lg bg-background/80 p-2 pt-6"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onMouseUp={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="absolute top-1 right-1 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                    onClick={() => updateFrameStyleById(frame.id, "captionVisible", false)}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  <Textarea
                                    placeholder="Add caption"
                                    className="text-xs min-h-[80px]"
                                    value={frame.styles?.captionText || ""}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      updateFrameStyleById(frame.id, "captionText", e.target.value)
                                    }
                                  />
                                  {!frame.styles?.captionText && (
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      Start typing to add a caption
                                    </p>
                                  )}
                                </div>
                              )}
                              {!frame.styles?.captionVisible && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => updateFrameStyleById(frame.id, "captionVisible", true)}
                                >
                                  Add Caption
                                </Button>
                              )}
                            </div>
                          )}

                          {frame.type.id === "reddit-post" && (
                            <div
                              className="mt-2 space-y-2"
                              style={{ width: `${frame.type.width * scale}px` }}
                            >
                              {frame.styles?.captionVisible && (
                                <div
                                  className="relative border border-border/60 rounded-lg bg-background/80 p-2 pt-6"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onMouseUp={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="absolute top-1 right-1 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                    onClick={() => updateFrameStyleById(frame.id, "captionVisible", false)}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  <Textarea
                                    placeholder="Add caption"
                                    className="text-xs min-h-[120px]"
                                    value={frame.styles?.captionText || ""}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      updateFrameStyleById(frame.id, "captionText", e.target.value)
                                    }
                                  />
                                  {!frame.styles?.captionText && (
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      Start typing to add a caption
                                    </p>
                                  )}
                                </div>
                              )}
                              {!frame.styles?.captionVisible && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => updateFrameStyleById(frame.id, "captionVisible", true)}
                                >
                                  Add Caption
                                </Button>
                              )}
                            </div>
                          )}

                        </div>

                        {/* Arrow button positioned on the right of both post and caption - only shows when no connections */}
                        {(frame.type.id === "instagram-post" || frame.type.id === "reddit-post") &&
                          frame.styles?.captionVisible &&
                          (!frame.connections?.childIds || frame.connections.childIds.length === 0) && (
                            <div
                              className="absolute top-1/2 -right-16 z-50 flex items-center justify-center"
                              style={{
                                transform: 'translateY(-50%)',
                              }}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-14 w-14 rounded-full bg-muted/50 hover:bg-muted/70 text-foreground shadow-md hover:shadow-lg transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <ArrowRight className="w-6 h-6" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" side="right">
                                  <DropdownMenuLabel>Generate a post on</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    const redditPostType = frameTypes.find(ft => ft.id === "reddit-post")
                                    if (redditPostType) {
                                      handleAddConnectedFrame(frame.id, redditPostType)
                                    }
                                  }}>
                                    Reddit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => console.log("Generate for Meta")}>
                                    Meta
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => console.log("Generate for Linkedin")}>
                                    Linkedin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => console.log("Generate for Email")}>
                                    Email
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}

                        {/* Connection dot at source - interactive when connections exist */}
                        {(frame.type.id === "instagram-post" || frame.type.id === "reddit-post") &&
                          frame.styles?.captionVisible &&
                          frame.connections?.childIds && frame.connections.childIds.length > 0 && (
                            <ConnectionSourceDot
                              frame={frame}
                              scale={scale}
                              frameTypes={frameTypes}
                              onAddConnectedFrame={handleAddConnectedFrame}
                            />
                          )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            /* Layer Mode - Show individual post editor */
            <div className="flex-1 overflow-auto bg-muted/20 relative flex items-center justify-center p-8">
              {selectedFrameId && frames.find(f => f.id === selectedFrameId) ? (
                (() => {
                  const selectedFrame = frames.find(f => f.id === selectedFrameId)!
                  const frameWidth = selectedFrame.type.width
                  const frameHeight = selectedFrame.type.height
                  // Use CSS to scale - will fit container while maintaining aspect ratio
                  const scale = 0.7 // Scale down to 70% to fit nicely in viewport
                  const scaledWidth = frameWidth * scale
                  const scaledHeight = frameHeight * scale

                  return (
                    <div className="flex flex-col items-center gap-3">
                      {/* Frame Header - compact line above frame */}
                      <div className="w-full flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span className="font-medium text-foreground truncate max-w-[60%]">
                          {selectedFrame.name || selectedFrame.type.name}
                        </span>
                        <span>
                          {selectedFrame.type.width} × {selectedFrame.type.height}
                        </span>
                      </div>

                      {/* Full-size Frame Preview */}
                      <div
                        className="border-2 rounded-lg bg-white shadow-2xl relative"
                        style={{
                          width: `${scaledWidth}px`,
                          height: `${scaledHeight}px`,
                        }}
                      >
                        {/* Frame Content */}
                        <div
                          className="w-full h-full rounded relative overflow-hidden"
                          style={{
                            ...(selectedFrame.styles?.backgroundType === "solid" && {
                              backgroundColor: selectedFrame.styles?.backgroundColor || "#ffffff",
                            }),
                            ...(selectedFrame.styles?.backgroundType === "gradient" && {
                              background: selectedFrame.styles?.backgroundGradientType === "radial"
                                ? `radial-gradient(circle, ${selectedFrame.styles?.backgroundGradientStart || "#3b82f6"} ${selectedFrame.styles?.backgroundGradientStartStop ?? 0}%, ${selectedFrame.styles?.backgroundGradientEnd || "#8b5cf6"} ${selectedFrame.styles?.backgroundGradientEndStop ?? 100}%)`
                                : `linear-gradient(${(selectedFrame.styles?.backgroundGradientAngle || 0) + 180}deg, ${selectedFrame.styles?.backgroundGradientStart || "#3b82f6"} ${selectedFrame.styles?.backgroundGradientStartStop ?? 0}%, ${selectedFrame.styles?.backgroundGradientEnd || "#8b5cf6"} ${selectedFrame.styles?.backgroundGradientEndStop ?? 100}%)`,
                            }),
                            ...(selectedFrame.styles?.backgroundType === "image" && selectedFrame.styles?.backgroundImage && {
                              backgroundImage: `url(${selectedFrame.styles.backgroundImage})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }),
                            ...(!selectedFrame.styles?.backgroundType && {
                              backgroundColor: selectedFrame.styles?.backgroundColor || "#ffffff",
                            }),
                          }}
                        >
                          {selectedFrame.content?.image && (
                            <Image
                              src={selectedFrame.content.image}
                              alt={selectedFrame.type.name}
                              width={selectedFrame.type.width}
                              height={selectedFrame.type.height}
                              className="w-full h-full object-cover rounded absolute inset-0"
                            />
                          )}

                          {/* Text Content - Scaled proportionally with frame */}
                          <div className="absolute inset-0 z-10" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${frameWidth}px`, height: `${frameHeight}px` }}>
                            {/* Header Text */}
                            {selectedFrame.styles?.headerText && (selectedFrame.styles?.headerVisible !== false) && (
                              <div
                                className="absolute left-0 right-0 p-6"
                                style={{
                                  top: `calc(19% + ${(selectedFrame.styles?.headerOffsetY ?? 0)}px)`,
                                  transform: `translateY(-50%) translateX(${selectedFrame.styles?.headerOffsetX ?? 0}px)`,
                                }}
                              >
                                <h2
                                  className="font-bold relative"
                                  style={{
                                    fontSize: `${selectedFrame.styles.headerFontSize || 32}px`,
                                    textAlign: selectedFrame.styles.headerAlignment || "center",
                                    fontFamily: selectedFrame.styles.headerFontFamily || "inherit",
                                    lineHeight: selectedFrame.styles.headerLineHeight || 1.2,
                                  }}
                                >
                                  {selectedFrame.styles.headerStrokeWidth && selectedFrame.styles.headerStrokeColor && (
                                    <span
                                      className="absolute inset-0"
                                      style={{
                                        WebkitTextStroke: `${selectedFrame.styles.headerStrokeWidth}px ${selectedFrame.styles.headerStrokeColor}`,
                                        WebkitTextFillColor: 'transparent',
                                        color: 'transparent',
                                        zIndex: 1,
                                      } as React.CSSProperties}
                                    >
                                      {selectedFrame.styles.headerText}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      position: 'relative',
                                      zIndex: 2,
                                      opacity: selectedFrame.styles.headerOpacity ?? 1,
                                      ...(selectedFrame.styles.headerTextShadowX !== undefined || selectedFrame.styles.headerTextShadowY !== undefined || selectedFrame.styles.headerTextShadowBlur !== undefined
                                        ? {
                                          textShadow: `${selectedFrame.styles.headerTextShadowX ?? 0}px ${selectedFrame.styles.headerTextShadowY ?? 0}px ${selectedFrame.styles.headerTextShadowBlur ?? 0}px ${selectedFrame.styles.headerTextShadowColor || '#000000'}`,
                                        }
                                        : {}),
                                      ...(selectedFrame.styles.headerUseGradient && selectedFrame.styles.headerGradientStart && selectedFrame.styles.headerGradientEnd
                                        ? {
                                          background: `linear-gradient(135deg, ${selectedFrame.styles.headerGradientStart}, ${selectedFrame.styles.headerGradientEnd})`,
                                          WebkitBackgroundClip: 'text',
                                          WebkitTextFillColor: 'transparent',
                                          backgroundClip: 'text',
                                        }
                                        : {
                                          color: selectedFrame.styles.headerColor || "#000000",
                                        }),
                                    }}
                                  >
                                    {selectedFrame.styles.headerText}
                                  </span>
                                  {selectedFrame.styles.headerTextureOverlay && (
                                    <span
                                      className="absolute inset-0 pointer-events-none"
                                      style={{
                                        backgroundImage: 'url(/textures/texture.jpg)',
                                        backgroundSize: '40%',
                                        backgroundPosition: 'center',
                                        mixBlendMode: 'multiply',
                                        opacity: selectedFrame.styles.headerTextureOverlayOpacity ?? 1,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        color: 'transparent',
                                        zIndex: 3,
                                      }}
                                    >
                                      {selectedFrame.styles.headerText}
                                    </span>
                                  )}
                                </h2>
                              </div>
                            )}

                            {/* Subtext */}
                            {selectedFrame.styles?.subtext && (selectedFrame.styles?.subtextVisible !== false) && (
                              <div
                                className="absolute left-0 right-0 p-6"
                                style={{
                                  top: selectedFrame.styles?.ctaText
                                    ? `calc(25% + ${(selectedFrame.styles?.subtextOffsetY ?? 0)}px)`
                                    : `calc(83.33% + ${(selectedFrame.styles?.subtextOffsetY ?? 0)}px)`,
                                  transform: selectedFrame.styles?.ctaText
                                    ? `translateX(${selectedFrame.styles?.subtextOffsetX ?? 0}px)`
                                    : `translateY(-50%) translateX(${selectedFrame.styles?.subtextOffsetX ?? 0}px)`,
                                }}
                              >
                                <p
                                  className="relative"
                                  style={{
                                    fontSize: `${selectedFrame.styles.subtextFontSize || 16}px`,
                                    lineHeight: selectedFrame.styles.subtextLineHeight || 1.5,
                                    textAlign: selectedFrame.styles.subtextAlignment || selectedFrame.styles.headerAlignment || "center",
                                    fontFamily: selectedFrame.styles.subtextFontFamily || "inherit",
                                  }}
                                >
                                  {selectedFrame.styles.subtextStrokeWidth && selectedFrame.styles.subtextStrokeColor && (
                                    <span
                                      className="absolute inset-0"
                                      style={{
                                        fontSize: `${selectedFrame.styles.subtextFontSize || 16}px`,
                                        lineHeight: selectedFrame.styles.subtextLineHeight || 1.5,
                                        textAlign: selectedFrame.styles.subtextAlignment || selectedFrame.styles.headerAlignment || "center",
                                        fontFamily: selectedFrame.styles.subtextFontFamily || "inherit",
                                        WebkitTextStroke: `${selectedFrame.styles.subtextStrokeWidth}px ${selectedFrame.styles.subtextStrokeColor}`,
                                        WebkitTextFillColor: 'transparent',
                                        color: 'transparent',
                                        zIndex: 1,
                                      } as React.CSSProperties}
                                    >
                                      {selectedFrame.styles.subtext}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      position: 'relative',
                                      zIndex: 2,
                                      opacity: selectedFrame.styles.subtextOpacity ?? 1,
                                      ...(selectedFrame.styles.subtextTextShadowX !== undefined || selectedFrame.styles.subtextTextShadowY !== undefined || selectedFrame.styles.subtextTextShadowBlur !== undefined
                                        ? {
                                          textShadow: `${selectedFrame.styles.subtextTextShadowX ?? 0}px ${selectedFrame.styles.subtextTextShadowY ?? 0}px ${selectedFrame.styles.subtextTextShadowBlur ?? 0}px ${selectedFrame.styles.subtextTextShadowColor || '#000000'}`,
                                        }
                                        : {}),
                                      ...(selectedFrame.styles.subtextUseGradient && selectedFrame.styles.subtextGradientStart && selectedFrame.styles.subtextGradientEnd
                                        ? {
                                          background: `linear-gradient(135deg, ${selectedFrame.styles.subtextGradientStart}, ${selectedFrame.styles.subtextGradientEnd})`,
                                          WebkitBackgroundClip: 'text',
                                          WebkitTextFillColor: 'transparent',
                                          backgroundClip: 'text',
                                        }
                                        : {
                                          color: selectedFrame.styles.subtextColor || "#666666",
                                        }),
                                    }}
                                  >
                                    {selectedFrame.styles.subtext}
                                  </span>
                                  {selectedFrame.styles.subtextTextureOverlay && (
                                    <span
                                      className="absolute inset-0 pointer-events-none"
                                      style={{
                                        backgroundImage: 'url(/textures/texture.jpg)',
                                        backgroundSize: '40%',
                                        backgroundPosition: 'center',
                                        mixBlendMode: 'multiply',
                                        opacity: selectedFrame.styles.subtextTextureOverlayOpacity ?? 1,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        color: 'transparent',
                                        zIndex: 3,
                                      }}
                                    >
                                      {selectedFrame.styles.subtext}
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}

                            {/* CTA Button */}
                            {selectedFrame.styles?.ctaText && (
                              <div
                                className="absolute left-0 right-0 p-6"
                                style={{
                                  bottom: '20%',
                                  textAlign: selectedFrame.styles.headerAlignment || "center",
                                  transform: `translate(${selectedFrame.styles?.ctaOffsetX ?? 0}px, ${selectedFrame.styles?.ctaOffsetY ?? 0}px)`,
                                }}
                              >
                                <button
                                  className="px-6 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
                                  style={{
                                    backgroundColor: selectedFrame.styles.ctaButtonColor || "#3b82f6",
                                    color: selectedFrame.styles.ctaTextColor || "#ffffff",
                                  }}
                                >
                                  {selectedFrame.styles.ctaText}
                                </button>
                              </div>
                            )}

                            {/* Logo */}
                            {selectedFrame.styles?.logoImage && (selectedFrame.styles?.logoVisible !== false) && (
                              <div
                                className="absolute z-20 w-full"
                                style={{
                                  top: selectedFrame.styles.logoPosition?.includes('top') ? '20px' : 'auto',
                                  // Layer mode uses a fixed bottom offset, independent of scale
                                  bottom: selectedFrame.styles.logoPosition?.includes('bottom') ? '24px' : 'auto',
                                  left: selectedFrame.styles.logoPosition?.includes('left') ? '20px' : 'auto',
                                  right: selectedFrame.styles.logoPosition?.includes('right') ? '20px' : 'auto',
                                  height: `${110 * scale}px`,
                                  padding: `2px`,
                                  boxSizing: 'border-box',
                                }}
                              >
                                <img
                                  src={selectedFrame.styles.logoImage}
                                  alt="Logo"
                                  className="object-contain"
                                  style={{
                                    height: `${110 * scale}px`,
                                    opacity: selectedFrame.styles.logoOpacity ?? 1,
                                  }}
                                />
                              </div>
                            )}

                            {/* Caption overlay toggle & panel (layer mode only) */}
                            {(selectedFrame.type.id === "instagram-post" || selectedFrame.type.id === "reddit-post") && (
                              <>
                                {/* Toggle pill at bottom-right of frame */}
                                <button
                                  type="button"
                                  className="absolute bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-black/80 text-white px-5 py-2.5 text-base shadow-lg hover:bg-black/95"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsLayerCaptionOpen((open) => !open)
                                  }}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <span>Caption</span>
                                </button>

                                {/* Caption editor overlay inside frame */}
                                {isLayerCaptionOpen && (
                                  <div className="absolute inset-x-4 bottom-4 z-20 rounded-lg border border-border/80 bg-background/95 shadow-xl p-2 pt-6">
                                    <button
                                      className="absolute top-1 right-1 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setIsLayerCaptionOpen(false)
                                      }}
                                    >
                                      <X className="w-6 h-36" />
                                    </button>
                                    <Textarea
                                      placeholder="Add caption"
                                      className={`min-h-[${selectedFrame.type.id === "reddit-post" ? 120 : 80}px] text-base`}
                                      style={{
                                        fontSize: `${28 * scale}px`,
                                        minHeight: `${(selectedFrame.type.id === "reddit-post" ? 300 : 200) * scale}px`,
                                      }}
                                      value={selectedFrame.styles?.captionText || ""}
                                      onChange={(e) =>
                                        updateFrameStyleById(selectedFrame.id, "captionText", e.target.value)
                                      }
                                    />
                                    {!selectedFrame.styles?.captionText && (
                                      <p className="text-muted-foreground mt-1" style={{ fontSize: `${20 * scale}px` }}>
                                        Start typing to add a caption
                                      </p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Caption Section below frame (disabled in layer mode; using overlay inside frame instead) */}
                        {false && (selectedFrame.type.id === "instagram-post" || selectedFrame.type.id === "reddit-post") && (
                          <div
                            className="mt-2 space-y-2"
                            style={{ width: `${scaledWidth}px` }}
                          >
                            {selectedFrame.styles?.captionVisible && (
                              <div
                                className="relative border border-border/60 rounded-lg bg-background/80 p-2 pt-6"
                                style={{ fontSize: `${12 * scale}px` }}
                              >
                                <button
                                  className="absolute top-1 right-1 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                  onClick={() => updateFrameStyleById(selectedFrame.id, "captionVisible", false)}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <Textarea
                                  placeholder="Add caption"
                                  className={`min-h-[${selectedFrame.type.id === "reddit-post" ? 120 : 80}px]`}
                                  style={{ fontSize: `${12 * scale}px`, minHeight: `${(selectedFrame.type.id === "reddit-post" ? 120 : 80) * scale}px` }}
                                  value={selectedFrame.styles?.captionText || ""}
                                  onChange={(e) =>
                                    updateFrameStyleById(selectedFrame.id, "captionText", e.target.value)
                                  }
                                />
                                {!selectedFrame.styles?.captionText && (
                                  <p className="text-muted-foreground mt-1" style={{ fontSize: `${11 * scale}px` }}>
                                    Start typing to add a caption
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Layer Mode</p>
                  <p className="text-xs mt-2">Select a layer from the sidebar to edit</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar - Frame Types or Editor */}
        <div
          className="border-l border-border/50 bg-card/50 backdrop-blur-sm flex flex-col h-screen overflow-hidden relative"
          style={{ width: `${rightSidebarWidth}px` }}
        >
          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10 ${isResizing ? 'bg-primary' : ''
              }`}
          />

          {/* Layer Mode - Show Layers and Properties tabs */}
          {viewMode === "layer" ? (
            <>
              {/* Tabs */}
              <div className="border-b border-border/50 flex">
                <button
                  onClick={() => setLayerSidebarTab("layers")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${layerSidebarTab === "layers"
                    ? "bg-background border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  Layers
                </button>
                <button
                  onClick={() => setLayerSidebarTab("properties")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${layerSidebarTab === "properties"
                    ? "bg-background border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  Properties
                </button>
              </div>

              {layerSidebarTab === "layers" ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                  {frames.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No layers yet. Add frames to see them here.
                    </div>
                  ) : (
                    frames.map((frame, index) => {
                      const isSelected = selectedFrameId === frame.id
                      return (
                        <div
                          key={frame.id}
                          onClick={() => {
                            setSelectedFrameId(frame.id)
                            setLayerSidebarTab("properties")
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card hover:bg-muted/50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              {frame.type.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {frame.name || `${frame.type.name} ${index + 1}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {frame.type.width} × {frame.type.height}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              ) : (
                // Properties tab - show existing properties editor
                selectedFrameId ? (
                  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold">Edit Layer</h2>
                        <p className="text-xs text-muted-foreground">
                          {frames.find(f => f.id === selectedFrameId)?.type.name || "Layer"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFrameId(null)
                          setLayerSidebarTab("layers")
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Properties editor - same as spaces mode */}
                    {selectedFrame && (
                      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
                          {/* Background Section */}
                          <div className="space-y-4">
                            <button
                              onClick={() => toggleSection('background')}
                              className="flex items-center justify-between w-full gap-2 pb-2 border-b border-border/50 hover:opacity-80 transition-opacity"
                            >
                              <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold">Background</h3>
                              </div>
                              {expandedSections.background ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            {expandedSections.background && (
                              <div className="space-y-4 w-full min-w-0">
                                <div className="w-full min-w-0">
                                  <label className="text-xs text-muted-foreground mb-2 block">Background Type</label>
                                  <div className="flex flex-wrap gap-2 w-full min-w-0">
                                    <Button
                                      variant={selectedFrame?.styles?.backgroundType === "solid" ? "default" : "outline"}
                                      size="sm"
                                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                                      onClick={() => updateFrameStyle('backgroundType', 'solid')}
                                    >
                                      Solid
                                    </Button>
                                    <Button
                                      variant={selectedFrame?.styles?.backgroundType === "gradient" ? "default" : "outline"}
                                      size="sm"
                                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                                      onClick={() => updateFrameStyle('backgroundType', 'gradient')}
                                    >
                                      Gradient
                                    </Button>
                                    <Button
                                      variant={selectedFrame?.styles?.backgroundType === "image" ? "default" : "outline"}
                                      size="sm"
                                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                                      onClick={() => updateFrameStyle('backgroundType', 'image')}
                                    >
                                      Image
                                    </Button>
                                    <Button
                                      variant={selectedFrame?.styles?.backgroundType === "ai" ? "default" : "outline"}
                                      size="sm"
                                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                                      onClick={() => updateFrameStyle('backgroundType', 'ai')}
                                    >
                                      <Sparkles className="w-3 h-3 mr-1 flex-shrink-0" />
                                      Mayvn AI
                                    </Button>
                                  </div>
                                </div>

                                {/* Solid Color */}
                                {selectedFrame?.styles?.backgroundType === "solid" && (
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">Background Color</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        className="w-12 h-10 rounded border border-border cursor-pointer"
                                        value={selectedFrame?.styles?.backgroundColor || "#ffffff"}
                                        onChange={(e) => updateFrameStyle('backgroundColor', e.target.value)}
                                      />
                                      <Input
                                        type="text"
                                        placeholder="#ffffff"
                                        className="flex-1 text-sm"
                                        value={selectedFrame?.styles?.backgroundColor || "#ffffff"}
                                        onChange={(e) => updateFrameStyle('backgroundColor', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Gradient - Full section */}
                                {selectedFrame?.styles?.backgroundType === "gradient" && (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-2 block">Gradient Type</label>
                                      <div className="flex gap-2">
                                        <Button
                                          variant={selectedFrame?.styles?.backgroundGradientType === "linear" ? "default" : "outline"}
                                          size="sm"
                                          className="flex-1"
                                          onClick={() => updateFrameStyle('backgroundGradientType', 'linear')}
                                        >
                                          Linear
                                        </Button>
                                        <Button
                                          variant={selectedFrame?.styles?.backgroundGradientType === "radial" ? "default" : "outline"}
                                          size="sm"
                                          className="flex-1"
                                          onClick={() => updateFrameStyle('backgroundGradientType', 'radial')}
                                        >
                                          Radial
                                        </Button>
                                      </div>
                                    </div>
                                    {selectedFrame?.styles?.backgroundGradientType === "linear" && (
                                      <div>
                                        <label className="text-xs text-muted-foreground mb-2 block">Angle (degrees)</label>
                                        <div className="flex items-center gap-3">
                                          <div
                                            ref={anglePickerRef}
                                            onMouseDown={handleAnglePickerMouseDown}
                                            className="relative w-24 h-24 rounded-full border-2 border-border cursor-pointer flex items-center justify-center bg-muted/30"
                                            style={{ touchAction: 'none' }}
                                          >
                                            <div className="absolute w-1.5 h-1.5 rounded-full bg-foreground z-10" />
                                            <div
                                              className="absolute w-0.5 bg-primary origin-bottom"
                                              style={{
                                                height: '40%',
                                                transform: `rotate(${selectedFrame?.styles?.backgroundGradientAngle || 0}deg)`,
                                                transformOrigin: 'bottom center',
                                                bottom: '50%',
                                                left: '50%',
                                                marginLeft: '-1px',
                                              }}
                                            />
                                            <div
                                              className="absolute w-2 h-2 rounded-full bg-primary border-2 border-background"
                                              style={{
                                                transform: `rotate(${selectedFrame?.styles?.backgroundGradientAngle || 0}deg)`,
                                                transformOrigin: '50% 100%',
                                                bottom: '50%',
                                                left: '50%',
                                                marginLeft: '-4px',
                                                marginBottom: '-4px',
                                              }}
                                            />
                                          </div>
                                          <div className="flex-1">
                                            <Input
                                              type="number"
                                              placeholder="0"
                                              className="text-sm"
                                              min="0"
                                              max="360"
                                              value={selectedFrame?.styles?.backgroundGradientAngle || 0}
                                              onChange={(e) => updateFrameStyle('backgroundGradientAngle', parseInt(e.target.value) || 0)}
                                            />
                                            <div className="mt-1 text-xs text-muted-foreground">
                                              <span>0° = up, 90° = right, 180° = down, 270° = left</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-2 block">Start Color</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="color"
                                          className="w-12 h-10 rounded border border-border cursor-pointer"
                                          value={selectedFrame?.styles?.backgroundGradientStart || "#3b82f6"}
                                          onChange={(e) => updateFrameStyle('backgroundGradientStart', e.target.value)}
                                        />
                                        <Input
                                          type="text"
                                          placeholder="#3b82f6"
                                          className="flex-1 text-sm"
                                          value={selectedFrame?.styles?.backgroundGradientStart || "#3b82f6"}
                                          onChange={(e) => updateFrameStyle('backgroundGradientStart', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-2 block">End Color</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="color"
                                          className="w-12 h-10 rounded border border-border cursor-pointer"
                                          value={selectedFrame?.styles?.backgroundGradientEnd || "#8b5cf6"}
                                          onChange={(e) => updateFrameStyle('backgroundGradientEnd', e.target.value)}
                                        />
                                        <Input
                                          type="text"
                                          placeholder="#8b5cf6"
                                          className="flex-1 text-sm"
                                          value={selectedFrame?.styles?.backgroundGradientEnd || "#8b5cf6"}
                                          onChange={(e) => updateFrameStyle('backgroundGradientEnd', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <label className="text-xs text-muted-foreground mb-2 block">
                                        Color Stops
                                      </label>
                                      <div
                                        ref={gradientSliderRef}
                                        className="relative w-full h-8 cursor-pointer"
                                        onMouseDown={(e) => {
                                          if (!gradientSliderRef.current || !selectedFrame) return
                                          const rect = gradientSliderRef.current.getBoundingClientRect()
                                          const x = e.clientX - rect.left
                                          const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))

                                          const startStop = selectedFrame.styles?.backgroundGradientStartStop ?? 0
                                          const endStop = selectedFrame.styles?.backgroundGradientEndStop ?? 100

                                          const distToStart = Math.abs(percent - startStop)
                                          const distToEnd = Math.abs(percent - endStop)

                                          if (distToStart < distToEnd) {
                                            setDraggingGradientHandle('start')
                                            updateFrameStyle('backgroundGradientStartStop', Math.round(Math.min(percent, endStop)))
                                          } else {
                                            setDraggingGradientHandle('end')
                                            updateFrameStyle('backgroundGradientEndStop', Math.round(Math.max(percent, startStop)))
                                          }
                                        }}
                                      >
                                        <div className="absolute top-1/2 left-0 right-0 h-2 bg-muted rounded-lg -translate-y-1/2" />
                                        <div
                                          className="absolute top-1/2 h-2 bg-primary/30 rounded-lg -translate-y-1/2"
                                          style={{
                                            left: `${selectedFrame?.styles?.backgroundGradientStartStop ?? 0}%`,
                                            width: `${(selectedFrame?.styles?.backgroundGradientEndStop ?? 100) - (selectedFrame?.styles?.backgroundGradientStartStop ?? 0)}%`,
                                          }}
                                        />
                                        <div
                                          className="absolute top-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full cursor-grab active:cursor-grabbing -translate-x-1/2 -translate-y-1/2 z-10"
                                          style={{
                                            left: `${selectedFrame?.styles?.backgroundGradientStartStop ?? 0}%`,
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation()
                                            setDraggingGradientHandle('start')
                                          }}
                                        />
                                        <div
                                          className="absolute top-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full cursor-grab active:cursor-grabbing -translate-x-1/2 -translate-y-1/2 z-10"
                                          style={{
                                            left: `${selectedFrame?.styles?.backgroundGradientEndStop ?? 100}%`,
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation()
                                            setDraggingGradientHandle('end')
                                          }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                        <span>Start: {selectedFrame?.styles?.backgroundGradientStartStop ?? 0}%</span>
                                        <span>End: {selectedFrame?.styles?.backgroundGradientEndStop ?? 100}%</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Mayvn AI */}
                                {selectedFrame?.styles?.backgroundType === "ai" && (
                                  <div className="space-y-3 w-full">
                                    <div className="w-full">
                                      <label className="text-xs text-muted-foreground mb-2 block">Enter your prompt</label>
                                      <Textarea
                                        placeholder="Describe the background you want..."
                                        className="min-h-[100px] text-sm resize-none w-full"
                                        value={aiPromptInput}
                                        onChange={(e) => setAIPromptInput(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex gap-2 w-full">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 min-w-0"
                                        onClick={() => generateSimplePrompt(aiPromptInput)}
                                        disabled={generatingAIPrompt || !aiPromptInput.trim()}
                                      >
                                        {generatingAIPrompt ? (
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                                        ) : null}
                                        <span className="truncate">Simple Prompt</span>
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="flex-1 min-w-0"
                                        onClick={() => generateMagicPrompt(aiPromptInput)}
                                        disabled={generatingAIPrompt || !aiPromptInput.trim()}
                                      >
                                        {generatingAIPrompt ? (
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                                        ) : (
                                          <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                                        )}
                                        <span className="truncate">Magic Prompt</span>
                                      </Button>
                                    </div>
                                    {selectedFrame?.styles?.backgroundAIPrompt && (
                                      <div className="mt-3 p-3 bg-muted rounded-lg w-full overflow-hidden">
                                        <label className="text-xs text-muted-foreground mb-1 block">Generated Prompt:</label>
                                        <div className="max-h-[200px] overflow-y-auto w-full">
                                          <p className="text-sm text-foreground whitespace-pre-wrap break-words overflow-wrap-anywhere w-full">
                                            {selectedFrame.styles.backgroundAIPrompt}
                                          </p>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                              navigator.clipboard.writeText(selectedFrame.styles.backgroundAIPrompt || "")
                                              alert("Prompt copied to clipboard!")
                                            }}
                                          >
                                            Copy Prompt
                                          </Button>
                                          <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1"
                                            onClick={generateImage}
                                            disabled={isGeneratingImage}
                                          >
                                            {isGeneratingImage ? (
                                              <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Generating...
                                              </>
                                            ) : (
                                              <>
                                                <ImageIcon className="w-4 h-4 mr-2" />
                                                Generate Image
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Image */}
                                {selectedFrame?.styles?.backgroundType === "image" && (
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">Background Image</label>
                                    {selectedFrame?.styles?.backgroundImage ? (
                                      <div className="space-y-2">
                                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                                          <Image
                                            src={selectedFrame.styles.backgroundImage}
                                            alt="Background"
                                            fill
                                            className="object-cover"
                                          />
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => updateFrameStyle('backgroundImage', '')}
                                          >
                                            <X className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        <input
                                          id="background-image-upload-layer"
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleImageUpload(e, 'backgroundImage')}
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full cursor-pointer"
                                          onClick={() => document.getElementById('background-image-upload-layer')?.click()}
                                        >
                                          <ImageIcon className="w-4 h-4 mr-2" />
                                          Change Image
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <input
                                          id="background-image-upload-empty-layer"
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleImageUpload(e, 'backgroundImage')}
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full cursor-pointer"
                                          onClick={() => document.getElementById('background-image-upload-empty-layer')?.click()}
                                        >
                                          <ImageIcon className="w-4 h-4 mr-2" />
                                          Upload Image
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Header Section */}
                          <HeaderSection
                            frame={selectedFrame!}
                            isExpanded={expandedSections.header}
                            onToggle={() => toggleSection("header")}
                            onVisibilityToggle={() =>
                              updateFrameStyle("headerVisible", !(selectedFrame?.styles?.headerVisible !== false))
                            }
                            updateFrameStyle={updateFrameStyle}
                          />

                          {/* Subtext Section */}
                          <SubtextSection
                            frame={selectedFrame!}
                            isExpanded={expandedSections.subtext}
                            onToggle={() => toggleSection("subtext")}
                            onVisibilityToggle={() =>
                              updateFrameStyle("subtextVisible", !(selectedFrame?.styles?.subtextVisible !== false))
                            }
                            updateFrameStyle={updateFrameStyle}
                          />

                          {/* CTA Section */}
                          <div className="space-y-4">
                            <button
                              onClick={() => toggleSection('cta')}
                              className="flex items-center justify-between w-full gap-2 pb-2 border-b border-border/50 hover:opacity-80 transition-opacity"
                            >
                              <div className="flex items-center gap-2">
                                <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold">Call to Action</h3>
                              </div>
                              {expandedSections.cta ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            {expandedSections.cta && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Button Text</label>
                                  <Input
                                    type="text"
                                    placeholder="Learn More"
                                    className="text-sm"
                                    value={selectedFrame?.styles?.ctaText || ""}
                                    onChange={(e) => updateFrameStyle('ctaText', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Button Color</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      className="w-12 h-10 rounded border border-border cursor-pointer"
                                      value={selectedFrame?.styles?.ctaButtonColor || "#3b82f6"}
                                      onChange={(e) => updateFrameStyle('ctaButtonColor', e.target.value)}
                                    />
                                    <Input
                                      type="text"
                                      placeholder="#3b82f6"
                                      className="flex-1 text-sm"
                                      value={selectedFrame?.styles?.ctaButtonColor || "#3b82f6"}
                                      onChange={(e) => updateFrameStyle('ctaButtonColor', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Text Color</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      className="w-12 h-10 rounded border border-border cursor-pointer"
                                      value={selectedFrame?.styles?.ctaTextColor || "#ffffff"}
                                      onChange={(e) => updateFrameStyle('ctaTextColor', e.target.value)}
                                    />
                                    <Input
                                      type="text"
                                      placeholder="#ffffff"
                                      className="flex-1 text-sm"
                                      value={selectedFrame?.styles?.ctaTextColor || "#ffffff"}
                                      onChange={(e) => updateFrameStyle('ctaTextColor', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Link URL</label>
                                  <Input
                                    type="url"
                                    placeholder="https://example.com"
                                    className="text-sm"
                                    value={selectedFrame?.styles?.ctaLink || ""}
                                    onChange={(e) => updateFrameStyle('ctaLink', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Position Offset (px)</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-1 block">Offset X</label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        className="text-sm"
                                        value={selectedFrame?.styles?.ctaOffsetX ?? 0}
                                        onChange={(e) => updateFrameStyle('ctaOffsetX', parseInt(e.target.value) || 0)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-1 block">Offset Y</label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        className="text-sm"
                                        value={selectedFrame?.styles?.ctaOffsetY ?? 0}
                                        onChange={(e) => updateFrameStyle('ctaOffsetY', parseInt(e.target.value) || 0)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Logo Section */}
                          <div className="space-y-4">
                            <button
                              onClick={() => toggleSection('logo')}
                              className="flex items-center justify-between w-full gap-2 pb-2 border-b border-border/50 hover:opacity-80 transition-opacity"
                            >
                              <div className="flex items-center gap-2">
                                {selectedFrame?.styles?.logoVisible !== false ? (
                                  <Eye className="w-4 h-4 text-muted-foreground" onClick={(e) => { e.stopPropagation(); updateFrameStyle('logoVisible', false) }} />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-muted-foreground" onClick={(e) => { e.stopPropagation(); updateFrameStyle('logoVisible', true) }} />
                                )}
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold">Logo</h3>
                              </div>
                              {expandedSections.logo ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            {expandedSections.logo && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Logo Image</label>
                                  <Select
                                    value={selectedFrame?.styles?.logoImage === selectedBrand?.logo?.logo ? 'brand-logo' : selectedFrame?.styles?.logoImage === selectedBrand?.logo?.logo_small ? 'brand-logo-small' : selectedFrame?.styles?.logoImage ? 'custom' : 'none'}
                                    onValueChange={(value) => {
                                      if (value === 'brand-logo') {
                                        updateFrameStyle('logoImage', selectedBrand?.logo?.logo)
                                      } else if (value === 'brand-logo-small') {
                                        updateFrameStyle('logoImage', selectedBrand?.logo?.logo_small)
                                      } else if (value === 'custom') {
                                        if (!selectedFrame?.styles?.logoImage) {
                                          document.getElementById('logo-image-upload-layer')?.click()
                                        }
                                      } else {
                                        updateFrameStyle('logoImage', undefined)
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full text-sm">
                                      <SelectValue placeholder="Select logo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedBrand?.logo?.logo && (
                                        <SelectItem value="brand-logo">
                                          Brand Logo (Full)
                                        </SelectItem>
                                      )}
                                      {selectedBrand?.logo?.logo_small && (
                                        <SelectItem value="brand-logo-small">
                                          Brand Logo (Small)
                                        </SelectItem>
                                      )}
                                      <SelectItem value="custom">
                                        Upload Custom Logo
                                      </SelectItem>
                                      <SelectItem value="none">No Logo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <input
                                    type="file"
                                    id="logo-image-upload-layer"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, 'logoImage')}
                                  />
                                  {selectedFrame?.styles?.logoImage && (
                                    <div className="space-y-2 mt-2">
                                      <div className="relative w-full h-32 border border-border rounded-lg overflow-hidden bg-muted/50">
                                        <img
                                          src={selectedFrame.styles.logoImage}
                                          alt="Logo preview"
                                          className="w-full h-full object-contain p-2"
                                        />
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => updateFrameStyle('logoImage', undefined)}
                                      >
                                        Remove Logo
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Position</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      variant={selectedFrame?.styles?.logoPosition === 'top-left' ? 'default' : 'outline'}
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => updateFrameStyle('logoPosition', 'top-left')}
                                    >
                                      Top Left
                                    </Button>
                                    <Button
                                      variant={selectedFrame?.styles?.logoPosition === 'top-right' ? 'default' : 'outline'}
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => updateFrameStyle('logoPosition', 'top-right')}
                                    >
                                      Top Right
                                    </Button>
                                    <Button
                                      variant={selectedFrame?.styles?.logoPosition === 'bottom-left' ? 'default' : 'outline'}
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => updateFrameStyle('logoPosition', 'bottom-left')}
                                    >
                                      Bottom Left
                                    </Button>
                                    <Button
                                      variant={selectedFrame?.styles?.logoPosition === 'bottom-right' ? 'default' : 'outline'}
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => updateFrameStyle('logoPosition', 'bottom-right')}
                                    >
                                      Bottom Right
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">
                                    Opacity: {Math.round((selectedFrame?.styles?.logoOpacity ?? 1) * 100)}%
                                  </label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    value={selectedFrame?.styles?.logoOpacity ?? 1}
                                    onChange={(e) => updateFrameStyle('logoOpacity', parseFloat(e.target.value))}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-4">
                    <div className="text-muted-foreground text-sm">
                      Select a layer to edit its properties
                    </div>
                  </div>
                )
              )}
            </>
          ) : (
            // Spaces Mode - Show existing sidebar
            <>
              {!selectedFrame ? (
                <>
                  <div className="border-b border-border/50 px-4 py-3">
                    <h2 className="text-sm font-semibold">Frame Types</h2>
                    <p className="text-xs text-muted-foreground">Add frames to your canvas</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                    {frameTypes.map((frameType) => (
                      <button
                        key={frameType.id}
                        onClick={() => handleAddFrame(frameType)}
                        className="w-full p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            {frameType.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1">{frameType.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {frameType.aspectRatio} • {frameType.width} × {frameType.height}
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Frame Editor Header */}
                  <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold">Edit Frame</h2>
                      <p className="text-xs text-muted-foreground">{selectedFrame.type.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFrameId(null)
                        setIsTabsOpen(true)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Selected Frame Editor Sections */}
                  {isTabsOpen && (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
                        {/* Background Section */}
                        <div className="space-y-4">
                          <button
                            onClick={() => toggleSection('background')}
                            className="flex items-center justify-between w-full gap-2 pb-2 border-b border-border/50 hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-2">
                              <Palette className="w-4 h-4 text-muted-foreground" />
                              <h3 className="text-sm font-semibold">Background</h3>
                            </div>
                            {expandedSections.background ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          {expandedSections.background && (
                            <div className="space-y-4 w-full min-w-0">
                              <div className="w-full min-w-0">
                                <label className="text-xs text-muted-foreground mb-2 block">Background Type</label>
                                <div className="flex flex-wrap gap-2 w-full min-w-0">
                                  <Button
                                    variant={selectedFrame?.styles?.backgroundType === "solid" ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 min-w-[calc(50%-0.25rem)]"
                                    onClick={() => updateFrameStyle('backgroundType', 'solid')}
                                  >
                                    Solid
                                  </Button>
                                  <Button
                                    variant={selectedFrame?.styles?.backgroundType === "gradient" ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 min-w-[calc(50%-0.25rem)]"
                                    onClick={() => updateFrameStyle('backgroundType', 'gradient')}
                                  >
                                    Gradient
                                  </Button>
                                  <Button
                                    variant={selectedFrame?.styles?.backgroundType === "image" ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 min-w-[calc(50%-0.25rem)]"
                                    onClick={() => updateFrameStyle('backgroundType', 'image')}
                                  >
                                    Image
                                  </Button>
                                  <Button
                                    variant={selectedFrame?.styles?.backgroundType === "ai" ? "default" : "outline"}
                                    size="sm"
                                    className="flex-1 min-w-[calc(50%-0.25rem)]"
                                    onClick={() => updateFrameStyle('backgroundType', 'ai')}
                                  >
                                    <Sparkles className="w-3 h-3 mr-1 flex-shrink-0" />
                                    Mayvn AI
                                  </Button>
                                </div>
                              </div>

                              {/* Solid Color */}
                              {selectedFrame?.styles?.backgroundType === "solid" && (
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Background Color</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      className="w-12 h-10 rounded border border-border cursor-pointer"
                                      value={selectedFrame?.styles?.backgroundColor || "#ffffff"}
                                      onChange={(e) => updateFrameStyle('backgroundColor', e.target.value)}
                                    />
                                    <Input
                                      type="text"
                                      placeholder="#ffffff"
                                      className="flex-1 text-sm"
                                      value={selectedFrame?.styles?.backgroundColor || "#ffffff"}
                                      onChange={(e) => updateFrameStyle('backgroundColor', e.target.value)}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Gradient */}
                              {selectedFrame?.styles?.backgroundType === "gradient" && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">Gradient Type</label>
                                    <div className="flex gap-2">
                                      <Button
                                        variant={selectedFrame?.styles?.backgroundGradientType === "linear" ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => updateFrameStyle('backgroundGradientType', 'linear')}
                                      >
                                        Linear
                                      </Button>
                                      <Button
                                        variant={selectedFrame?.styles?.backgroundGradientType === "radial" ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => updateFrameStyle('backgroundGradientType', 'radial')}
                                      >
                                        Radial
                                      </Button>
                                    </div>
                                  </div>
                                  {selectedFrame?.styles?.backgroundGradientType === "linear" && (
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-2 block">Angle (degrees)</label>
                                      <div className="flex items-center gap-3">
                                        <div
                                          ref={anglePickerRef}
                                          onMouseDown={handleAnglePickerMouseDown}
                                          className="relative w-24 h-24 rounded-full border-2 border-border cursor-pointer flex items-center justify-center bg-muted/30"
                                          style={{ touchAction: 'none' }}
                                        >
                                          {/* Center dot */}
                                          <div className="absolute w-1.5 h-1.5 rounded-full bg-foreground z-10" />

                                          {/* Angle line */}
                                          <div
                                            className="absolute w-0.5 bg-primary origin-bottom"
                                            style={{
                                              height: '40%',
                                              transform: `rotate(${selectedFrame?.styles?.backgroundGradientAngle || 0}deg)`,
                                              transformOrigin: 'bottom center',
                                              bottom: '50%',
                                              left: '50%',
                                              marginLeft: '-1px',
                                            }}
                                          />

                                          {/* Angle indicator dot */}
                                          <div
                                            className="absolute w-2 h-2 rounded-full bg-primary border-2 border-background"
                                            style={{
                                              transform: `rotate(${selectedFrame?.styles?.backgroundGradientAngle || 0}deg)`,
                                              transformOrigin: '50% 100%',
                                              bottom: '50%',
                                              left: '50%',
                                              marginLeft: '-4px',
                                              marginBottom: '-4px',
                                            }}
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <Input
                                            type="number"
                                            placeholder="0"
                                            className="text-sm"
                                            min="0"
                                            max="360"
                                            value={selectedFrame?.styles?.backgroundGradientAngle || 0}
                                            onChange={(e) => updateFrameStyle('backgroundGradientAngle', parseInt(e.target.value) || 0)}
                                          />
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            <span>0° = up, 90° = right, 180° = down, 270° = left</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">Start Color</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        className="w-12 h-10 rounded border border-border cursor-pointer"
                                        value={selectedFrame?.styles?.backgroundGradientStart || "#3b82f6"}
                                        onChange={(e) => updateFrameStyle('backgroundGradientStart', e.target.value)}
                                      />
                                      <Input
                                        type="text"
                                        placeholder="#3b82f6"
                                        className="flex-1 text-sm"
                                        value={selectedFrame?.styles?.backgroundGradientStart || "#3b82f6"}
                                        onChange={(e) => updateFrameStyle('backgroundGradientStart', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-2 block">End Color</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        className="w-12 h-10 rounded border border-border cursor-pointer"
                                        value={selectedFrame?.styles?.backgroundGradientEnd || "#8b5cf6"}
                                        onChange={(e) => updateFrameStyle('backgroundGradientEnd', e.target.value)}
                                      />
                                      <Input
                                        type="text"
                                        placeholder="#8b5cf6"
                                        className="flex-1 text-sm"
                                        value={selectedFrame?.styles?.backgroundGradientEnd || "#8b5cf6"}
                                        onChange={(e) => updateFrameStyle('backgroundGradientEnd', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <label className="text-xs text-muted-foreground mb-2 block">
                                      Color Stops
                                    </label>
                                    <div
                                      ref={gradientSliderRef}
                                      className="relative w-full h-8 cursor-pointer"
                                      onMouseDown={(e) => {
                                        if (!gradientSliderRef.current || !selectedFrame) return
                                        const rect = gradientSliderRef.current.getBoundingClientRect()
                                        const x = e.clientX - rect.left
                                        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))

                                        const startStop = selectedFrame.styles?.backgroundGradientStartStop ?? 0
                                        const endStop = selectedFrame.styles?.backgroundGradientEndStop ?? 100

                                        // Determine which handle is closer
                                        const distToStart = Math.abs(percent - startStop)
                                        const distToEnd = Math.abs(percent - endStop)

                                        if (distToStart < distToEnd) {
                                          setDraggingGradientHandle('start')
                                          updateFrameStyle('backgroundGradientStartStop', Math.round(Math.min(percent, endStop)))
                                        } else {
                                          setDraggingGradientHandle('end')
                                          updateFrameStyle('backgroundGradientEndStop', Math.round(Math.max(percent, startStop)))
                                        }
                                      }}
                                    >
                                      {/* Track */}
                                      <div className="absolute top-1/2 left-0 right-0 h-2 bg-muted rounded-lg -translate-y-1/2" />

                                      {/* Active range */}
                                      <div
                                        className="absolute top-1/2 h-2 bg-primary/30 rounded-lg -translate-y-1/2"
                                        style={{
                                          left: `${selectedFrame?.styles?.backgroundGradientStartStop ?? 0}%`,
                                          width: `${(selectedFrame?.styles?.backgroundGradientEndStop ?? 100) - (selectedFrame?.styles?.backgroundGradientStartStop ?? 0)}%`,
                                        }}
                                      />

                                      {/* Start handle */}
                                      <div
                                        className="absolute top-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full cursor-grab active:cursor-grabbing -translate-x-1/2 -translate-y-1/2 z-10"
                                        style={{
                                          left: `${selectedFrame?.styles?.backgroundGradientStartStop ?? 0}%`,
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setDraggingGradientHandle('start')
                                        }}
                                      />

                                      {/* End handle */}
                                      <div
                                        className="absolute top-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full cursor-grab active:cursor-grabbing -translate-x-1/2 -translate-y-1/2 z-10"
                                        style={{
                                          left: `${selectedFrame?.styles?.backgroundGradientEndStop ?? 100}%`,
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setDraggingGradientHandle('end')
                                        }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                      <span>Start: {selectedFrame?.styles?.backgroundGradientStartStop ?? 0}%</span>
                                      <span>End: {selectedFrame?.styles?.backgroundGradientEndStop ?? 100}%</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Mayvn AI */}
                              {selectedFrame?.styles?.backgroundType === "ai" && (
                                <div className="space-y-3 w-full">
                                  <div className="w-full">
                                    <label className="text-xs text-muted-foreground mb-2 block">Enter your prompt</label>
                                    <Textarea
                                      placeholder="Describe the background you want..."
                                      className="min-h-[100px] text-sm resize-none w-full"
                                      value={aiPromptInput}
                                      onChange={(e) => setAIPromptInput(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2 w-full">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 min-w-0"
                                      onClick={() => generateSimplePrompt(aiPromptInput)}
                                      disabled={generatingAIPrompt || !aiPromptInput.trim()}
                                    >
                                      {generatingAIPrompt ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                                      ) : null}
                                      <span className="truncate">Simple Prompt</span>
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="flex-1 min-w-0"
                                      onClick={() => generateMagicPrompt(aiPromptInput)}
                                      disabled={generatingAIPrompt || !aiPromptInput.trim()}
                                    >
                                      {generatingAIPrompt ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                                      ) : (
                                        <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                                      )}
                                      <span className="truncate">Magic Prompt</span>
                                    </Button>
                                  </div>
                                  {selectedFrame?.styles?.backgroundAIPrompt && (
                                    <div className="mt-3 p-3 bg-muted rounded-lg w-full overflow-hidden">
                                      <label className="text-xs text-muted-foreground mb-1 block">Generated Prompt:</label>
                                      <div className="max-h-[200px] overflow-y-auto w-full">
                                        <p className="text-sm text-foreground whitespace-pre-wrap break-words overflow-wrap-anywhere w-full">
                                          {selectedFrame.styles.backgroundAIPrompt}
                                        </p>
                                      </div>
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="flex-1"
                                          onClick={() => {
                                            navigator.clipboard.writeText(selectedFrame.styles.backgroundAIPrompt || "")
                                            alert("Prompt copied to clipboard!")
                                          }}
                                        >
                                          Copy Prompt
                                        </Button>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          className="flex-1"
                                          onClick={generateImage}
                                          disabled={isGeneratingImage}
                                        >
                                          {isGeneratingImage ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <ImageIcon className="w-4 h-4 mr-2" />
                                              Generate Image
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Image */}
                              {selectedFrame?.styles?.backgroundType === "image" && (
                                <div>
                                  <label className="text-xs text-muted-foreground mb-2 block">Background Image</label>
                                  {selectedFrame?.styles?.backgroundImage ? (
                                    <div className="space-y-2">
                                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                                        <Image
                                          src={selectedFrame.styles.backgroundImage}
                                          alt="Background"
                                          fill
                                          className="object-cover"
                                        />
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="absolute top-2 right-2"
                                          onClick={() => updateFrameStyle('backgroundImage', '')}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <input
                                        id="background-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e, 'backgroundImage')}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full cursor-pointer"
                                        onClick={() => document.getElementById('background-image-upload')?.click()}
                                      >
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Change Image
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <input
                                        id="background-image-upload-empty"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e, 'backgroundImage')}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full cursor-pointer"
                                        onClick={() => document.getElementById('background-image-upload-empty')?.click()}
                                      >
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Upload Image
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}

                            </div>
                          )}
                        </div>

                        <HeaderSection
                          frame={selectedFrame!}
                          isExpanded={expandedSections.header}
                          onToggle={() => toggleSection("header")}
                          onVisibilityToggle={() =>
                            updateFrameStyle("headerVisible", !(selectedFrame?.styles?.headerVisible !== false))
                          }
                          updateFrameStyle={updateFrameStyle}
                        />

                        <SubtextSection
                          frame={selectedFrame!}
                          isExpanded={expandedSections.subtext}
                          onToggle={() => toggleSection("subtext")}
                          onVisibilityToggle={() =>
                            updateFrameStyle("subtextVisible", !(selectedFrame?.styles?.subtextVisible !== false))
                          }
                          updateFrameStyle={updateFrameStyle}
                        />

                        {/* CTA Section */}
                        <div className="space-y-4">
                          <button
                            onClick={() => toggleSection('cta')}
                            className="flex items-center justify-between w-full gap-2 pb-2 border-b border-border/50 hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-2">
                              <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                              <h3 className="text-sm font-semibold">Call to Action</h3>
                            </div>
                            {expandedSections.cta ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          {expandedSections.cta && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Button Text</label>
                                <Input
                                  type="text"
                                  placeholder="Learn More"
                                  className="text-sm"
                                  value={selectedFrame?.styles?.ctaText || ""}
                                  onChange={(e) => updateFrameStyle('ctaText', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Button Color</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    className="w-12 h-10 rounded border border-border cursor-pointer"
                                    value={selectedFrame?.styles?.ctaButtonColor || "#3b82f6"}
                                    onChange={(e) => updateFrameStyle('ctaButtonColor', e.target.value)}
                                  />
                                  <Input
                                    type="text"
                                    placeholder="#3b82f6"
                                    className="flex-1 text-sm"
                                    value={selectedFrame?.styles?.ctaButtonColor || "#3b82f6"}
                                    onChange={(e) => updateFrameStyle('ctaButtonColor', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Text Color</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    className="w-12 h-10 rounded border border-border cursor-pointer"
                                    value={selectedFrame?.styles?.ctaTextColor || "#ffffff"}
                                    onChange={(e) => updateFrameStyle('ctaTextColor', e.target.value)}
                                  />
                                  <Input
                                    type="text"
                                    placeholder="#ffffff"
                                    className="flex-1 text-sm"
                                    value={selectedFrame?.styles?.ctaTextColor || "#ffffff"}
                                    onChange={(e) => updateFrameStyle('ctaTextColor', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Link URL</label>
                                <Input
                                  type="url"
                                  placeholder="https://example.com"
                                  className="text-sm"
                                  value={selectedFrame?.styles?.ctaLink || ""}
                                  onChange={(e) => updateFrameStyle('ctaLink', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Position Offset (px)</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Offset X</label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      className="text-sm"
                                      value={selectedFrame?.styles?.ctaOffsetX ?? 0}
                                      onChange={(e) => updateFrameStyle('ctaOffsetX', parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Offset Y</label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      className="text-sm"
                                      value={selectedFrame?.styles?.ctaOffsetY ?? 0}
                                      onChange={(e) => updateFrameStyle('ctaOffsetY', parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Logo Section */}
                        <div className="space-y-4">
                          <button
                            onClick={() => toggleSection('logo')}
                            className="flex items-center justify-between w-full gap-2 pb-2 border-b border-border/50 hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-2">
                              {selectedFrame?.styles?.logoVisible !== false ? (
                                <Eye className="w-4 h-4 text-muted-foreground" onClick={(e) => { e.stopPropagation(); updateFrameStyle('logoVisible', false) }} />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" onClick={(e) => { e.stopPropagation(); updateFrameStyle('logoVisible', true) }} />
                              )}
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                              <h3 className="text-sm font-semibold">Logo</h3>
                            </div>
                            {expandedSections.logo ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          {expandedSections.logo && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Logo Image</label>
                                <Select
                                  value={selectedFrame?.styles?.logoImage === selectedBrand?.logo?.logo ? 'brand-logo' : selectedFrame?.styles?.logoImage === selectedBrand?.logo?.logo_small ? 'brand-logo-small' : selectedFrame?.styles?.logoImage ? 'custom' : 'none'}
                                  onValueChange={(value) => {
                                    if (value === 'brand-logo') {
                                      updateFrameStyle('logoImage', selectedBrand?.logo?.logo)
                                    } else if (value === 'brand-logo-small') {
                                      updateFrameStyle('logoImage', selectedBrand?.logo?.logo_small)
                                    } else if (value === 'custom') {
                                      // Keep custom logo if already set, otherwise trigger upload
                                      if (!selectedFrame?.styles?.logoImage) {
                                        document.getElementById('logo-image-upload')?.click()
                                      }
                                    } else {
                                      updateFrameStyle('logoImage', undefined)
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full text-sm">
                                    <SelectValue placeholder="Select logo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedBrand?.logo?.logo && (
                                      <SelectItem value="brand-logo">
                                        Brand Logo (Full)
                                      </SelectItem>
                                    )}
                                    {selectedBrand?.logo?.logo_small && (
                                      <SelectItem value="brand-logo-small">
                                        Brand Logo (Small)
                                      </SelectItem>
                                    )}
                                    <SelectItem value="custom">
                                      Upload Custom Logo
                                    </SelectItem>
                                    <SelectItem value="none">No Logo</SelectItem>
                                  </SelectContent>
                                </Select>
                                <input
                                  type="file"
                                  id="logo-image-upload"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(e, 'logoImage')}
                                />
                                {selectedFrame?.styles?.logoImage && (
                                  <div className="space-y-2 mt-2">
                                    <div className="relative w-full h-32 border border-border rounded-lg overflow-hidden bg-muted/50">
                                      <img
                                        src={selectedFrame.styles.logoImage}
                                        alt="Logo preview"
                                        className="w-full h-full object-contain p-2"
                                      />
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => updateFrameStyle('logoImage', undefined)}
                                    >
                                      Remove Logo
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Position</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    variant={selectedFrame?.styles?.logoPosition === 'top-left' ? 'default' : 'outline'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => updateFrameStyle('logoPosition', 'top-left')}
                                  >
                                    Top Left
                                  </Button>
                                  <Button
                                    variant={selectedFrame?.styles?.logoPosition === 'top-right' ? 'default' : 'outline'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => updateFrameStyle('logoPosition', 'top-right')}
                                  >
                                    Top Right
                                  </Button>
                                  <Button
                                    variant={selectedFrame?.styles?.logoPosition === 'bottom-left' ? 'default' : 'outline'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => updateFrameStyle('logoPosition', 'bottom-left')}
                                  >
                                    Bottom Left
                                  </Button>
                                  <Button
                                    variant={selectedFrame?.styles?.logoPosition === 'bottom-right' ? 'default' : 'outline'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => updateFrameStyle('logoPosition', 'bottom-right')}
                                  >
                                    Bottom Right
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">
                                  Opacity: {Math.round((selectedFrame?.styles?.logoOpacity ?? 1) * 100)}%
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                  value={selectedFrame?.styles?.logoOpacity ?? 1}
                                  onChange={(e) => updateFrameStyle('logoOpacity', parseFloat(e.target.value))}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Floating Chat Panel */}
        {isChatOpen && (
          <div className="absolute bottom-4 right-4 w-96 h-[500px] border border-border/50 bg-card rounded-lg shadow-xl flex flex-col z-50">
            <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">AI Assistant</h2>
                <p className="text-xs text-muted-foreground">Get help creating your post</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-xs">
                    <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Start a conversation to get help with your post
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            <div className="border-t border-border/50 p-4">
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for help..."
                  className="min-h-[60px] max-h-[120px] resize-none text-sm"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  size="sm"
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const visiblePosts = posts.filter((p) => p.status !== "draft")

  // List View
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Sidebar />
      <main className="md:ml-52 md:w-[calc(100%-13rem)] w-full px-4 md:px-6 pt-16 md:pt-20 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Post Generator</h1>
                <p className="text-muted-foreground">
                  Create and edit Instagram posts for {selectedBrand.brand_name}
                </p>
              </div>
              <Button
                onClick={handleCreatePost}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Post
              </Button>
            </div>
          </div>

          {/* Draft Projects */}
          {savedProjects.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Draft projects
                </h2>
                <span className="text-xs text-muted-foreground">
                  {savedProjects.length}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {savedProjects.slice().reverse().map((project) => (
                  <Card
                    key={project.id}
                    className="p-4 border-border/50 bg-card/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium truncate">
                          {project.title}
                        </h3>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {project.frames.length} frame{project.frames.length === 1 ? "" : "s"}
                      </p>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            setCurrentProjectId(project.id)
                            setCurrentProjectTitle(project.title)
                            const restoredFrames: Frame[] = (project.frames as StoredFrame[]).map((sf) => {
                              const type = frameTypes.find(ft => ft.id === sf.typeId) || frameTypes[0]
                              return {
                                id: sf.id,
                                type,
                                x: sf.x,
                                y: sf.y,
                                name: sf.name,
                                content: sf.content,
                                styles: sf.styles,
                                connections: sf.connections,
                              }
                            })
                            setFrames(restoredFrames)
                            setIsEditorOpen(true)
                          }}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Posts List (exclude drafts shown above) */}
          {visiblePosts.length === 0 && savedProjects.length === 0 ? (
            <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Posts Yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Get started by creating your first post
                  </p>
                  <Button
                    onClick={handleCreatePost}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Post
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <Card
                  key={post.id}
                  className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-6">
                    {/* Post Image/Preview */}
                    <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border/50 overflow-hidden">
                      {post.image ? (
                        <Image
                          src={post.image}
                          alt={post.title}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Post Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {post.caption}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${post.status === "published"
                              ? "bg-green-500/10 text-green-500"
                              : post.status === "scheduled"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-gray-500/10 text-gray-500"
                              }`}
                          >
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Created {post.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        {post.scheduledFor && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              Scheduled for {post.scheduledFor.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={(open) => {
        setIsNewProjectModalOpen(open)
        if (!open && !isEditorOpen) {
          // If modal closed without opening editor, reset new project name
          setNewProjectName("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name your project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Project name</label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Diwali offer Instagram post"
                autoFocus
              />
            </div>
            {savedProjects.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Recent drafts
                </div>
                <div className="max-h-40 overflow-auto space-y-1">
                  {savedProjects.slice().reverse().map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setCurrentProjectId(project.id)
                        setCurrentProjectTitle(project.title)
                        const restoredFrames: Frame[] = (project.frames as StoredFrame[]).map((sf) => {
                          const type = frameTypes.find(ft => ft.id === sf.typeId) || frameTypes[0]
                          return {
                            id: sf.id,
                            type,
                            x: sf.x,
                            y: sf.y,
                            name: sf.name,
                            content: sf.content,
                            styles: sf.styles,
                            connections: sf.connections,
                          }
                        })
                        setFrames(restoredFrames)
                        setIsNewProjectModalOpen(false)
                        setIsEditorOpen(true)
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-xs flex items-center justify-between"
                    >
                      <span className="truncate max-w-[70%]">{project.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewProjectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setCurrentProjectTitle(newProjectName.trim())
                  setIsNewProjectModalOpen(false)
                  setIsEditorOpen(true)
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

