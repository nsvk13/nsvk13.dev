import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

const postsDirectory = path.join(process.cwd(), "content/posts")

try {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true })
    console.log("Created posts directory")
  }
} catch (error) {
  console.error("Error creating posts directory:", error)
}

export function getPostSlugs() {
  try {
    return fs.existsSync(postsDirectory) ? fs.readdirSync(postsDirectory) : []
  } catch (error) {
    console.error("Error reading post slugs:", error)
    return []
  }
}

export function getPostBySlug(slug: string) {
  try {
    const realSlug = slug.replace(/\.md$/, "")
    const fullPath = path.join(postsDirectory, `${realSlug}.md`)

    if (!fs.existsSync(fullPath)) {
      console.error(`Post file not found: ${fullPath}`)
      return null
    }

    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { data, content } = matter(fileContents)

    return {
      slug: realSlug,
      frontmatter: data,
      content,
    }
  } catch (error) {
    console.error(`Error getting post by slug ${slug}:`, error)
    return null
  }
}

export async function markdownToHtml(markdown: string) {
  try {
    const result = await unified().use(remarkParse).use(remarkRehype).use(rehypeStringify).process(markdown)
    return result.toString()
  } catch (error) {
    console.error("Error converting markdown to HTML:", error)
    return "<p>Error rendering content</p>"
  }
}

export function getAllPosts() {
  try {
    const slugs = getPostSlugs()
    const posts = slugs
      .filter((slug) => slug.endsWith(".md"))
      .map((slug) => getPostBySlug(slug))
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .sort((post1, post2) => {
        const date1 = post1.frontmatter.date ? new Date(post1.frontmatter.date) : new Date(0)
        const date2 = post2.frontmatter.date ? new Date(post2.frontmatter.date) : new Date(0)
        return date2.getTime() - date1.getTime()
      })
    return posts
  } catch (error) {
    console.error("Error getting all posts:", error)
    return []
  }
}
