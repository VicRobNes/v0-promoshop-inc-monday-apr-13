"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface ProductLightboxProps {
  isOpen: boolean
  images: string[]
  initialIndex: number
  title: string
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function ProductLightbox({
  isOpen,
  images,
  initialIndex,
  title,
  onClose,
  onIndexChange,
}: ProductLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (isOpen) setIndex(initialIndex)
  }, [initialIndex, isOpen])

  const goPrev = useCallback(() => {
    setIndex((i) => {
      const next = (i - 1 + images.length) % images.length
      onIndexChange(next)
      return next
    })
  }, [images.length, onIndexChange])

  const goNext = useCallback(() => {
    setIndex((i) => {
      const next = (i + 1) % images.length
      onIndexChange(next)
      return next
    })
  }, [images.length, onIndexChange])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose, goPrev, goNext])

  if (!isOpen || images.length === 0) return null

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) {
      if (delta > 0) goPrev()
      else goNext()
    }
    touchStartX.current = null
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between p-4 text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-bold uppercase tracking-wider truncate">{title}</p>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold tracking-wider text-white/70">
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close full-screen view"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ea4a3f] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div
        className="flex-1 relative flex items-center justify-center p-4 md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-w-5xl">
          <Image
            key={images[index]}
            src={images[index]}
            alt={`${title} (${index + 1}/${images.length})`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
