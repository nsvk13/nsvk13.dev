"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Github, Twitter, Mail, Linkedin, FileText, Code, Terminal, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const [typedText, setTypedText] = useState("")
  const fullText = "Nikita Simakin"
  const [showCursor, setShowCursor] = useState(true)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Typing animation
    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.substring(0, typedText.length + 1))
      }, 100)
      return () => clearTimeout(timeout)
    } else {
      // Show content after typing is complete
      const timeout = setTimeout(() => {
        setShowContent(true)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [typedText])

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen ascii-grid p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12 pt-8 md:pt-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="ascii-avatar">
              <Image src="/avatar.png" alt="nsvk13" width={120} height={120} className="rounded-full" />
            </div>
            <div className="text-center md:text-left">
              <div className="text-sm mb-2 opacity-70">$ whoami</div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {typedText}
                <span className={`terminal-cursor ${showCursor ? "opacity-100" : "opacity-0"}`}>_</span>
              </h1>
              <div className="mt-2 text-sm opacity-70">@nsvk13</div>
            </div>
          </div>
        </header>

        {showContent && (
          <>
            {/* About */}
            <section className="mb-12 ascii-frame ascii-frame-bottom p-6">
              <h2 className="text-xl mb-4 flex items-center">
                <Terminal className="inline-block mr-2 h-4 w-4" />
                <span>About</span>
              </h2>
              <p className="mb-4 leading-relaxed">
              DevOps engineer who grew from a Semi-Fullstack developer, with experience building modern web applications, 
              desktop solutions, with a huge (heck) infrastructure background. 
              I specialize in K8s, Docker, IaC, Node.js, TypeScript, Golang, Python (I try not to use it).   
              <br/>In my spare time away from DevOps.
               
               <br/>I develop all sorts of cool crawlable stuff, participate in OpenSource and try new technologies to broaden my technical horizons, too.
              </p>
              <p className="leading-relaxed">
              I combine leadership, resilience, and enthusiasm. When there is no plan, I always have enthusiasm.
              I am the guy with burning eyes in the darkest of times.
              </p>
            </section>

            {/* Skills */}
            <section className="mb-12">
              <h2 className="text-xl mb-4 flex items-center">
                <Code className="inline-block mr-2 h-4 w-4" />
                <span>Skills</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="ascii-frame p-4">
                  <h3 className="text-sm mb-2 opacity-70">Frontend</h3>
                  <ul className="list-none space-y-1">
                    <li>React</li>
                    <li>TypeScript</li>
                    <li>Next.js</li>
                    <li>Tailwind CSS</li>
                    <li>Vue.js~</li>
                  </ul>
                </div>
                <div className="ascii-frame p-4">
                  <h3 className="text-sm mb-2 opacity-70">Backend</h3>
                  <ul className="list-none space-y-1">
                    <li>Node.js</li>
                    <li>Elysia</li>
                    <li>GraphQL</li>
                    <li>REST API</li>
                    <li>gRPC</li>
                  </ul>
                </div>
                <div className="ascii-frame p-4">
                  <h3 className="text-sm mb-2 opacity-70">DevOps</h3>
                  <ul className="list-none space-y-1">
                    <li>Docker</li>
                    <li>Ansible</li>
                    <li>Helm~</li>
                    <li>Grafana & Prometheus</li>
                    <li>Kubernetes</li>
                    <li>CI/CD</li>
                    <li>GCP~ / YandexCloude</li>
                    <li>PostgreSQL / Redis / MongoDB~</li>
                  </ul>
                </div>
                <div className="ascii-frame p-4">
                  <h3 className="text-sm mb-2 opacity-70">Tools</h3>
                  <ul className="list-none space-y-1">
                    <li>Git</li>
                    <li>GitLab CI / GitHub Actions</li>
                    <li>Webpack</li>
                    <li>Vite</li>
                    <li>Bun</li>
                    <li>Tabby Terminal</li>
                    <li>VSCode / GoLand</li>
                    <li>Cloudflare</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Projects */}
            <section className="mb-12">
              <h2 className="text-xl mb-4 flex items-center">
                <FileText className="inline-block mr-2 h-4 w-4" />
                <span>Projects</span>
              </h2>
              <div className="space-y-4">
                <div className="ascii-frame p-4">
                  <h3 className="font-bold">Viewly Together</h3>
                  <p className="text-sm opacity-70 mb-2">React, TypeScript, Elysia, Gramio, Docker</p>
                  <p>Telegram Mini App to watch movies, TV series, anime together! Free.</p>
                </div>
                <div className="ascii-frame p-4">
                  <h3 className="font-bold">nsvk13.dev</h3>
                  <p className="text-sm opacity-70 mb-2">Next.js, MDX, Tailwind CSS</p>
                  <p>Website portfolio and blog engine with Markdown support using remark and rehype for rendering</p>
                </div>
                <div className="ascii-frame p-4">
                  <h3 className="font-bold">Hodwini</h3>
                  <p className="text-sm opacity-70 mb-2">JVM, Docker, Pterodactyl Panel, Iptables, Cloudflare, GCP, Python, Django, Rust, Tauri, Vue.js and more powerfull tools</p>
                  <p>Grandiose Minecraft project in the CIS, with its self-written solutions, automation of game currency (bank system), its own luncher, and many other cool things.</p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-12">
              <div className="ascii-divider mb-6">
                <span className="px-2">Contact</span>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://github.com/nsvk13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ascii-link flex items-center"
                >
                  <Github className="h-4 w-4 mr-1" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://twitter.com/nsvkjournal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ascii-link flex items-center"
                >
                  <Twitter className="h-4 w-4 mr-1" />
                  <span>Twitter</span>
                </a>
                <Link href="/blog" className="ascii-link flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>Blog</span>
                </Link>
{/*                 <a
                  href="https://linkedin.com/in/nsvk13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ascii-link flex items-center"
                >
                  <Linkedin className="h-4 w-4 mr-1" />
                  <span>LinkedIn</span>
                </a> */}
                <a href="mailto:contact@nsvk13.dev" className="ascii-link flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>Email</span>
                </a>
              </div>
            </section>

            {/* Footer */}
            <footer className="text-center text-sm opacity-70 py-4">
              <p>© {new Date().getFullYear()} Nikita Simakin. All rights reserved.</p>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}
