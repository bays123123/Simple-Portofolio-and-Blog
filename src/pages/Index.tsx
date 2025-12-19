import { Link } from "react-router-dom";
import profilePhoto from "@/assets/profile-photo.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const blogPosts = [
  {
    id: "1",
    title: "Getting Started with React and TypeScript",
    date: "December 15, 2025",
    readTime: "5 min read"
  },
  {
    id: "2",
    title: "My Journey into Software Engineering",
    date: "December 10, 2025",
    readTime: "8 min read"
  },
  {
    id: "3",
    title: "Why I Chose Tailwind CSS Over Traditional CSS",
    date: "December 5, 2025",
    readTime: "4 min read"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <Navbar />
        
        <main className="py-8">
          {/* Hero Section */}
          <section className="flex flex-col-reverse md:flex-row md:items-start md:justify-between gap-8 mb-12 fade-in" aria-label="Profil">
            <header className="flex-1">
              <h1 className="text-heading font-display text-4xl md:text-5xl font-bold mb-6">Bayu Dwi Darmawan</h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Saya adalah seorang profesional di bidang percetakan dengan pengalaman lebih dari 3 tahun. Saat ini bekerja sebagai Proof Print machine operator. Menguasai Color Matching dan teliti dalam melihat hasil cetak berkualitas. Saya juga seorang blogger teknologi dan founder komunitas Nusantara Code.
              </p>
              <nav className="flex flex-wrap items-center gap-4" aria-label="Social links">
                <a href="https://id.linkedin.com/in/bayu-dwi-darmawan" target="_blank" rel="noopener noreferrer" className="text-link-color hover:text-link-hover transition-colors font-medium">
                  LinkedIn
                </a>
                <a href="mailto:dwibayu526@gmail.com" className="text-link-color hover:text-link-hover transition-colors font-medium">
                  dwibayu526@gmail.com
                </a>
              </nav>
            </header>
            <figure className="flex-shrink-0">
              <img 
                src={profilePhoto} 
                alt="Bayu Dwi Darmawan - Proof Print Operator" 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-border shadow-lg" 
                loading="eager"
                width={160}
                height={160}
              />
            </figure>
          </section>

          {/* Experience Section */}
          <section className="mb-12 fade-in-delay-1" aria-label="Pengalaman">
            <h2 className="text-section-title font-display text-2xl font-semibold mb-6">
              Experience
            </h2>
            <div className="space-y-6">
              <article className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Proof Print Machine Operator</h3>
                  <p className="text-muted-foreground">Color Matching & Quality Control</p>
                </div>
                <time className="text-muted-foreground text-sm whitespace-nowrap">2021 - Sekarang</time>
              </article>
              <article className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Founder Nusantara Code</h3>
                  <p className="text-muted-foreground">Komunitas berbagi teknologi</p>
                </div>
                <time className="text-muted-foreground text-sm whitespace-nowrap">2023 - Sekarang</time>
              </article>
              <article className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Blogger Teknologi</h3>
                  <p className="text-muted-foreground">Menulis artikel seputar IT & teknologi</p>
                </div>
                <time className="text-muted-foreground text-sm whitespace-nowrap">2022 - Sekarang</time>
              </article>
            </div>
          </section>

          {/* Projects Section */}
          <section className="mb-12 fade-in-delay-2" aria-label="Proyek">
            <h2 className="text-section-title font-display text-2xl font-semibold mb-6">
              Projects
            </h2>
            <div className="grid gap-6">
              <article className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <h3 className="text-foreground font-semibold mb-2 group-hover:text-primary transition-colors">
                  Nusantara Code Website
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Platform komunitas untuk berbagi pengetahuan teknologi dan programming.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Astro</span>
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Tailwind</span>
                </div>
              </article>
              <article className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <h3 className="text-foreground font-semibold mb-2 group-hover:text-primary transition-colors">
                  Personal Portfolio
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Website portfolio pribadi dengan blog dan showcase proyek.
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
          <section className="mb-12 fade-in-delay-3" aria-label="Artikel Blog">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-section-title font-display text-2xl font-semibold">
                Latest Articles
              </h2>
              <Link to="/blog" className="text-link-color hover:text-link-hover transition-colors text-sm font-medium">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {blogPosts.map((post) => (
                <article key={post.id} className="group">
                  <Link to={`/blog/${post.id}`} className="block py-3 border-b border-border hover:border-primary/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h3 className="text-foreground font-medium group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 text-muted-foreground text-sm">
                        <time>{post.date}</time>
                        <span>·</span>
                        <span>{post.readTime}</span>
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