"use client"

import { useEffect, useState } from "react"

interface Site {
  id: number
  name: string
  url: string
  favicon: string | null
}

interface SiteData {
  prev: Site
  curr: Site
  next: Site
}

export default function Webring() {
  const [data, setData] = useState<SiteData | null>(null)

  useEffect(() => {
    fetch("https://webring.otomir23.me/41/data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
  }, [])

  const renderLink = (site: Site) => (
    <a
      key={site.id}
      href={site.url}
      className="ascii-link flex items-center"
      target="_blank"
      rel="noopener noreferrer"
    >
      {site.favicon && (
        <img
          src={site.favicon}
          alt=""
          width={16}
          height={16}
          className="mr-1 shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none"
          }}
        />
      )}
      <span>{site.name}</span>
    </a>
  )

  if (!data) {
    return (
      <div className="mt-2 flex justify-center gap-2">
        <a href="https://webring.otomir23.me/41/prev" className="ascii-link">
          prev
        </a>
        <span>webring</span>
        <a href="https://webring.otomir23.me/41/next" className="ascii-link">
          next
        </a>
      </div>
    )
  }

  return (
    <div className="mt-2 flex justify-center gap-4">
      {renderLink(data.prev)}
      <span>webring</span>
      {renderLink(data.next)}
    </div>
  )
}
