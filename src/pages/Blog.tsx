import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { format } from "date-fns";

const Blog = () => {
  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, read_time, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Navbar />
        
        <main className="py-6 sm:py-8">
          <section className="mb-10 sm:mb-12 fade-in">
            <h1 className="text-heading font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Blog
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Thoughts, tutorials, and insights about software engineering and technology.
            </p>
          </section>

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
            ) : (
              blogPosts?.map((post, index) => (
                <article 
                  key={post.id} 
                  className={`group border-b border-border pb-6 sm:pb-8 last:border-0 fade-in-delay-${Math.min(index + 1, 4)}`}
                >
                  <Link to={`/blog/${post.slug}`} className="block touch-manipulation">
                    <div className="flex flex-col gap-2 mb-3">
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
                    <span className="text-primary text-sm font-medium">
                      {post.read_time}
                    </span>
                  </Link>
                </article>
              ))
            )}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Blog;