"use client"

import { useState, memo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useBrand } from "@/contexts/BrandContext"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Plus, Check, Loader2 } from "lucide-react"
import Image from "next/image"

function BrandSwitcherContent() {
  const { brands, selectedBrand, selectedBrandId, setSelectedBrandId, loading } = useBrand()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleBrandChange = useCallback((brandId: string) => {
    if (brandId === "new") {
      setIsNavigating(true)
      router.push("/brand-dna")
    } else {
      setSelectedBrandId(brandId)
    }
  }, [router, setSelectedBrandId])

  if (loading) {
    return (
      <div className="rounded-xl bg-muted/50 flex items-center justify-center gap-2.5 p-5 min-h-[80px]">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading brands...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {brands.length === 0 ? (
        <Button
          onClick={() => handleBrandChange("new")}
          variant="outline"
          className="w-full justify-center gap-2.5 h-auto py-5 px-4 border-2 border-dashed hover:border-solid hover:bg-muted/50 transition-all text-sm"
          disabled={isNavigating}
        >
          <Plus className="w-5 h-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">Add Your First Brand</span>
            <span className="text-xs text-muted-foreground">Get started by adding a brand</span>
          </div>
        </Button>
      ) : (
        <Select
          value={selectedBrandId || undefined}
          onValueChange={handleBrandChange}
          disabled={isNavigating}
        >
          <SelectTrigger className="w-full !bg-background h-auto py-6 px-4 border-2 hover:!bg-muted hover:border-muted-foreground/20 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border text-sm">
            <SelectValue placeholder="Select a brand">
                        {selectedBrand && (
                      <div className="flex items-center gap-2.5 w-full">
                        {selectedBrand.logo?.logo_small || selectedBrand.logo?.logo ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border/50 shadow-sm">
                            <Image
                              src={selectedBrand.logo.logo_small || selectedBrand.logo.logo}
                              alt={selectedBrand.brand_name}
                              width={40}
                              height={40}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 border border-border/50">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col items-start flex-1 min-w-0 text-left">
                          <span className="text-lg font-semibold truncate w-full text-left">{selectedBrand.brand_name}</span>
                          {selectedBrand.tagline && (
                            <span className="text-xs text-muted-foreground truncate w-full text-left">{selectedBrand.tagline}</span>
                          )}
                        </div>
                      </div>
                    )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id || ""} className="py-2.5">
                      <div className="flex items-center gap-2.5 w-full">
                        {brand.logo?.logo || brand.logo?.logo_small ? (
                          <div className="w-7 h-7 rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border/50">
                            <Image
                              src={brand.logo.logo || brand.logo.logo_small}
                              alt={brand.brand_name}
                              width={28}
                              height={28}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="text-sm font-medium truncate w-full">{brand.brand_name}</span>
                          {brand.tagline && (
                            <span className="text-xs text-muted-foreground truncate w-full">{brand.tagline}</span>
                          )}
                        </div>
                        {selectedBrandId === brand.id && (
                          <Check className="w-4 h-4 ml-auto text-primary flex-shrink-0" />
                        )}
                      </div>
                    </SelectItem>
            ))}
            <SelectItem value="new" className="py-2.5 border-t border-border/50 mt-1">
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4" />
                <span className="font-medium text-sm">Add New Brand</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

export const BrandSwitcher = memo(BrandSwitcherContent)

