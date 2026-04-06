"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Lang = "ru" | "en"

const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
}>({ lang: "ru", setLang: () => {} })

const LANG_KEY = "ailnex_lang"

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru")

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null
    if (saved === "en" || saved === "ru") setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem(LANG_KEY, l)
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
