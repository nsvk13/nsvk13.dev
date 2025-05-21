"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import GlitchText from "@/components/glitch-text"

const navItems = [
  { label: "ГЛАВНАЯ", href: "/" },
  { label: "ПРОЕКТЫ", href: "/projects" },
  { label: "БЛОГ", href: "/blog" },
  { label: "ОБО МНЕ", href: "/about" },
]

export default function Header() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled ? "bg-deep-black/80 backdrop-blur-md border-b border-neon-purple" : "bg-transparent",
      )}
    >
      <div className="container flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-neon-purple flex items-center justify-center font-press-start text-deep-black border-2 border-neon-pink group-hover:bg-neon-pink transition-colors">
            R
          </div>
          <GlitchText text="RETROWAVE" className="font-press-start text-sm hidden sm:inline-block text-neon-cyan" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-press-start transition-colors hover:text-neon-pink",
                pathname === item.href ? "text-neon-pink" : "text-neon-cyan",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-neon-cyan hover:text-neon-pink">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-deep-black border-neon-purple">
              <div className="flex flex-col gap-6 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-lg font-press-start transition-colors hover:text-neon-pink",
                      pathname === item.href ? "text-neon-pink" : "text-neon-cyan",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
