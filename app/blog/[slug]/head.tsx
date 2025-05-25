import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { Metadata } from "next";

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  const title = post.frontmatter.title;
  const description = post.frontmatter.excerpt;
  const url = `https://nsvk13.dev/blog/${post.slug}`;
  const image = post.frontmatter.cover || ""; 

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: image ? [image] : [],
      siteName: "nsvk13.dev",
      type: "article",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}
