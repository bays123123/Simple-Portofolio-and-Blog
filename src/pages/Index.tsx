import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
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
            <h2 className="text-section-title font-display text-2xl font-semibold mb-8">
              Experience
            </h2>
            <div className="relative pl-6 border-l border-border space-y-10">
              {/* Experience 1 */}
              <article className="relative">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-muted-foreground" />
                <h3 className="text-foreground font-bold text-lg uppercase tracking-wide mb-1">
                  PT. Supernova Flexible Packaging
                </h3>
                <p className="text-muted-foreground text-sm mb-1">Proof Print Operator</p>
                <time className="text-primary text-sm mb-3 block">Jun 2018 - Actual</time>
                <p className="text-foreground mb-3">
                  I operate the JM Headford Gravure Proof Press machine by maximizing results for customers, by paying attention to print results and also appropriate colors
                </p>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>• Mastering color matching skills and being careful in seeing good prints and full responsibility.</li>
                  <li>• Make proof results according to the schedule and customer requests.</li>
                  <li>• See the proof results to match the color reference according to customer requests.</li>
                </ul>
              </article>

              {/* Experience 2 */}
              <article className="relative">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-muted-foreground" />
                <h3 className="text-foreground font-bold text-lg uppercase tracking-wide mb-1">
                  PT. Gelora Aksara Pratama
                </h3>
                <p className="text-muted-foreground text-sm mb-1">Assistant Operator Sheet-fed Printing</p>
                <time className="text-primary text-sm mb-3 block">Feb 2017 - Agu 2017</time>
                <p className="text-foreground mb-3">
                  Internship for seven months with a job as an assistant operator running a sheet-fed printing (SM 72 Heidelberg Offset Printer Machine), studying the printing system by means of lithography
                </p>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>• Learn the color according to the color reference on the sheet-feed printing machine.</li>
                  <li>• Ensure the machine runs smoothly and get the best results.</li>
                  <li>• Take care of the machine by always applying cleanliness every time.</li>
                </ul>
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
                <a href="https://nusantaracode.id/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-foreground font-semibold mb-2 group-hover:text-primary transition-colors">
                  Nusantara Code Website
                  <ExternalLink size={16} />
                </a>
                <p className="text-muted-foreground text-sm mb-3">
                  Platform komunitas untuk berbagi pengetahuan teknologi dan programming.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Astro</span>
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Tailwind</span>
                </div>
              </article>
              <article className="group p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                <a href="https://www.bayud.my.id/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-foreground font-semibold mb-2 group-hover:text-primary transition-colors">
                  Personal Portfolio
                  <ExternalLink size={16} />
                </a>
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