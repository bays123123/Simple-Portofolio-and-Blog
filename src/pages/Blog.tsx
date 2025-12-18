import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Getting Started with React and TypeScript",
    excerpt: "A comprehensive guide to setting up your first React project with TypeScript. Learn the basics and best practices for building type-safe applications.",
    date: "December 15, 2025",
    readTime: "5 min read"
  },
  {
    id: "2",
    title: "My Journey into Software Engineering",
    excerpt: "Reflecting on my path from curious kid to software engineering student. The challenges, lessons learned, and what keeps me motivated.",
    date: "December 10, 2025",
    readTime: "8 min read"
  },
  {
    id: "3",
    title: "Why I Chose Tailwind CSS Over Traditional CSS",
    excerpt: "Exploring the benefits of utility-first CSS and how Tailwind CSS has changed my approach to styling web applications.",
    date: "December 5, 2025",
    readTime: "4 min read"
  },
  {
    id: "4",
    title: "Exploring the World of Open Source",
    excerpt: "My experience contributing to open source projects and why every developer should consider giving back to the community.",
    date: "November 28, 2025",
    readTime: "6 min read"
  }
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <Navbar />
        
        <main className="py-8">
          <section className="mb-12 fade-in">
            <h1 className="text-heading font-display text-4xl md:text-5xl font-bold mb-4">
              Blog
            </h1>
            <p className="text-muted-foreground text-lg">
              Thoughts, tutorials, and insights about software engineering and technology.
            </p>
          </section>

          <section className="space-y-8">
            {blogPosts.map((post, index) => (
              <article 
                key={post.id} 
                className={`group border-b border-border pb-8 last:border-0 fade-in-delay-${Math.min(index + 1, 4)}`}
              >
                <Link to={`/blog/${post.id}`} className="block">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <h2 className="text-foreground font-display text-xl font-semibold group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      {post.date}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    {post.excerpt}
                  </p>
                  <span className="text-primary text-sm font-medium">
                    {post.readTime}
                  </span>
                </Link>
              </article>
            ))}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Blog;
