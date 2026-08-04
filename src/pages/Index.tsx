import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Download } from "lucide-react";
import profilePhoto from "@/assets/profile-photo.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { format } from "date-fns";

const Index = () => {
  const { data: blogPosts } = useQuery({
    queryKey: ['latest-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, read_time, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Navbar />
        
        <main className="py-6 sm:py-8">
          {/* Hero Section */}
          <section className="flex flex-col-reverse md:flex-row md:items-start md:justify-between gap-6 md:gap-8 mb-10 md:mb-12 fade-in" aria-label="Profil">
            <header className="flex-1">
              <h1 className="text-heading font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Bayu Dwi Darmawan</h1>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-5 sm:mb-6">
                Proof Print Operator with over 7 years of experience in the flexible packaging industry. Skilled in operating the JM Headford Gravure Proof Press, color matching, proof printing, and color quality control to ensure print results meet customer standards prior to mass production. Accustomed to working towards production targets, maintaining print quality consistency, and collaborating with the production team to meet deadlines.
              </p>
              <nav className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4" aria-label="Social links">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <a href="https://id.linkedin.com/in/bayu-dwi-darmawan" target="_blank" rel="noopener noreferrer" className="text-link-color hover:text-link-hover transition-colors font-medium py-1">
                    LinkedIn
                  </a>
                  <a href="mailto:dwibayu526@gmail.com" className="text-link-color hover:text-link-hover transition-colors font-medium py-1 break-all sm:break-normal">
                    dwibayu526@gmail.com
                  </a>
                </div>
                <a 
                  href="/resume.pdf" 
                  download 
                  className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all font-medium text-sm touch-manipulation"
                >
                  <Download size={16} />
                  Download Resume
                </a>
              </nav>
            </header>
            <figure className="flex-shrink-0 flex justify-center md:justify-end">
              <img 
                src={profilePhoto} 
                alt="Bayu Dwi Darmawan - Proof Print Operator" 
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-border shadow-lg" 
                loading="eager"
                width={160}
                height={160}
              />
            </figure>
          </section>

          {/* Experience Section */}
          <section className="mb-10 md:mb-12 fade-in-delay-1" aria-label="Pengalaman">
            <h2 className="text-section-title font-display text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">
              Experience
            </h2>
            <div className="relative pl-5 sm:pl-6 border-l border-border space-y-8 sm:space-y-10">
              {/* Experience 1 */}
              <article className="relative">
                <div className="absolute -left-[21px] sm:-left-[25px] top-1 w-2 h-2 rounded-full bg-muted-foreground" />
                <h3 className="text-foreground font-bold text-base sm:text-lg uppercase tracking-wide mb-1">
                  PT. Supernova Flexible Packaging
                </h3>
                <p className="text-muted-foreground text-sm mb-1">Proof Print Operator</p>
                <time className="text-primary text-sm mb-3 block">Jun 2018 - Actual</time>
                <p className="text-foreground text-sm sm:text-base mb-3">
                  I operate the JM Headford Gravure Proof Press machine by maximizing results for customers, by paying attention to print results and also appropriate colors
                </p>
                <ul className="text-muted-foreground text-xs sm:text-sm space-y-1">
                  <li>• Mastering color matching skills and being careful in seeing good prints and full responsibility.</li>
                  <li>• Make proof results according to the schedule and customer requests.</li>
                  <li>• See the proof results to match the color reference according to customer requests.</li>
                </ul>
              </article>

              {/* Experience 2 */}
              <article className="relative">
                <div className="absolute -left-[21px] sm:-left-[25px] top-1 w-2 h-2 rounded-full bg-muted-foreground" />
                <h3 className="text-foreground font-bold text-base sm:text-lg uppercase tracking-wide mb-1">
                  PT. Gelora Aksara Pratama
                </h3>
                <p className="text-muted-foreground text-sm mb-1">Assistant Operator Sheet-fed Printing</p>
                <time className="text-primary text-sm mb-3 block">Feb 2017 - Agu 2017</time>
                <p className="text-foreground text-sm sm:text-base mb-3">
                  Internship for seven months with a job as an assistant operator running a sheet-fed printing (SM 72 Heidelberg Offset Printer Machine), studying the printing system by means of lithography
                </p>
                <ul className="text-muted-foreground text-xs sm:text-sm space-y-1">
                  <li>• Learn the color according to the color reference on the sheet-feed printing machine.</li>
                  <li>• Ensure the machine runs smoothly and get the best results.</li>
                  <li>• Take care of the machine by always applying cleanliness every time.</li>
                </ul>
              </article>
            </div>
          </section>

          {/* Projects Section */}
          <section className="mb-10 md:mb-12 fade-in-delay-2" aria-label="Proyek">
            <h2 className="text-section-title font-display text-xl sm:text-2xl font-semibold mb-5 sm:mb-6">
              Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <article className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 active:border-primary/50 transition-colors touch-manipulation">
                <a href="https://nusantaracode.id/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-foreground font-semibold mb-2 group-hover:text-primary transition-colors">
                  Nusantara Code Website
                  <ExternalLink size={16} />
                </a>
                <p className="text-muted-foreground text-sm mb-3">
                  A community platform for sharing technology and programming knowledge.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Astro</span>
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Tailwind</span>
                </div>
              </article>
              <article className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 active:border-primary/50 transition-colors touch-manipulation">
                <a href="https://www.bayud.my.id/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-foreground font-semibold mb-2 group-hover:text-primary transition-colors">
                  Personal Portfolio
                  <ExternalLink size={16} />
                </a>
                <p className="text-muted-foreground text-sm mb-3">
                  Personal portfolio website with blog and project showcase.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">React</span>
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">TypeScript</span>
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Tailwind</span>
                </div>
              </article>
            </div>
          </section>

          {/* Blog Section */}
          <section className="mb-10 md:mb-12 fade-in-delay-3" aria-label="Artikel Blog">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-section-title font-display text-xl sm:text-2xl font-semibold">
                Latest Articles
              </h2>
              <Link to="/blog" className="text-link-color hover:text-link-hover transition-colors text-sm font-medium py-2 touch-manipulation">
                View all →
              </Link>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {blogPosts?.map((post) => (
                <article key={post.id} className="group">
                  <Link to={`/blog/${post.slug}`} className="block py-3 sm:py-3 border-b border-border hover:border-primary/50 active:border-primary/50 transition-colors touch-manipulation">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-foreground text-sm sm:text-base font-medium group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground text-xs sm:text-sm">
                        <time>{format(new Date(post.created_at), 'MMMM d, yyyy')}</time>
                        <span>·</span>
                        <span>{post.read_time}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;