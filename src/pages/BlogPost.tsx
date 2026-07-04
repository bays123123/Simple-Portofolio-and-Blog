import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Type, AlignJustify, List, Link as LinkIcon, ArrowRight, Share2, Link2, Check } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useMemo } from "react";

// Convert heading text into a URL-friendly slug for anchor ids
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Recursively extract plain text from React children (for heading ids)
const getNodeText = (node: React.ReactNode): string => {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (React.isValidElement(node)) return getNodeText((node.props as { children?: React.ReactNode }).children);
  return "";
};



// Extract h2/h3 headings from markdown content for the table of contents
const extractHeadings = (md: string) => {
  if (!md) return [] as { id: string; text: string; level: number }[];
  const lines = md.split("\n");
  const headings: { id: string; text: string; level: number }[] = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const match = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[#*_~`]/g, "").trim();
      if (text) headings.push({ id: slugify(text), text, level });
    }
  }
  return headings;
};



// Helper to generate responsive image props with srcset for Supabase Storage images
const getResponsiveImageProps = (url: string) => {
  if (!url) return null;
  const isSupabaseStorage = url.includes('.supabase.co/storage/v1/');
  const srcSet = isSupabaseStorage
    ? `${url}?width=400&quality=80 400w, ${url}?width=800&quality=80 800w, ${url}?width=1200&quality=80 1200w`
    : undefined;
  return {
    srcSet,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 768px',
  };
};

