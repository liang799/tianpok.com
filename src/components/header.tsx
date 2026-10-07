"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./brand";
import { ArrowRight } from "./icons";
const links = [
  { label: "Home", href: "/#home", section: "home" },
  { label: "Projects", href: "/#projects", section: "projects" },
  { label: "About", href: "/#about", section: "about" },
  { label: "Contact", href: "mailto:hello@tianpok.com", section: "contact" },
];
export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (pathname !== "/") return;
    const atBottom = () =>
      window.scrollY > 0 &&
      window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 8;
    const onScroll = () => {
      if (atBottom()) setActiveSection("about");
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (atBottom()) {
          setActiveSection("about");
          return;
        }
        for (const entry of entries)
          if (entry.isIntersecting) setActiveSection(entry.target.id);
      },
      { rootMargin: "-15% 0px -50% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("#home, #projects, #about")
      .forEach((section) => observer.observe(section));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (
        !navRef.current?.contains(event.target as Node) &&
        !toggleRef.current?.contains(event.target as Node)
      )
        setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [menuOpen]);
  return (
    <header
      data-component="Header"
      className={`site-header relative z-30 ${pathname === "/" ? "home-header" : ""}`}
    >
      <div className="site-container flex h-full items-center justify-between">
        <Brand />
        <button
          ref={toggleRef}
          className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        <nav
          ref={navRef}
          id="primary-navigation"
          className={`primary-navigation ${menuOpen ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          {links.map((link) => {
            const active =
              pathname === "/"
                ? activeSection === link.section
                : link.section === "projects";
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`${active ? "is-active" : ""} ${link.section === "home" ? "nav-home" : ""}`}
                aria-current={active ? "location" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.section === "projects" ? (
                  <>
                    <span className="nav-work">Work</span>
                    <span className="nav-projects">Projects</span>
                  </>
                ) : (
                  link.label
                )}
              </Link>
            );
          })}
        </nav>
        <Link href="/#projects" className="header-cta">
          View my work <ArrowRight />
        </Link>
      </div>
    </header>
  );
}
