import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Archive } from "lucide-react";


const POSTS_PER_PAGE = 5;

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, read_time, created_at, category, tags')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    blogPosts?.forEach((p) => p.category && set.add(p.category));
    return ["Semua", ...Array.from(set).sort()];
  }, [blogPosts]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    blogPosts?.forEach((p) => p.tags?.forEach((t) => t && set.add(t)));
    return Array.from(set).sort();
  }, [blogPosts]);

  const filteredPosts = useMemo(() => {
    return blogPosts?.filter((p) => {
      const categoryMatch = activeCategory === "Semua" || p.category === activeCategory;
      const tagMatch = !activeTag || p.tags?.includes(activeTag);
      return categoryMatch && tagMatch;
    });
  }, [blogPosts, activeCategory, activeTag]);

  const totalPages = Math.ceil((filteredPosts?.length || 0) / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts?.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const jsonLd = useMemo(() => {
    const baseUrl = "https://www.bayud.my.id";
    const graph: Record<string, unknown>[] = [
      {
        "@type": "Blog",
        "@id": `${baseUrl}/blog#blog`,
        url: `${baseUrl}/blog`,
        name: "Blog | Bayu Dwi Darmawan",
        description:
          "Arsip digital dan catatan profesional Bayu Dwi Darmawan seputar teknik grafika dan ilmu cetak. Referensi teori dan praktik percetakan untuk publik.",
        inLanguage: "id",
        author: { "@type": "Person", name: "Bayu Dwi Darmawan" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
        ],
      },
    ];

    if (blogPosts && blogPosts.length > 0) {
      graph.push({
        "@type": "ItemList",
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: blogPosts.length,
        itemListElement: blogPosts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${baseUrl}/blog/${post.slug}`,
          name: post.title,
        })),
      });
    }

    return { "@context": "https://schema.org", "@graph": graph };
  }, [blogPosts]);


  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog | Bayu Dwi Darmawan</title>
        <meta name="description" content="Arsip digital dan catatan profesional Bayu Dwi Darmawan seputar teknik grafika dan ilmu cetak. Referensi teori dan praktik percetakan untuk publik." />
        <meta property="og:title" content="Blog | Bayu Dwi Darmawan" />
        <meta property="og:description" content="Arsip digital dan catatan profesional Bayu Dwi Darmawan seputar teknik grafika dan ilmu cetak. Referensi teori dan praktik percetakan untuk publik." />
        <meta property="og:url" content="https://www.bayud.my.id/blog" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.bayud.my.id/blog" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Navbar />

        <main className="py-6 sm:py-8">
          <section className="mb-8 sm:mb-10 fade-in">
            <h1 className="text-heading font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Blog
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Arsip digital dan catatan profesional Bayu Dwi Darmawan seputar teknik grafika dan ilmu cetak. Referensi teori dan praktik percetakan untuk publik.
            </p>
          </section>

          {!isLoading && (categories.length > 1 || tags.length > 0) && (
            <section className="mb-8 sm:mb-10 space-y-4 fade-in">
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        activeCategory === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { setActiveTag(activeTag === tag ? null : tag); setCurrentPage(1); }}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        activeTag === tag
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                          : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {activeTag && (
                    <button
                      onClick={() => { setActiveTag(null); setCurrentPage(1); }}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Hapus filter tag
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="space-y-6 sm:space-y-8">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border-b border-border pb-6">
                    <div className="h-6 bg-secondary rounded w-3/4 mb-3" />
                    <div className="h-4 bg-secondary rounded w-full mb-2" />
                    <div className="h-4 bg-secondary rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : paginatedPosts && paginatedPosts.length > 0 ? (
              paginatedPosts.map((post, index) => (
                <article
                  key={post.id}
                  className={`group border-b border-border pb-6 sm:pb-8 last:border-0 fade-in-delay-${Math.min(index + 1, 4)}`}
                >
                  <Link to={`/blog/${post.slug}`} className="block touch-manipulation">
                    <div className="flex flex-col gap-2 mb-3">
                      {post.category && (
                        <span className="text-primary text-xs font-semibold uppercase tracking-wide">
                          {post.category}
                        </span>
                      )}
                      <h2 className="text-foreground font-display text-lg sm:text-xl font-semibold group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <span className="text-muted-foreground text-sm">
                        {format(new Date(post.created_at), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-primary text-sm font-medium">
                        {post.read_time}
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </article>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Tidak ada artikel yang cocok dengan filter.</p>
            )}
          </section>

          {totalPages > 1 && (
            <nav className="mt-8 sm:mt-10 flex items-center justify-center gap-1.5 fade-in" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={`Halaman ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Blog;
