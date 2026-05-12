export interface PostFrontmatter {
  title?: string;
  date?: string;
  description?: string;
  excerpt?: string;
  cover?: string;
  readingTime?: string;
  tags?: string[];
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
}
