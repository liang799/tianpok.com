"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { ArrowRight } from "./icons";

export function FeaturedWork({ projects }: { projects: Project[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [ends, setEnds] = useState({ start: true, end: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const measure = () =>
      setEnds({
        start: rail.scrollLeft < 2,
        end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2,
      });
    measure();
    rail.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  const move = (direction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * (rail.clientWidth + 28),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <section
      id="projects"
      className="featured-work site-container"
      aria-labelledby="projects-title"
    >
      <div className="featured-heading">
        <h2 id="projects-title">
          <span aria-hidden="true">{"//"}</span> Featured work
        </h2>
        <div className="featured-controls">
          <Link href="/projects" className="featured-all">
            View all projects <ArrowRight />
          </Link>
          <div
            className="featured-arrows"
            role="group"
            aria-label="Browse featured projects"
          >
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={ends.start}
              aria-label="Previous projects"
            >
              <ArrowRight className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={ends.end}
              aria-label="Next projects"
            >
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
      <div ref={railRef} className="featured-rail">
        {projects.map((project, index) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="featured-card"
          >
            <div className="featured-image">
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(max-width:639px) 90vw, (max-width:1023px) 44vw, 29vw"
                className="object-cover"
              />
            </div>
            <div className="featured-caption">
              <span className="featured-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
