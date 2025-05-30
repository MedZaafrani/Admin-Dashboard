"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDarkMode } from "@/lib/hooks/useDarkMode";
import {
  Home,
  Users,
  ShoppingBag,
  Store,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const NavItem = ({ href, icon, label, active }: NavItemProps) => (
  <Link href={href}>
    <Button
      variant={active ? "default" : "ghost"}
      className="w-full justify-start"
    >
      <span className="flex items-center w-full">
        <span className="mr-2">{icon}</span>
        <span>{label}</span>
      </span>
    </Button>
  </Link>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { href: "/dashboard", icon: <Home size={18} />, label: "Tableau de bord" },
    { href: "/users", icon: <Users size={18} />, label: "Utilisateurs" },
    { href: "/products", icon: <ShoppingBag size={18} />, label: "Produits" },
    { href: "/stores", icon: <Store size={18} />, label: "Magasins" },
    {
      href: "/reclamations",
      icon: <MessageSquare size={18} />,
      label: "Réclamations",
    },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="space-y-4 w-80">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun /> : <Moon />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-border bg-card pt-5 overflow-y-auto">
          <div className="flex items-center justify-center h-16">
            <h1 className="text-xl font-bold">Dashboard Admin</h1>
          </div>
          <Separator className="my-4" />
          <nav className="flex-1 px-4 pb-4 space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href}
              />
            ))}
          </nav>
          <div className="px-4 pb-6">
            <Separator className="my-4" />
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive"
              onClick={() => signOut()}
            >
              <LogOut size={18} className="mr-2" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-card">
            <div className="flex flex-col h-full pt-5">
              <div className="flex items-center justify-between px-4 h-16">
                <h1 className="text-xl font-bold">Dashboard Admin</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X size={20} />
                </Button>
              </div>
              <Separator className="my-4" />
              <nav className="flex-1 px-4 pb-4 space-y-2">
                {navItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={pathname === item.href}
                  />
                ))}
              </nav>
              <div className="px-4 pb-6">
                <Separator className="my-4" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:ml-64 flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8">{children}</main>
      </div>
    </div>
  );
}
