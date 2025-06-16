"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

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
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {
        setData(null)
      })
  }, [])

  if (!data) {
    return (
      <div className="mt-2 flex justify-center gap-2">
        <a
          href="https://webring.otomir23.me/41/prev"
          className="ascii-link"
        >
          prev
        </a>
        <span>webring</span>
        <a
          href="https://webring.otomir23.me/41/next"
          className="ascii-link"
        >
          next
        </a>
      </div>
    )
  }

  return (
    <div className="mt-2 flex justify-center gap-4">
      <a href={data.prev.url} className="ascii-link flex items-center">
        {data.prev.favicon && (
          <Image
            src={data.prev.favicon}
            alt={data.prev.name}
            width={16}
            height={16}
            className="mr-1"
          />
        )}
        <span>{data.prev.name}</span>
      </a>
      <span>webring</span>
      <a href={data.next.url} className="ascii-link flex items-center">
        {data.next.favicon && (
          <Image
            src={data.next.favicon}
            alt={data.next.name}
            width={16}
            height={16}
            className="mr-1"
          />
        )}
        <span>{data.next.name}</span>
      </a>
    </div>
  )
}
