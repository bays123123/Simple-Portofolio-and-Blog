import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

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


  return (
    <div className="min-h-screen bg-background">
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
            <header className="mb-10 sm:mb-12">
              <h1 className="text-heading font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <time>{format(new Date(post.created_at), 'MMMM d, yyyy')}</time>
                <span>·</span>
                <span>{post.read_time}</span>
              </div>
            </header>

            <div className="prose prose-invert max-w-none text-base sm:text-lg
              prose-headings:text-foreground prose-headings:font-display prose-headings:leading-snug prose-headings:tracking-tight
              prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:font-bold
              prose-h3:text-lg prose-h3:sm:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-semibold
              prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:my-6
              prose-li:text-muted-foreground prose-li:leading-[1.8] prose-li:my-2
              prose-ul:my-6 prose-ol:my-6
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:my-6
              prose-hr:border-border prose-hr:my-10
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default BlogPost;