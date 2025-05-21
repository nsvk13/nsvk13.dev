"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

interface SkillCategory {
  name: string
  skills: {
    name: string
    level?: number // 1-5 or 0-100
    description?: string
  }[]
}

interface SkillsAccordionProps {
  categories: SkillCategory[]
}

export default function SkillsAccordion({ categories }: SkillsAccordionProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    categories.reduce(
      (acc, category) => {
        acc[category.name] = false
        return acc
      },
      {} as Record<string, boolean>,
    ),
  )

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }))
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.name} className="ascii-frame">
          <button
            onClick={() => toggleCategory(category.name)}
            className="w-full p-4 text-left flex items-center justify-between hover:text-white transition-colors"
          >
            <span className="font-bold">{category.name}</span>
            {openCategories[category.name] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {openCategories[category.name] && (
            <div className="p-4 pt-0 border-t border-gold/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.skills.map((skill) => (
                  <div key={skill.name} className="py-1">
                    <div className="flex items-center justify-between">
                      <span>{skill.name}</span>
                      {skill.level && (
                        <div className="flex ml-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-xs ${i < skill.level! / 20 ? "text-gold" : "text-gold/30"}`}>
                              ■
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {skill.description && <p className="text-xs opacity-70 mt-1">{skill.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
