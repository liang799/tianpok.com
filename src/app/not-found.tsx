import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export default function NotFound() {
  return (
    <main id="main-content" className="site-container min-h-[65vh] pb-20">
      <div className="page-intro">
        <p className="eyebrow">{"// 404 — Page not found"}</p>
        <h1 className="page-heading">
          A little <span className="text-orange">off-plan.</span>
        </h1>
        <p className="page-description">
          The page you’re looking for couldn’t be found. Head back home, or
          explore what I’ve been building.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/" className="button button-primary">
            Back home <ArrowRight />
          </Link>
          <Link href="/projects" className="button button-outline">
            View projects <ArrowRight />
          </Link>
        </div>
      </div>
    </main>
  );
}
