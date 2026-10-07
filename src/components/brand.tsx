import Image from "next/image";
import Link from "next/link";
export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand inline-flex items-center ${footer ? "brand-footer" : ""}`}
      aria-label="Tian Pok — home"
    >
      <Image
        className="brand-mark"
        src="/logo.svg"
        alt=""
        width={56}
        height={54}
        priority
      />
      <span>
        <Image
          className="brand-wordmark"
          src="/wordmark.svg"
          alt=""
          width={200}
          height={18}
          priority
        />
        {footer && (
          <span className="brand-tagline">Ideas under construction</span>
        )}
      </span>
    </Link>
  );
}
