import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import slugify from "slugify";
import { posts as ALL_POSTS } from "./posts.generated";
import type { Post, PostFrontmatter } from "./blog-types";

export type { Post, PostFrontmatter };

const PAGE_SIZE = 6;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function getPostSlugs(): string[] {
  return ALL_POSTS.map((p) => p.slug);
}

export function getPostBySlug(slug: string): Post | null {
  const realSlug = slug.replace(/\.md$/, "");
  if (!isValidSlug(realSlug)) return null;
  return ALL_POSTS.find((p) => p.slug === realSlug) ?? null;
}

export function getAllPosts(): Post[] {
  return [...ALL_POSTS].sort((a, b) => {
    const da = a.frontmatter.date ? new Date(a.frontmatter.date) : new Date(0);
    const db = b.frontmatter.date ? new Date(b.frontmatter.date) : new Date(0);
    return db.getTime() - da.getTime();
  });
}

export function getAllTags(): string[] {
  return Array.from(
    new Set(
      getAllPosts()
        .flatMap((p) => p.frontmatter.tags ?? [])
        .map((t) => t.toLowerCase())
    )
  ).sort();
}

export function getPostsByTag(tag: string): Post[] {
  const t = tag.toLowerCase();
  return getAllPosts().filter((p) =>
    (p.frontmatter.tags ?? []).map((x) => x.toLowerCase()).includes(t)
  );
}

export interface Heading {
  depth: number;
  text: string;
  id: string;
}

export function extractHeadings(markdown: string): Heading[] {
  const tree = unified().use(remarkParse).parse(markdown) as any;
  const headings: Heading[] = [];
  visit(tree, "heading", (node: any) => {
    const text = node.children
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.value)
      .join("");
    const id = slugify(text, { lower: true, strict: true });
    headings.push({ depth: node.depth, text, id });
  });
  return headings;
}

export function paginate<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    current,
    totalPages,
  };
}

export { markdownToHtml } from "./markdown";
