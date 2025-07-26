"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Download, Printer } from "lucide-react";

interface CVClientProps {
  currentLang: "ru" | "en";
  cvContent: string;
}

export default function CVClient({ currentLang, cvContent }: CVClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLanguageSwitch = (lang: "ru" | "en") => {
    const params = new URLSearchParams(searchParams);
    if (lang === "ru") {
      params.delete("lang");
    } else {
      params.set("lang", lang);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/cv?${queryString}` : "/cv";
    router.push(url);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([cvContent], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `cv_nsvk13_${currentLang}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const handlePrintToPDF = () => {
    const cvContentElement = document.querySelector('.cv-content');
    if (!cvContentElement) return;

    const cvHtml = cvContentElement.innerHTML;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    /**
     * I know it's hardcoded, but I haven't come up with anything better yet because 
     * I'm too lazy, and what difference does it make if it works?
     * ¯\_(ツ)_/¯
     * 27.07.2025
     */
    const printHtml = `
      <!DOCTYPE html>
      <html lang="${currentLang}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CV - Nikita Simakin</title>
        <style>
          :root {
            --gold: #d4a657;
            --black: #0a0a0a;
            --dark-gray: #1a1a1a;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            background-color: white !important;
            color: #333 !important;
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
            font-size: 14px;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .cv-content h1 {
            color: var(--gold) !important;
            font-size: 28px !important;
            margin-bottom: 20px !important;
            border-bottom: 2px solid var(--gold) !important;
            padding-bottom: 10px !important;
            page-break-after: avoid;
          }
          
          .cv-content h2 {
            color: #333 !important;
            font-size: 20px !important;
            margin: 25px 0 15px 0 !important;
            border-left: 4px solid var(--gold) !important;
            padding-left: 15px !important;
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .cv-content h3 {
            color: #444 !important;
            font-size: 16px !important;
            margin: 20px 0 10px 0 !important;
            font-weight: bold !important;
            page-break-after: avoid;
          }
          
          .cv-content p {
            margin-bottom: 12px !important;
            text-align: justify;
            orphans: 3;
            widows: 3;
          }
          
          .cv-content ul {
            margin: 10px 0 !important;
            padding-left: 20px !important;
            page-break-inside: avoid;
          }
          
          .cv-content li {
            margin-bottom: 6px !important;
            list-style-type: none !important;
            position: relative;
            page-break-inside: avoid;
          }
          
          .cv-content li::before {
            content: "▸" !important;
            color: var(--gold) !important;
            position: absolute;
            left: -15px;
            font-weight: bold;
          }
          
          .cv-content strong {
            color: #222 !important;
            font-weight: bold !important;
          }
          
          .cv-content em {
            color: #666 !important;
            font-style: italic !important;
          }
          
          .cv-content a {
            color: var(--gold) !important;
            text-decoration: underline !important;
          }
          
          .cv-content hr {
            border: none !important;
            border-top: 1px solid var(--gold) !important;
            margin: 25px 0 !important;
            page-break-after: avoid;
          }
          
          .cv-content blockquote {
            border-left: 4px solid var(--gold) !important;
            padding-left: 20px !important;
            margin: 20px 0 !important;
            font-style: italic !important;
            color: #666 !important;
            background-color: #f9f9f9 !important;
            padding: 15px 20px !important;
            page-break-inside: avoid;
          }
          
          @media print {
            body {
              padding: 15mm !important;
              margin: 0 !important;
            }
            
            .cv-content h1 {
              page-break-after: avoid !important;
            }
            
            .cv-content h2, 
            .cv-content h3 {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            
            .cv-content ul, 
            .cv-content ol {
              page-break-inside: avoid !important;
            }
            
            .cv-content li {
              page-break-inside: avoid !important;
            }
            
            .cv-content p {
              orphans: 3 !important;
              widows: 3 !important;
            }
            
            @page {
              margin: 20mm 15mm !important;
              size: A4 !important;
            }
          }
          
          /* Убираем рамки и ASCII элементы для печати */
          .ascii-frame,
          .ascii-frame::before,
          .ascii-frame::after,
          .ascii-frame-bottom::before,
          .ascii-frame-bottom::after {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="cv-content">
          ${cvHtml}
        </div>
        <script>
          window.onload = function() {
            // Небольшая задержка, чтобы стили успели загрузиться
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Language Switcher */}
      <div className="ascii-frame p-2 flex items-center gap-2">
        <Globe className="h-4 w-4" />
        <button
          onClick={() => handleLanguageSwitch("ru")}
          className={`px-2 py-1 text-sm transition-colors ${
            currentLang === "ru" 
              ? "text-white bg-gold/20" 
              : "text-gold hover:text-white"
          }`}
        >
          RU
        </button>
        <span className="text-gold">|</span>
        <button
          onClick={() => handleLanguageSwitch("en")}
          className={`px-2 py-1 text-sm transition-colors ${
            currentLang === "en" 
              ? "text-white bg-gold/20" 
              : "text-gold hover:text-white"
          }`}
        >
          EN
        </button>
      </div>

      {/* Print to PDF Button */}
      <button
        onClick={handlePrintToPDF}
        className="ascii-frame p-2 hover:border-white transition-colors flex items-center gap-2"
        title="Print to PDF"
      >
        <Printer className="h-4 w-4" />
        <span className="hidden md:inline">Print PDF</span>
      </button>

      {/* Download MD Button */}
      <button
        onClick={handleDownload}
        className="ascii-frame p-2 hover:border-white transition-colors flex items-center gap-2"
        title="Download Markdown"
      >
        <Download className="h-4 w-4" />
        <span className="hidden md:inline">Download MD</span>
      </button>
    </div>
  );
}