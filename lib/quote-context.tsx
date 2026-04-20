"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface QuoteItem {
  id: string
  productSku: string
  productName: string
  colour: string
  size: string
  quantity: number
  image?: string
}

export interface QuoteContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  jobTitle: string
}

export interface QuoteProjectInfo {
  eventName: string
  eventDate: string
  budget: string
  notes: string
}

interface QuoteContextType {
  items: QuoteItem[]
  contactInfo: QuoteContactInfo
  projectInfo: QuoteProjectInfo
  addItem: (item: Omit<QuoteItem, "id">) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<QuoteItem>) => void
  clearItems: () => void
  setContactInfo: (info: Partial<QuoteContactInfo>) => void
  setProjectInfo: (info: Partial<QuoteProjectInfo>) => void
  isLoaded: boolean
}

const defaultContactInfo: QuoteContactInfo = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
}

const defaultProjectInfo: QuoteProjectInfo = {
  eventName: "",
  eventDate: "",
  budget: "",
  notes: "",
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined)

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([])
  const [contactInfo, setContactInfoState] = useState<QuoteContactInfo>(defaultContactInfo)
  const [projectInfo, setProjectInfoState] = useState<QuoteProjectInfo>(defaultProjectInfo)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem("promoshop_quote_items")
      const savedContact = localStorage.getItem("promoshop_quote_contact")
      const savedProject = localStorage.getItem("promoshop_quote_project")

      if (savedItems) setItems(JSON.parse(savedItems))
      if (savedContact) setContactInfoState(JSON.parse(savedContact))
      if (savedProject) setProjectInfoState(JSON.parse(savedProject))
    } catch (e) {
      console.error("Error loading quote from localStorage:", e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("promoshop_quote_items", JSON.stringify(items))
  }, [items, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("promoshop_quote_contact", JSON.stringify(contactInfo))
  }, [contactInfo, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("promoshop_quote_project", JSON.stringify(projectInfo))
  }, [projectInfo, isLoaded])

  const addItem = (item: Omit<QuoteItem, "id">) => {
    const newItem: QuoteItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    setItems((prev) => [...prev, newItem])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const clearItems = () => {
    setItems([])
  }

  const setContactInfo = (info: Partial<QuoteContactInfo>) => {
    setContactInfoState((prev) => ({ ...prev, ...info }))
  }

  const setProjectInfo = (info: Partial<QuoteProjectInfo>) => {
    setProjectInfoState((prev) => ({ ...prev, ...info }))
  }

  return (
    <QuoteContext.Provider
      value={{
        items,
        contactInfo,
        projectInfo,
        addItem,
        removeItem,
        updateItem,
        clearItems,
        setContactInfo,
        setProjectInfo,
        isLoaded,
      }}
    >
      {children}
    </QuoteContext.Provider>
  )
}

export function useQuote() {
  const context = useContext(QuoteContext)
  if (context === undefined) {
    throw new Error("useQuote must be used within a QuoteProvider")
  }
  return context
}
