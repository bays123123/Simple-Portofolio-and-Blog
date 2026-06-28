import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Type, AlignJustify, List } from "lucide-react";
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
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
          </article>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default BlogPost;