import Link from "next/link";
import { Brand } from "./brand";
import { GithubIcon, MailIcon } from "./icons";
export function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="site-container footer-inner">
        <Brand footer />
        <div className="footer-right">
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-8">
            <Link href="/#home">Home</Link>
            <Link href="/#projects">Projects</Link>
            <Link href="/#about">About</Link>
            <a href="mailto:hello@tianpok.com">Contact</a>
          </nav>
          <div className="footer-socials flex items-center gap-5">
            <a
              href="https://github.com/liang799"
              target="_blank"
              rel="noreferrer"
              aria-label="Tian Pok on GitHub"
            >
              <GithubIcon />
            </a>
            <a
              href="mailto:hello@tianpok.com"
              aria-label="Email hello@tianpok.com"
            >
              <MailIcon />
            </a>
          </div>
          <p className="copyright">© 2026 Tian Pok. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
