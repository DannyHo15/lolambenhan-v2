"use client"

import React, { useState } from "react"

type TabValue = "tutu" | "ckle" | "khac"

interface TabsContextValue {
  value: TabValue
  setValue: (value: TabValue) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within <Tabs>")
  }
  return context
}

interface TabsProps {
  defaultValue?: TabValue
  children: React.ReactNode
}

export function Tabs({ defaultValue = "tutu", children }: TabsProps) {
  const [value, setValue] = useState<TabValue>(defaultValue)

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  const { value, setValue } = useTabsContext()

  return (
    <div className="flex justify-center mb-8">
      <div
        className="inline-flex glass rounded-xl p-1.5 shadow-sm border"
        {...props}
      >
        <TabsTrigger value="tutu" onClick={() => setValue("tutu")} active={value === "tutu"}>
          Tứ trụ
        </TabsTrigger>
        <TabsTrigger value="ckle" onClick={() => setValue("ckle")} active={value === "ckle"}>
          CK lẻ
        </TabsTrigger>
        <TabsTrigger value="khac" onClick={() => setValue("khac")} active={value === "khac"}>
          Khác
        </TabsTrigger>
      </div>
    </div>
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: TabValue
  active: boolean
}

function TabsTrigger({ className, active, onClick, children, ...props }: TabsTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
        active
          ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      } ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: TabValue
  children: React.ReactNode
}

export function TabsContent({ value: tabValue, children }: TabsContentProps) {
  const { value } = useTabsContext()

  if (value !== tabValue) return null
  return <>{children}</>
}
