"use client"

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"
import { useAuth } from "./AuthContext"
import { getUserBrands, BrandData } from "@/lib/userService"

interface BrandContextType {
  brands: BrandData[]
  selectedBrand: BrandData | null
  selectedBrandId: string | null
  loading: boolean
  setSelectedBrandId: (brandId: string | null) => void
  refreshBrands: () => Promise<void>
}

const BrandContext = createContext<BrandContextType>({
  brands: [],
  selectedBrand: null,
  selectedBrandId: null,
  loading: true,
  setSelectedBrandId: () => {},
  refreshBrands: async () => {},
})

export const useBrand = () => useContext(BrandContext)

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [brands, setBrands] = useState<BrandData[]>([])
  const [selectedBrandId, setSelectedBrandIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load brands when user changes
  useEffect(() => {
    const loadBrands = async () => {
      if (!user) {
        setBrands([])
        setSelectedBrandIdState(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const userBrands = await getUserBrands(user.uid)
        setBrands(userBrands)

        // Get selected brand from localStorage or select first brand
        if (typeof window !== 'undefined') {
          const storedBrandId = localStorage.getItem(`selectedBrandId_${user.uid}`)
          if (storedBrandId && userBrands.some(b => b.id === storedBrandId)) {
            setSelectedBrandIdState(storedBrandId)
          } else if (userBrands.length > 0) {
            // Select first brand by default
            const firstBrandId = userBrands[0].id || '0'
            setSelectedBrandIdState(firstBrandId)
            localStorage.setItem(`selectedBrandId_${user.uid}`, firstBrandId)
          }
        }
      } catch (error) {
        console.error("Error loading brands:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBrands()
  }, [user])

  const setSelectedBrandId = useCallback((brandId: string | null) => {
    setSelectedBrandIdState(brandId)
    if (user && typeof window !== 'undefined') {
      if (brandId) {
        localStorage.setItem(`selectedBrandId_${user.uid}`, brandId)
      } else {
        localStorage.removeItem(`selectedBrandId_${user.uid}`)
      }
    }
  }, [user])

  const refreshBrands = useCallback(async () => {
    if (!user) return
    try {
      const userBrands = await getUserBrands(user.uid)
      setBrands(userBrands)
      
      // If current selected brand doesn't exist, select first one
      setSelectedBrandIdState((currentId) => {
        if (currentId && !userBrands.some(b => b.id === currentId)) {
          if (userBrands.length > 0) {
            const firstBrandId = userBrands[0].id || '0'
            if (typeof window !== 'undefined') {
              localStorage.setItem(`selectedBrandId_${user.uid}`, firstBrandId)
            }
            return firstBrandId
          } else {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`selectedBrandId_${user.uid}`)
            }
            return null
          }
        }
        return currentId
      })
    } catch (error) {
      console.error("Error refreshing brands:", error)
    }
  }, [user])

  const selectedBrand = useMemo(() => {
    return brands.find(b => b.id === selectedBrandId) || null
  }, [brands, selectedBrandId])

  const value = useMemo(() => ({
    brands,
    selectedBrand,
    selectedBrandId,
    loading,
    setSelectedBrandId,
    refreshBrands,
  }), [brands, selectedBrand, selectedBrandId, loading, setSelectedBrandId, refreshBrands])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

