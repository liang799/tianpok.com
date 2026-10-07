import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GithubIcon, MailIcon } from "./icons";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer id="contact" className={styles.footer} data-component="Footer">
      <div className={styles.container}>
        <div className={styles.columns}>
          <div className={styles.identity}>
            <Link
              href="/"
              className={styles.brand}
              aria-label="Tian Pok — home"
            >
              <Image
                src="/logo.svg"
                alt=""
                width={56}
                height={54}
                className={styles.logo}
              />
              <Image
                src="/wordmark.svg"
                alt=""
                width={200}
                height={18}
                className={styles.wordmark}
              />
            </Link>
            <p className={styles.tagline}>
              Building practical, purposeful software for a better digital
              tomorrow.
            </p>
          </div>
          <nav aria-label="Footer navigation" className={styles.navigation}>
            <h2 className={styles.heading}>Navigation</h2>
            <ul className={styles.links}>
              <li>
                <Link href="/#projects">Work</Link>
              </li>
              <li>
                <Link href="/#about">About</Link>
              </li>
              <li>
                <a href="mailto:hello@tianpok.com">Contact</a>
              </li>
            </ul>
          </nav>
          <div className={styles.social}>
            <h2 className={styles.heading}>Connect</h2>
            <ul className={styles.links}>
              <li>
                <a
                  href="https://github.com/liang799"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Tian Pok on GitHub"
                >
                  <GithubIcon className={styles.socialIcon} />
                  <span>GitHub</span>
                  <ArrowUpRight className={styles.externalIcon} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/tianpok-neoh/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Tian Pok on LinkedIn"
                >
                  <svg
                    className={styles.socialIcon}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.97V9.2h2.96v9.55ZM6.45 7.89a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44Zm12.3 10.86h-2.96v-4.64c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.72H9.49V9.2h2.84v1.3h.04c.39-.75 1.36-1.55 2.79-1.55 2.99 0 3.59 1.97 3.59 4.53v5.27Z" />
                  </svg>
                  <span>LinkedIn</span>
                  <ArrowUpRight className={styles.externalIcon} />
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@tianpok.com"
                  aria-label="Email hello@tianpok.com"
                >
                  <MailIcon className={styles.socialIcon} />
                  <span>Email</span>
                  <ArrowUpRight className={styles.externalIcon} />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>© 2026 Tian Pok. All rights reserved.</p>
          <p className={styles.location}>
            Based in Singapore <span aria-hidden="true">🇸🇬</span>
          </p>
          <p className={styles.motto}>
            Build <span aria-hidden="true">·</span> Learn{" "}
            <span aria-hidden="true">·</span> Repeat
          </p>
        </div>
      </div>
    </footer>
  );
}
