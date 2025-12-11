import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NeonButton } from "@/components/ui/NeonButton";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Features", path: "/#features" },
  { name: "Pricing", path: "/#pricing" },
  { name: "Contact", path: "/#contact" },
];

export const Navbar = () => {
  const location = useLocation();

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-pink flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CN</span>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-pink opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Cred<span className="text-neon-cyan">Nexis</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors duration-200 hover:text-neon-cyan",
                  location.pathname === link.path
                    ? "text-neon-cyan"
                    : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <NeonButton variant="outline-cyan" size="sm">
                Dashboard
              </NeonButton>
            </Link>
            <NeonButton variant="outline-pink" size="sm">
              Login
            </NeonButton>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
