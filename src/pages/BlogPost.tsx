import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Type, AlignJustify, List, Link as LinkIcon, ArrowRight } from "lucide-react";
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
        <meta property="og:title" content={`${post.title} | Bayu Dwi Darmawan`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={`https://www.bayud.my.id/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        {post.cover_image && <meta property="og:image:alt" content={post.title} />}
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
          author: {
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