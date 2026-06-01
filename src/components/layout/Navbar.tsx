import { LayoutDashboard, Menu, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ThemeToggle';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { userProfile } = useAuth();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check if navbar should change style on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'SDE Sheet', path: '/sheet/sde', description: '191 Handpicked Questions' },
    { name: 'Basic to Advanced', path: '/sheet/advanced', description: '491 Questions for Complete DSA' },
    { name: 'Interview Questions', path: '/sheet/interview', description: 'Real Interview Questions' },
    { name: 'About Us', path: '/about', description: 'Learn more about us' },
    { name: 'Contact', path: '/contact', description: 'Get in touch with us' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/90 backdrop-blur-md shadow-sm'
          : 'bg-background'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/images/drive-your-self-logo.svg"
              alt="Drive Your Self Logo"
              className="w-12 h-12 drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-tight">Drive Your Self</span>
              <span className="text-xs text-muted-foreground">Master DSA with Confidence</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-base transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 px-3 py-2 text-foreground bg-secondary rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <span className="font-medium text-sm">{userProfile?.username || 'Guest'}</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background shadow-md">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-base py-2 ${
                    isActive(link.path)
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-px bg-border my-2"></div>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 py-2 text-foreground"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>

              <div className="flex items-center gap-2 py-2 text-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
                <span className="font-medium">{userProfile?.username || 'Guest'}</span>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
