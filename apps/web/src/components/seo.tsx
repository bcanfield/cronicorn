import { Helmet } from "react-helmet-async";

export type SEOProps = {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noindex?: boolean;
  keywords?: string[];
};

const DEFAULT_SEO = {
  title: "Cronicorn - Powerful Cron Job Management",
  description: "Manage, monitor, and automate your scheduled tasks with ease. Cronicorn provides a modern interface for cron job management with real-time monitoring and notifications.",
  ogImage: "/og-image.png",
  ogType: "website",
  twitterCard: "summary_large_image",
  keywords: ["cron jobs", "task scheduler", "automation", "monitoring", "devops", "scheduled tasks"],
};

export function SEO({
  title,
  description = DEFAULT_SEO.description,
  canonical,
  ogImage = DEFAULT_SEO.ogImage,
  ogType = DEFAULT_SEO.ogType,
  twitterCard = DEFAULT_SEO.twitterCard,
  noindex = false,
  keywords = DEFAULT_SEO.keywords,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${DEFAULT_SEO.title}`
    : DEFAULT_SEO.title;

  const currentUrl = typeof window !== "undefined"
    ? window.location.href
    : "";

  const canonicalUrl = canonical || currentUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="Cronicorn" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      <meta name="author" content="Cronicorn" />

      {/* Structured Data for Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Cronicorn",
          "description": description,
          "url": canonicalUrl,
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
          },
        })}
      </script>
    </Helmet>
  );
}
