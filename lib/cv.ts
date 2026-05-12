import fs from "fs";
import path from "path";
import matter from "gray-matter";

const cvDirectory = path.join(process.cwd(), "content/cv");

export type Language = "ru" | "en";
export const LANGUAGES: readonly Language[] = ["ru", "en"];

export function isLanguage(value: string | undefined): value is Language {
  return value === "ru" || value === "en";
}

export interface CV {
  language: Language;
  frontmatter: Record<string, unknown>;
  content: string;
}

export function getCVByLanguage(lang: Language): CV | null {
  const fullPath = path.join(cvDirectory, `${lang}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const source = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(source);
  return { language: lang, frontmatter: data, content };
}

export { markdownToHtml } from "./markdown";
