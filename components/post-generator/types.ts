import type { ReactNode } from "react"

export type FrameType = {
  id: string
  name: string
  width: number
  height: number
  aspectRatio: string
  icon?: ReactNode
  platform?: string
}

export type FrameStyles = {
  backgroundType?: "solid" | "gradient" | "image" | "ai"
  backgroundAIPrompt?: string
  backgroundColor?: string
  backgroundGradientStart?: string
  backgroundGradientEnd?: string
  backgroundGradientType?: "linear" | "radial"
  backgroundGradientAngle?: number
  backgroundGradientStartStop?: number
  backgroundGradientEndStop?: number
  backgroundImage?: string
  headerText?: string
  headerFontSize?: number
  headerColor?: string
  headerGradientStart?: string
  headerGradientEnd?: string
  headerUseGradient?: boolean
  headerTextureOverlay?: boolean
  headerTextureOverlayOpacity?: number
  headerStrokeColor?: string
  headerStrokeWidth?: number
  headerTextShadowX?: number
  headerTextShadowY?: number
  headerTextShadowBlur?: number
  headerTextShadowColor?: string
  headerAlignment?: "left" | "center" | "right"
  headerFontFamily?: string
  headerLineHeight?: number
  headerOpacity?: number
  headerVisible?: boolean
  headerOffsetX?: number
  headerOffsetY?: number
  subtext?: string
  subtextFontSize?: number
  subtextColor?: string
  subtextGradientStart?: string
  subtextGradientEnd?: string
  subtextUseGradient?: boolean
  subtextTextureOverlay?: boolean
  subtextTextureOverlayOpacity?: number
  subtextStrokeColor?: string
  subtextStrokeWidth?: number
  subtextTextShadowX?: number
  subtextTextShadowY?: number
  subtextTextShadowBlur?: number
  subtextTextShadowColor?: string
  subtextLineHeight?: number
  subtextOpacity?: number
  subtextVisible?: boolean
  subtextAlignment?: "left" | "center" | "right"
  subtextFontFamily?: string
  subtextOffsetX?: number
  subtextOffsetY?: number
  ctaText?: string
  ctaButtonColor?: string
  ctaTextColor?: string
  ctaLink?: string
  ctaOffsetX?: number
  ctaOffsetY?: number
  captionVisible?: boolean
  captionText?: string
  logoImage?: string
  logoVisible?: boolean
  logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  logoOpacity?: number
}

export type Frame = {
  id: string
  type: FrameType
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