// Strip markdown syntax to get plain text for meta description
const stripMarkdown = (md: string) => {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~`]/g, '')
    .replace(/>\s?/g, '')
    .replace(/\n+/g, ' ')
    .trim();
};

const getMetaDescription = (post: any) => {
  if (post.excerpt) return post.excerpt;
  const plain = stripMarkdown(post.content || '');
  if (plain.length <= 160) return plain;
  return plain.slice(0, 157).trimEnd() + '...';
};

type ShareBarProps = {
  post: any;
};

const ShareBar = ({ post }: ShareBarProps) => {
  const url = `https://www.bayud.my.id/blog/${post.slug}`;
  const title = post.title;
  const [copied, setCopied] = useState(false);

  const shareNetwork = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // cancelled
      }
    }
  };

  const networks = [
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-5">
      <span className="text-xs font-medium text-muted-foreground">Bagikan:</span>

      {typeof navigator !== "undefined" && navigator.share && (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label="Bagikan"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          <Share2 size={16} />
        </button>
      )}

      {networks.map((network) => (
        <button
          key={network.name}
          type="button"
          onClick={() => shareNetwork(network.href)}
          aria-label={`Bagikan ke ${network.name}`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          {network.icon}
        </button>
      ))}

      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Link tersalin" : "Salin link artikel"}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg px-3 py-1.5 transition-colors"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? "Tersalin" : "Salin link"}
      </button>
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fontSize, setFontSize] = useState<0 | 1 | 2>(0);
  const [lineHeight, setLineHeight] = useState<0 | 1 | 2>(1);
  const [showControls, setShowControls] = useState(false);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  const headings = useMemo(() => extractHeadings(post?.content || ''), [post?.content]);
  const showToc = headings.length >= 3;

  // Fetch other published posts and score them for relevance to the current one
  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', post?.id],
    enabled: !!post,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, category, tags')
        .eq('published', true)
        .neq('id', post!.id);

      if (error) throw error;

      return (data || [])
        .map((p) => {
          let score = 0;
          if (post!.category && p.category === post!.category) score += 2;
          const shared = (p.tags || []).filter((t: string) => post!.tags?.includes(t)).length;
          score += shared;
          return { ...p, score };
        })
        .filter((p) => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    },
  });

  // Fetch the chronologically adjacent published articles
  const { data: adjacentPosts } = useQuery({
    queryKey: ['adjacent-posts', post?.id],
    enabled: !!post,
    queryFn: async () => {
      const [prevResult, nextResult] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, title, slug, created_at')
          .eq('published', true)
          .lt('created_at', post!.created_at)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('blog_posts')
          .select('id, title, slug, created_at')
          .eq('published', true)
          .gt('created_at', post!.created_at)
          .order('created_at', { ascending: true })
          .limit(1),
      ]);

      if (prevResult.error) throw prevResult.error;
      if (nextResult.error) throw nextResult.error;

      return {
        prev: prevResult.data?.[0] || null,
        next: nextResult.data?.[0] || null,
      };
    },
  });

  // Split the article into two parts at a paragraph boundary near the middle,
  // so a "related articles" block can be inserted mid-read.
  const contentParts = useMemo(() => {
    const md = post?.content || '';
    if (!md.trim()) return [md];
    const lines = md.split('\n');
    const boundaries: number[] = [];
    let inCode = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('```')) inCode = !inCode;
      if (!inCode && lines[i].trim() === '' && i > 0 && i < lines.length - 1) {
        boundaries.push(i);
      }
    }
    if (boundaries.length === 0) return [md];
    const mid = lines.length / 2;
    let best = boundaries[0];
    for (const b of boundaries) {
      if (Math.abs(b - mid) < Math.abs(best - mid)) best = b;
    }
    return [lines.slice(0, best).join('\n'), lines.slice(best + 1).join('\n')];
  }, [post?.content]);

  const handleTocClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Navbar />
          <main className="py-6 sm:py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-secondary rounded w-3/4 mb-4" />
              <div className="h-4 bg-secondary rounded w-1/4 mb-8" />
              <div className="space-y-3">
                <div className="h-4 bg-secondary rounded w-full" />
                <div className="h-4 bg-secondary rounded w-full" />
                <div className="h-4 bg-secondary rounded w-2/3" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Navbar />
          <main className="py-6 sm:py-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
              <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
              <Link 
                to="/blog" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Blog
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const metaDescription = getMetaDescription(post);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${post.title} | Bayu Dwi Darmawan`}</title>
        <meta name="description" content={metaDescription} />

        {/* Open Graph */}
        <meta property="og:title" content={`${post.title} | Bayu Dwi Darmawan`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={`https://www.bayud.my.id/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Bayu Dwi Darmawan" />
        <meta property="article:published_time" content={post.created_at} />
        {post.updated_at && <meta property="article:modified_time" content={post.updated_at} />}
        <meta property="article:author" content="Bayu Dwi Darmawan" />
        {post.category && <meta property="article:section" content={post.category} />}
        {Array.isArray(post.tags) && post.tags.map((tag: string) => (
          <meta property="article:tag" content={tag} key={tag} />
        ))}
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        {post.cover_image && <meta property="og:image:width" content="1200" />}
        {post.cover_image && <meta property="og:image:height" content="630" />}
        {post.cover_image && <meta property="og:image:alt" content={post.title} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content={post.cover_image ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={`${post.title} | Bayu Dwi Darmawan`} />
        <meta name="twitter:description" content={metaDescription} />
        {post.cover_image && <meta name="twitter:image" content={post.cover_image} />}
        {post.cover_image && <meta name="twitter:image:alt" content={post.title} />}

        <link rel="canonical" href={`https://www.bayud.my.id/blog/${post.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: metaDescription,
          image: post.cover_image || undefined,
          datePublished: post.created_at,
          dateModified: post.updated_at,
          url: `https://www.bayud.my.id/blog/${post.slug}`,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://www.bayud.my.id/blog/${post.slug}`
          },
          keywords: Array.isArray(post.tags) ? post.tags.join(", ") : undefined,
          articleSection: post.category || undefined,
          author: {
            "@type": "Person",
            name: "Bayu Dwi Darmawan"
          },
          publisher: {
            "@type": "Person",
            name: "Bayu Dwi Darmawan"
          }
        })}</script>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Navbar />
        
        <main className="py-6 sm:py-8">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 sm:mb-8 touch-manipulation"
          >
            <ArrowLeft size={16} />
            Back to Blog
          </Link>

          <article className="fade-in">
            {post.cover_image && (
              <figure className="relative w-full rounded-xl overflow-hidden border border-border mb-8 sm:mb-10">
                {(() => {
                  const responsiveProps = getResponsiveImageProps(post.cover_image);
                  return (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full aspect-[4/3] sm:aspect-[16/9] object-cover max-h-[320px] sm:max-h-[420px]"
                      loading="lazy"
                      decoding="async"
                      {...(responsiveProps || {})}
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                      }}
                    />
                  );
                })()}
              </figure>
            )}
            <header className="mb-10 sm:mb-12">
              {post.category && (
                <Link
                  to="/blog"
                  className="inline-block text-primary text-xs font-semibold uppercase tracking-wide mb-3 hover:underline"
                >
                  {post.category}
                </Link>
              )}
              <h1 className="text-heading font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-4">
                {post.title}
              </h1>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <time>{format(new Date(post.created_at), 'MMMM d, yyyy')}</time>
                  <span>·</span>
                  <span>{post.read_time}</span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowControls(!showControls)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg px-3 py-1.5 transition-colors"
                    aria-label="Mode baca nyaman"
                    aria-expanded={showControls}
                  >
                    <Type size={14} />
                    <span className="hidden sm:inline">Mode Baca</span>
                  </button>

                  {showControls && (
                    <div className="absolute right-0 top-full mt-2 z-20 bg-card border border-border rounded-xl shadow-lg p-4 w-56 animate-in fade-in zoom-in-95 duration-150">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                          <Type size={12} />
                          Ukuran Font
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFontSize(0)}
                            className={`flex-1 text-center py-1.5 rounded-md text-sm transition-colors ${fontSize === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                          >
                            A
                          </button>
                          <button
                            onClick={() => setFontSize(1)}
                            className={`flex-1 text-center py-1.5 rounded-md text-base transition-colors ${fontSize === 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                          >
                            A
                          </button>
                          <button
                            onClick={() => setFontSize(2)}
                            className={`flex-1 text-center py-1.5 rounded-md text-lg transition-colors ${fontSize === 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                          >
                            A
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                          <AlignJustify size={12} />
                          Jarak Baris
                        </div>
                        <div className="flex items-center gap-2">
                          {[
                            { label: 'Rapat', value: 0 as const },
                            { label: 'Normal', value: 1 as const },
                            { label: 'Longgar', value: 2 as const },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setLineHeight(opt.value)}
                              className={`flex-1 text-center py-1.5 rounded-md text-xs transition-colors ${lineHeight === opt.value ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {showToc && (
              <nav
                aria-label="Daftar isi"
                className="mb-10 rounded-xl border border-border bg-card/50 p-5 sm:p-6"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                  <List size={16} className="text-primary" />
                  Daftar Isi
                </div>
                <ul className="space-y-1.5">
                  {headings.map((h, i) => (
                    <li key={`${h.id}-${i}`} className={h.level === 3 ? "ml-4" : ""}>
                      <a
                        href={`#${h.id}`}
                        onClick={(e) => handleTocClick(e, h.id)}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div
              className={`prose prose-invert max-w-none article-content
                prose-headings:text-foreground prose-headings:font-display prose-headings:leading-snug prose-headings:tracking-tight
                prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:font-bold
                prose-h3:text-lg prose-h3:sm:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-semibold
                prose-p:text-muted-foreground prose-p:my-6
                prose-ul:my-6 prose-ol:my-6 prose-ul:space-y-2 prose-ol:space-y-2
                prose-li:text-muted-foreground prose-li:my-0 prose-li:pl-1
                prose-strong:text-foreground prose-strong:font-semibold
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:my-8 prose-blockquote:py-1
                prose-hr:border-border prose-hr:my-10
                prose-img:my-8 prose-img:rounded-lg
                ${fontSize === 0 ? 'text-base sm:text-lg' : fontSize === 1 ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}
              `}
              style={{
                ['--article-line-height' as string]:
                  lineHeight === 0 ? '1.6' : lineHeight === 1 ? '1.8' : '2.1',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ node, ...props }) => (
                    <h2 id={slugify(getNodeText(props.children))} {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 id={slugify(getNodeText(props.children))} {...props} />
                  ),
                }}
              >
                {contentParts[0]}
              </ReactMarkdown>

              {contentParts.length === 2 && relatedPosts && relatedPosts.length > 0 && (
                <aside
                  aria-label="Artikel terkait"
                  className="not-prose my-10 rounded-xl border border-border bg-card/50 p-5 sm:p-6"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <LinkIcon size={16} className="text-primary" />
                    Baca Juga
                  </div>
                  <ul className="space-y-2.5">
                    {relatedPosts.map((rp) => (
                      <li key={rp.id}>
                        <Link
                          to={`/blog/${rp.slug}`}
                          className="group flex items-start gap-2 text-base text-primary hover:underline"
                        >
                          <ArrowRight size={16} className="mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          <span>{rp.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              {contentParts.length === 2 && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ node, ...props }) => (
                      <h2 id={slugify(getNodeText(props.children))} {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 id={slugify(getNodeText(props.children))} {...props} />
                    ),
                  }}
                >
                  {contentParts[1]}
                </ReactMarkdown>
              )}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-md bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {(adjacentPosts?.prev || adjacentPosts?.next) && (
              <nav
                aria-label="Navigasi artikel"
                className="mt-10 pt-6 border-t border-border"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  {adjacentPosts?.prev ? (
                    <Link
                      to={`/blog/${adjacentPosts.prev.slug}`}
                      className="group flex flex-col items-start gap-1 rounded-xl border border-border bg-card/50 p-4 hover:bg-card transition-colors sm:max-w-[50%]"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                        Artikel Sebelumnya
                      </span>
                      <span className="text-sm font-medium text-foreground line-clamp-2">
                        {adjacentPosts.prev.title}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {adjacentPosts?.next ? (
                    <Link
                      to={`/blog/${adjacentPosts.next.slug}`}
                      className="group flex flex-col items-start sm:items-end gap-1 rounded-xl border border-border bg-card/50 p-4 hover:bg-card transition-colors sm:text-right sm:max-w-[50%]"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        Artikel Berikutnya
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="text-sm font-medium text-foreground line-clamp-2">
                        {adjacentPosts.next.title}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </nav>
            )}
          </article>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default BlogPost;