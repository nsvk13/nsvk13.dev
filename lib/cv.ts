import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";

const cvDirectory = path.join(process.cwd(), "content/cv");

export type Language = "ru" | "en";

export function getCVByLanguage(lang: Language) {
  const fullPath = path.join(cvDirectory, `${lang}.md`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  
  const source = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(source);
  
  return {
    language: lang,
    frontmatter: data,
    content,
  };
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
    .process(markdown);
  
  return result.toString();
}

export function getAvailableLanguages(): Language[] {
  if (!fs.existsSync(cvDirectory)) {
    return [];
  }
  
  return fs.readdirSync(cvDirectory)
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', '') as Language)
    .filter(lang => ['ru', 'en'].includes(lang));
}