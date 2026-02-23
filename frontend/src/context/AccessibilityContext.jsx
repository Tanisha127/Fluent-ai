import React, { createContext, useContext, useState, useEffect } from 'react'

const AccessibilityContext = createContext(null)

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('a11y')
    return saved ? JSON.parse(saved) : {
      darkMode: false,
      largeText: false,
      dyslexicFont: false,
      highContrast: false,
      reducedMotion: false
    }
  })

  useEffect(() => {
    localStorage.setItem('a11y', JSON.stringify(settings))
    const root = document.documentElement
    root.classList.toggle('dark', settings.darkMode)
    root.classList.toggle('large-text', settings.largeText)
    root.classList.toggle('dyslexic-font', settings.dyslexicFont)
    root.classList.toggle('high-contrast', settings.highContrast)
  }, [settings])

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <AccessibilityContext.Provider value={{ settings, toggle }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = () => useContext(AccessibilityContext)
