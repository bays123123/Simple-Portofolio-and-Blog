import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="sticky top-3 z-40 flex items-center justify-between glass-surface rounded-lg px-3.5 py-2.5 sm:px-4 sm:py-3 my-3 sm:my-5">
      <Link to="/" className="flex items-center gap-2.5 text-foreground font-display text-base sm:text-lg font-semibold hover:text-primary transition-colors">
        <span className="inline-flex size-8 items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-xs text-primary">BD</span>
        <span className="hidden sm:inline">Bayu Dwi Darmawan</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link to="/" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors text-sm touch-manipulation">
          Home
        </Link>
        <Link to="/blog" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors text-sm touch-manipulation">
          Blog
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;