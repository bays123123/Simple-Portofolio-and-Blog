const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-8 border-t border-border/70 mt-16">
      <p className="text-muted-foreground text-xs text-center">
        {currentYear} © Bayu Dwi Darmawan
      </p>
    </footer>
  );
};

export default Footer;
