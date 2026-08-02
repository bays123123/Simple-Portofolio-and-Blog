import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, Archive, Search, X, Eye } from "lucide-react";


const POSTS_PER_PAGE = 5;

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeArchive, setActiveArchive] = useState<string | null>(null);
  const [openYears, setOpenYears] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>("");
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

  // Public per-article view counts, keyed by "/blog/{slug}"
  const { data: viewCounts } = useQuery({
    queryKey: ['blog-view-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_blog_view_counts');
      if (error) throw error;
      const map: Record<string, number> = {};
      ((data ?? []) as { path: string; views: number }[]).forEach((r) => {
        map[r.path] = r.views;
      });
      return map;
    },
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

  const archives = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    blogPosts?.forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          key,
          label: format(d, "MMMM", { locale: idLocale }),
          count: 1,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [blogPosts]);

  // Group archives by year for the collapsible sidebar
  const archiveYears = useMemo(() => {
    const map = new Map<string, { year: string; count: number; months: typeof archives }>();
    archives.forEach((a) => {
      const year = a.key.slice(0, 4);
      const entry = map.get(year) ?? { year, count: 0, months: [] };
      entry.count += a.count;
      entry.months.push(a);
      map.set(year, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.year.localeCompare(a.year));
  }, [archives]);


  // Sync category filter with URL query params and clean up invalid categories
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && categories.includes(cat)) {
      setActiveCategory(cat);
      setCurrentPage(1);
    } else if (cat && categories.length > 1) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("category");
      setSearchParams(next, { replace: true });
    } else if (!cat && activeCategory !== "Semua") {
      setActiveCategory("Semua");
      setCurrentPage(1);
    }
  }, [searchParams, categories, setSearchParams, activeCategory]);

  const setCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (cat === "Semua") {
      next.delete("category");
    } else {
      next.set("category", cat);
    }
    setSearchParams(next, { replace: true });
    setCurrentPage(1);
  };

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return blogPosts?.filter((p) => {
      const categoryMatch = activeCategory === "Semua" || p.category === activeCategory;
      const tagMatch = !activeTag || p.tags?.includes(activeTag);
      const d = new Date(p.created_at);
      const archiveKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const archiveMatch = !activeArchive ||
        (activeArchive.length === 4 ? archiveKey.startsWith(activeArchive) : archiveKey === activeArchive);

      const searchMatch = !query ||
        p.title?.toLowerCase().includes(query) ||
        p.excerpt?.toLowerCase().includes(query);
      return categoryMatch && tagMatch && archiveMatch && searchMatch;
    });
  }, [blogPosts, activeCategory, activeTag, activeArchive, searchQuery]);

  const totalPages = Math.ceil((filteredPosts?.length || 0) / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts?.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | 'ellipsis')[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Navbar />

        <main className="py-6 sm:py-8">
          <section className="mb-8 sm:mb-10 fade-in">
            <h1 className="text-heading font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Blog
            </h1>
            <p className="text-left text-muted-foreground text-sm sm:text-base leading-relaxed">
              Arsip digital dan catatan profesional Bayu Dwi Darmawan seputar teknik grafika dan ilmu cetak.<br />
              Referensi teori dan praktik percetakan untuk publik.
            </p>
          </section>

          <section className="mb-6 sm:mb-8 fade-in">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari artikel berdasarkan judul atau ringkasan..."
                className="w-full rounded-lg border border-input bg-background pl-10 pr-9 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-8 lg:gap-12">
            <div className="min-w-0">
          {!isLoading && (categories.length > 1 || tags.length > 0) && (
            <section className="mb-8 sm:mb-10 space-y-4 fade-in">
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
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
                      <span className="flex items-center gap-3 text-sm">
                        <span className="text-primary font-medium">{post.read_time}</span>
                        {viewCounts && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Eye size={13} />
                            {(viewCounts[`/blog/${post.slug}`] ?? 0).toLocaleString('id-ID')}
                          </span>
                        )}
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
              <div className="text-muted-foreground text-sm space-y-2">
                <p>Tidak ada artikel yang cocok dengan filter.</p>
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                    className="text-primary hover:underline"
                  >
                    Hapus pencarian
                  </button>
                )}
              </div>
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

              {visiblePages.map((page, idx) => (
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm text-muted-foreground select-none"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
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
                )
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
            </div>

            <aside className="lg:sticky lg:top-8 lg:self-start fade-in">
              <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Archive size={16} className="text-primary" />
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-heading">
                    Arsip
                  </h2>
                </div>

                {archiveYears.length > 0 ? (
                  <ul className="space-y-1.5">
                    <li>
                      <button
                        onClick={() => { setActiveArchive(null); setCurrentPage(1); }}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors ${
                          !activeArchive
                            ? 'bg-primary/15 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        <span>Semua artikel</span>
                        <span className="text-xs tabular-nums">{blogPosts?.length ?? 0}</span>
                      </button>
                    </li>

                    {archiveYears.map((y) => {
                      const isOpen = openYears.includes(y.year) || activeArchive?.startsWith(y.year);
                      return (
                        <li key={y.year} className="rounded-lg border border-border/60 overflow-hidden">
                          <div className="flex items-stretch">
                            <button
                              onClick={() =>
                                setOpenYears((prev) =>
                                  prev.includes(y.year) ? prev.filter((v) => v !== y.year) : [...prev, y.year]
                                )
                              }
                              aria-expanded={!!isOpen}
                              className="flex flex-1 items-center gap-2 px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                            >
                              <ChevronDown
                                size={14}
                                className={`shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                              />
                              <span>{y.year}</span>
                              <span className="ml-auto text-xs text-muted-foreground tabular-nums">{y.count}</span>
                            </button>
                          </div>

                          {isOpen && (
                            <ul className="border-t border-border/60 p-1.5 space-y-0.5">
                              <li>
                                <button
                                  onClick={() => {
                                    setActiveArchive(activeArchive === y.year ? null : y.year);
                                    setCurrentPage(1);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                                    activeArchive === y.year
                                      ? 'bg-primary/15 text-primary font-medium'
                                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                  }`}
                                >
                                  <span>Semua bulan</span>
                                  <span className="tabular-nums">{y.count}</span>
                                </button>
                              </li>
                              {y.months.map((a) => (
                                <li key={a.key}>
                                  <button
                                    onClick={() => {
                                      setActiveArchive(activeArchive === a.key ? null : a.key);
                                      setCurrentPage(1);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                                      activeArchive === a.key
                                        ? 'bg-primary/15 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                                  >
                                    <span className="capitalize">{a.label}</span>
                                    <span className="text-xs tabular-nums">{a.count}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Belum ada arsip.</p>
                )}

              </div>
            </aside>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Blog;
