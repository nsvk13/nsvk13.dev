import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, markdownToHtml, getAllPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);

  if (!post || !post.content) {
    notFound();
  }

  const content = await markdownToHtml(post.content);

  return (
    <main className="min-h-screen ascii-grid p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 md:mb-8 pt-4 md:pt-12">
          <Link
            href="/blog"
            className="ascii-link inline-flex items-center mb-4 md:mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to blog</span>
          </Link>

          <h1 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">
            {post.frontmatter.title || "Untitled Post"}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm opacity-70">
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
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {post.frontmatter.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="ascii-link text-sm mr-2"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="ascii-divider mt-2 md:mt-3">
            <span className="px-2">nsvk13</span>
          </div>
        </header>

        <article className="ascii-frame ascii-frame-bottom p-4 md:p-6 mb-8 md:mb-12">
          <div
            id="post-content"
            className="prose prose-gold max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>

        <div className="text-center mb-8 md:mb-12">
          <Link href="/" className="ascii-link inline-flex items-center">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}