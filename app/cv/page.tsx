import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { getCVByLanguage, markdownToHtml } from "@/lib/cv";
import CVClient from "./cv-client";

interface Props {
  searchParams: { lang?: string };
}

export default async function CVPage({ searchParams }: Props) {
  const { lang } = await searchParams;
  const currentLang = (lang === "en" ? "en" : "ru") as "ru" | "en";

  const cvData = getCVByLanguage(currentLang);
  
  if (!cvData) {
    notFound();
  }

  const htmlContent = await markdownToHtml(cvData.content);

  return (
    <main className="min-h-screen ascii-grid p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 md:mb-12 pt-4 md:pt-16">
          <Link
            href="/"
            className="ascii-link inline-flex items-center mb-4 md:mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to home</span>
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center">
                <FileText className="inline-block mr-2 h-6 w-6" />
                <span>Curriculum Vitae</span>
              </h1>
              <p className="opacity-70">
                {currentLang === "ru" 
                  ? "DevOps инженер & Full-Stack разработчик" 
                  : "DevOps Engineer & Full-Stack Developer"
                }
              </p>
            </div>

            <CVClient currentLang={currentLang} cvContent={cvData.content} />
          </div>

          <div className="ascii-divider mt-6">
            <span className="px-2">nsvk13</span>
          </div>
        </header>

        <article className="ascii-frame ascii-frame-bottom p-6 md:p-8 mb-8 md:mb-12">
          <div
            className="prose prose-gold max-w-none cv-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>

        <footer className="text-center mb-8 md:mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="ascii-link">
              Back to home
            </Link>
            <Link href="/blog" className="ascii-link">
              Blog
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}