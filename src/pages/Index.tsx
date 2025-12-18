import profilePhoto from "@/assets/profile-photo.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const Index = () => {
  return <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <Navbar />
        
        <main className="py-8">
          {/* Hero Section with Photo */}
          <section className="flex flex-col-reverse md:flex-row md:items-start md:justify-between gap-8 mb-12 fade-in">
            <div className="flex-1">
              <h1 className="text-heading font-display text-4xl md:text-5xl font-bold mb-6">
                Michael Mandic
              </h1>
              <p className="text-lg leading-relaxed mb-6 text-muted-foreground">I am a person who has worked in the printing field with more than 3 years of experience and now I am still working as a Proof Print machine operator in one company. Mastering Color Matching skills and also being careful in seeing good prints. I am also a blogger and like the field of information technology and I manage a technology sharing organization or community called Nusantara Code.   
I created this for portfolio purposes. This website was also created with the help of advanced AI from lovable.dev using the Astro and Tailwind frameworks.</p>
              <div className="flex flex-wrap items-center gap-4">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-link-color hover:text-link-hover transition-colors font-medium">
                  LinkedIn
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-link-color hover:text-link-hover transition-colors font-medium">
                  GitHub
                </a>
                <a href="mailto:mihajlomandic27@gmail.com" className="text-link-color hover:text-link-hover transition-colors font-medium">
                  mihajlomandic27@gmail.com
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img src={profilePhoto} alt="Michael Mandic" className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-border shadow-lg" />
            </div>
          </section>

          {/* Education Section */}
          <section className="mb-12 fade-in-delay-1">
            <h2 className="text-section-title font-display text-2xl font-semibold mb-6">
              Education
            </h2>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  University of Belgrade, School of Electrical Engineering
                </h3>
                <p className="text-muted-foreground">
                  BSc Software Engineering
                </p>
              </div>
              <span className="text-muted-foreground text-sm whitespace-nowrap ml-4">
                2024 - Now
              </span>
            </div>
          </section>

          {/* Skills Section */}
          <section className="mb-12 fade-in-delay-2">
            <h2 className="text-section-title font-display text-2xl font-semibold mb-6">
              Skills
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-muted-foreground text-sm mb-2">
                  Programming Languages & Frameworks
                </h3>
                <p className="text-foreground font-medium">
                  Python, JavaScript, HTML/CSS, C, C++, Astro, Tailwind CSS
                </p>
              </div>
              
              <div>
                <h3 className="text-muted-foreground text-sm mb-2">
                  Tools
                </h3>
                <p className="text-foreground font-medium">
                  VS Code, Visual Studio, JetBrains IDEs, Git, GitHub, Linux, MS 365/Office
                </p>
              </div>
              
              <div>
                <h3 className="text-muted-foreground text-sm mb-2">
                  Languages
                </h3>
                <p className="text-foreground font-medium">
                  English (Fluent), Serbian (Native), German (Conversational)
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>;
};
export default Index;