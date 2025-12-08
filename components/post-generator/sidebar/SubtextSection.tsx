import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Frame } from "@/components/post-generator/types"
import { Eye, EyeOff, Type, ChevronDown, ChevronUp } from "lucide-react"

type SubtextSectionProps = {
  frame: Frame
  isExpanded: boolean
  onToggle: () => void
  onVisibilityToggle: () => void
  updateFrameStyle: (key: keyof Frame["styles"], value: any) => void
}

const SubtextSection = ({
  frame,
  isExpanded,
  onToggle,
  onVisibilityToggle,
  updateFrameStyle,
}: SubtextSectionProps) => {
  const styles = frame.styles || {}
  const isVisible = styles.subtextVisible !== false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between w-full gap-2 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 flex-1">
          <Type className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Subtext</h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onVisibilityToggle()
            }}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <button onClick={onToggle} className="hover:opacity-80 transition-opacity">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Subtext</label>
            <Textarea
              placeholder="Enter subtext..."
              className="min-h-[100px] text-sm"
              value={styles.subtext || ""}
              onChange={(e) => updateFrameStyle("subtext", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Font Size</label>
            <Input
              type="number"
              placeholder="16"
              className="text-sm"
              value={styles.subtextFontSize || 16}
              onChange={(e) => updateFrameStyle("subtextFontSize", parseInt(e.target.value) || 16)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Offset X (px)</label>
              <Input
                type="number"
                placeholder="0"
                className="text-sm"
                value={styles.subtextOffsetX ?? 0}
                onChange={(e) => updateFrameStyle("subtextOffsetX", parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Offset Y (px)</label>
              <Input
                type="number"
                placeholder="0"
                className="text-sm"
                value={styles.subtextOffsetY ?? 0}
                onChange={(e) => updateFrameStyle("subtextOffsetY", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Font Family</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={styles.subtextFontFamily || "inherit"}
              onChange={(e) => updateFrameStyle("subtextFontFamily", e.target.value)}
            >
              <option value="inherit">Default</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              <option value="Impact, sans-serif">Impact</option>
              <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
              <option value="'Lato', sans-serif">Lato</option>
              <option value="'Poppins', sans-serif">Poppins</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Oswald', sans-serif">Oswald</option>
              <option value="'Allura', cursive">Allura (Cursive)</option>
              <option value="'Dancing Script', cursive">Dancing Script (Cursive)</option>
              <option value="'Great Vibes', cursive">Great Vibes (Cursive)</option>
              <option value="'Pacifico', cursive">Pacifico (Cursive)</option>
              <option value="'Satisfy', cursive">Satisfy (Cursive)</option>
              <option value="'Brush Script MT', cursive">Brush Script MT (Cursive)</option>
              <option value="'Blackletter', fantasy">Blackletter (Gothic)</option>
              <option value="'Old English Text MT', serif">Old English Text MT (Gothic)</option>
              <option value="'UnifrakturMaguntia', cursive">Unifraktur Maguntia (Gothic)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Alignment</label>
            <div className="flex gap-2">
              <Button
                variant={styles.subtextAlignment === "left" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => updateFrameStyle("subtextAlignment", "left")}
              >
                Left
              </Button>
              <Button
                variant={styles.subtextAlignment === "center" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => updateFrameStyle("subtextAlignment", "center")}
              >
                Center
              </Button>
              <Button
                variant={styles.subtextAlignment === "right" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => updateFrameStyle("subtextAlignment", "right")}
              >
                Right
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Text Color</label>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant={styles.subtextUseGradient ? "outline" : "default"}
                size="sm"
                className="flex-1"
                onClick={() => updateFrameStyle("subtextUseGradient", false)}
              >
                Solid
              </Button>
              <Button
                variant={styles.subtextUseGradient ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => updateFrameStyle("subtextUseGradient", true)}
              >
                Gradient
              </Button>
            </div>
            {styles.subtextUseGradient ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-12 h-10 rounded border border-border cursor-pointer"
                    value={styles.subtextGradientStart || "#3b82f6"}
                    onChange={(e) => updateFrameStyle("subtextGradientStart", e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="#3b82f6"
                    className="flex-1 text-sm"
                    value={styles.subtextGradientStart || "#3b82f6"}
                    onChange={(e) => updateFrameStyle("subtextGradientStart", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-12 h-10 rounded border border-border cursor-pointer"
                    value={styles.subtextGradientEnd || "#8b5cf6"}
                    onChange={(e) => updateFrameStyle("subtextGradientEnd", e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="#8b5cf6"
                    className="flex-1 text-sm"
                    value={styles.subtextGradientEnd || "#8b5cf6"}
                    onChange={(e) => updateFrameStyle("subtextGradientEnd", e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-12 h-10 rounded border border-border cursor-pointer"
                  value={styles.subtextColor || "#666666"}
                  onChange={(e) => updateFrameStyle("subtextColor", e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="#666666"
                  className="flex-1 text-sm"
                  value={styles.subtextColor || "#666666"}
                  onChange={(e) => updateFrameStyle("subtextColor", e.target.value)}
                />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Texture Overlay</label>
            <Button
              variant={styles.subtextTextureOverlay ? "default" : "outline"}
              size="sm"
              className="w-full mb-2"
              onClick={() => updateFrameStyle("subtextTextureOverlay", !styles.subtextTextureOverlay)}
            >
              {styles.subtextTextureOverlay ? "Disable Texture Overlay" : "Enable Texture Overlay"}
            </Button>
            {styles.subtextTextureOverlay && (
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Opacity: {Math.round((styles.subtextTextureOverlayOpacity ?? 1) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  value={styles.subtextTextureOverlayOpacity ?? 1}
                  onChange={(e) => updateFrameStyle("subtextTextureOverlayOpacity", parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Stroke</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-12 h-10 rounded border border-border cursor-pointer"
                  value={styles.subtextStrokeColor || "#000000"}
                  onChange={(e) => updateFrameStyle("subtextStrokeColor", e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="#000000"
                  className="flex-1 text-sm"
                  value={styles.subtextStrokeColor || "#000000"}
                  onChange={(e) => updateFrameStyle("subtextStrokeColor", e.target.value)}
                />
              </div>
              <Input
                type="number"
                placeholder="0"
                min="0"
                max="10"
                step="0.5"
                className="text-sm"
                value={styles.subtextStrokeWidth || 0}
                onChange={(e) => updateFrameStyle("subtextStrokeWidth", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Text Shadow</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-12">X:</label>
                <Input
                  type="number"
                  placeholder="0"
                  step="1"
                  className="flex-1 text-sm"
                  value={styles.subtextTextShadowX ?? ""}
                  onChange={(e) =>
                    updateFrameStyle(
                      "subtextTextShadowX",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-12">Y:</label>
                <Input
                  type="number"
                  placeholder="0"
                  step="1"
                  className="flex-1 text-sm"
                  value={styles.subtextTextShadowY ?? ""}
                  onChange={(e) =>
                    updateFrameStyle(
                      "subtextTextShadowY",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-12">Blur:</label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="1"
                  className="flex-1 text-sm"
                  value={styles.subtextTextShadowBlur ?? ""}
                  onChange={(e) =>
                    updateFrameStyle(
                      "subtextTextShadowBlur",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-12">Color:</label>
                <input
                  type="color"
                  className="w-12 h-10 rounded border border-border cursor-pointer"
                  value={styles.subtextTextShadowColor || "#000000"}
                  onChange={(e) => updateFrameStyle("subtextTextShadowColor", e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="#000000"
                  className="flex-1 text-sm"
                  value={styles.subtextTextShadowColor || "#000000"}
                  onChange={(e) => updateFrameStyle("subtextTextShadowColor", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Line Height</label>
            <Input
              type="number"
              placeholder="1.5"
              step="0.1"
              className="text-sm"
              value={styles.subtextLineHeight || 1.5}
              onChange={(e) => updateFrameStyle("subtextLineHeight", parseFloat(e.target.value) || 1.5)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              Text Opacity: {Math.round((styles.subtextOpacity ?? 1) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              value={styles.subtextOpacity ?? 1}
              onChange={(e) => updateFrameStyle("subtextOpacity", parseFloat(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SubtextSection

