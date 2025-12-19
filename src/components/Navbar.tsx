import { Link } from "react-router-dom";
const Navbar = () => {
  return <nav className="flex items-center justify-between py-6">
      <Link to="/" className="text-foreground font-display text-xl font-semibold hover:text-primary transition-colors">BDD</Link>
      <div className="flex items-center gap-6">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
          Home
        </Link>
        <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
          Blog
        </Link>
      </div>
    </nav>;
};
export default Navbar;