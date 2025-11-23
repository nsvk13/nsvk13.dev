import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"

const postsDirectory = path.join(process.cwd(), "content/posts")

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory)
}

export function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/, "")
  const fullPath = path.join(postsDirectory, `${realSlug}.md`)

  const fileContents = fs.readFileSync(fullPath, "utf8")
  const { data, content } = matter(fileContents)

  return {
    slug: realSlug,
    frontmatter: data,
    content,
  }
}

export async function markdownToHtml(markdown: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeHighlight)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

  return result.toString()
}

export function getAllPosts() {
  const slugs = getPostSlugs()
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .sort((post1, post2) => (post1.frontmatter.date > post2.frontmatter.date ? -1 : 1))

  return posts
}
