import Link from "next/link";
import { getAllPosts, getPostsByTag, paginate } from "@/lib/blog";
import { Calendar, Clock, FileText } from "lucide-react";

interface Props {
  searchParams: { page?: string; tag?: string };
}

export default async function BlogPage({ searchParams }: Props) {
  const { page, tag } = await searchParams;
  const pageNum = parseInt(page ?? "1", 10);

  const all = tag ? getPostsByTag(tag) : getAllPosts();

  const { items: posts, current, totalPages } = paginate(all, pageNum);

  return (
    <main className="min-h-screen ascii-grid p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        <header className="mb-8 md:mb-12 pt-4 md:pt-16 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {tag ? `Posts tagged “#${tag}”` : "Blog"}
          </h1>
          <p className="opacity-70">
            {tag
              ? `${all.length} post${all.length === 1 ? "" : "s"}`
              : "Thoughts, ideas, and tutorials"}
          </p>
          <div className="ascii-divider mt-6">
            <span className="px-2">nsvk13</span>
          </div>
          {tag && (
            <div className="mt-4">
              <Link href="/blog" className="ascii-link text-sm">
                ← clear filter
              </Link>
            </div>
          )}
        </header>

        <section className="mb-8 md:mb-12">
          <h2 className="text-xl mb-4 md:mb-6 flex items-center">
            <FileText className="inline-block mr-2 h-4 w-4" />
            <span>Posts</span>
          </h2>

          {posts.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="ascii-frame p-4 hover:border-white transition-colors"
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block font-bold text-lg mb-2"
                  >
                    {post.frontmatter.title || "Untitled Post"}
                  </Link>

                  <div className="flex flex-wrap items-center gap-4 text-sm opacity-70 mb-2">
                    {post.frontmatter.date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(post.frontmatter.date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {post.frontmatter.readingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.frontmatter.readingTime}</span>
                      </div>
                    )}
                  </div>

                  {post.frontmatter.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.frontmatter.tags.map((t: string) => (
                        <Link
                          key={t}
                          href={{
                            pathname: "/blog",
                            query: { tag: t },
                          }}
                          className="ascii-link text-xs mr-2"
                        >
                          #{t}
                        </Link>
                      ))}
                    </div>
                  )}

                  <p className="mb-2">
                    {post.frontmatter.excerpt || "No excerpt available"}
                  </p>

                  <div className="mt-3 text-sm">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="ascii-link inline-flex items-center"
                    >
                      Read more
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ascii-frame p-4 md:p-6 text-center">
              <p>No posts found{tag ? ` for tag “${tag}”` : ""}.</p>
            </div>
          )}
        </section>

        <nav className="flex justify-between mb-8">
          {current > 1 ? (
            <Link
              href={{
                pathname: "/blog",
                query: { ...(tag ? { tag } : {}), page: current - 1 },
              }}
              className="ascii-link"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {current < totalPages && (
            <Link
              href={{
                pathname: "/blog",
                query: { ...(tag ? { tag } : {}), page: current + 1 },
              }}
              className="ascii-link"
            >
              Older →
            </Link>
          )}
        </nav>

        <div className="text-center">
          <Link href="/" className="ascii-link inline-flex items-center">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}