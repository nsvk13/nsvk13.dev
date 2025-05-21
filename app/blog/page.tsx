import Link from "next/link"
import { getAllPosts } from "@/lib/blog"
import { Calendar, Clock, FileText } from "lucide-react"

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen ascii-grid p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 md:mb-12 pt-4 md:pt-16 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Blog</h1>
          <p className="opacity-70">Thoughts, ideas, and tutorials</p>
          <div className="ascii-divider mt-6">
            <span className="px-2">nsvk13</span>
          </div>
        </header>

        <section className="mb-8 md:mb-12">
          <h2 className="text-xl mb-4 md:mb-6 flex items-center">
            <FileText className="inline-block mr-2 h-4 w-4" />
            <span>Posts</span>
          </h2>

          {posts.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
                  <article className="ascii-frame p-4 hover:border-white transition-colors">
                    <h3 className="font-bold text-lg">{post.frontmatter.title || "Untitled Post"}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm opacity-70 mt-2 mb-3">
                      {post.frontmatter.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.frontmatter.date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {post.frontmatter.readingTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.frontmatter.readingTime}</span>
                        </div>
                      )}
                    </div>
                    <p>{post.frontmatter.excerpt || "No excerpt available"}</p>
                    <div className="mt-3 text-sm flex items-center">
                      <span className="ascii-link inline-flex items-center">Read more</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="ascii-frame p-4 md:p-6 text-center">
              <p>No posts found.</p>
              <p className="text-sm opacity-70 mt-2">
                Create markdown files in the <code>content/posts</code> directory to get started.
              </p>
            </div>
          )}
        </section>

        <div className="text-center mb-8 md:mb-12">
          <Link href="/" className="ascii-link inline-flex items-center">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
