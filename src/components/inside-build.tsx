"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { projects } from "@/data/projects";
import { constructionSpring } from "@/lib/construction-motion";
import { ArrowRight, ArrowUpRight } from "./icons";
import { ProjectCard } from "./project-card";
import DesktopConstructionScene from "./desktop-construction-scene";
import styles from "./inside-build.module.css";

const sourceRoot = "https://github.com/liang799/tianpok.com/blob/main/";
const tabs = ["Structure", "Components", "Motion"] as const;
type Tab = (typeof tabs)[number];
const layers = [
  {
    title: "Page & content",
    tag: "NEXT.JS · SERVER",
    file: "src/app/page.tsx",
    heading: "Content first. Interactivity where it matters.",
    description:
      "The page composes focused components. Its headline, projects, metadata, and links arrive as HTML, so the essentials work before JavaScript loads.",
    code: `// Home page composition · abridged\n<ConstructionHero>\n  <h1>I build software.</h1>\n</ConstructionHero>\n<FeaturedWork projects={projects} />\n<InsideBuild />`,
  },
  {
    title: "Reusable components",
    tag: "REACT · TYPESCRIPT",
    file: "src/components/project-card.tsx",
    heading: "A component, not a copied screen.",
    description:
      "Project cards receive typed data and own their presentation. The project index and this workbench use the same component; Storybook exercises it in isolation.",
    code: `type Project = {\n  slug: string;\n  title: string;\n  description: string;\n  tags: string[];\n  // image, category, overview…\n};\n\n<ProjectCard project={project} />`,
  },
  {
    title: "Motion & safeguards",
    tag: "MOTION · ACCESSIBILITY",
    file: "src/components/construction-hero.tsx",
    heading: "Movement with a fallback.",
    description:
      "Native scroll drives a shared spring and individually layered artwork. Reduced-motion preferences and browsers without JavaScript receive the finished scene with ordinary scrolling.",
    code: `const progress = useSpring(\n  scrollYProgress,\n  constructionSpring,\n);\n\n<DesktopConstructionScene\n  progress={progress}\n  animated\n/>`,
  },
] as const;

function SourceLink({ path }: { path: string }) {
  return (
    <a
      href={`${sourceRoot}${path}`}
      target="_blank"
      rel="noreferrer"
      className={styles.sourceLink}
    >
      View source <ArrowUpRight />
    </a>
  );
}

function MotionWorkbench() {
  const [percent, setPercent] = useState(35);
  const input = useMotionValue(0.35);
  const smooth = useSpring(input, constructionSpring);
  const reducedMotion = useReducedMotion();
  const id = useId();
  const seek = (value: number) => {
    setPercent(value);
    input.set(value / 100);
  };

  return (
    <>
      <div className={styles.motionPreview}>
        <div className={styles.previewCaption}>
          <span>LIVE COMPONENT</span>
          <span>Scroll → spring → layers</span>
        </div>
        <DesktopConstructionScene
          progress={reducedMotion ? input : smooth}
          animated
        />
        <div className={styles.motionControls}>
          <label htmlFor={id}>
            Assembly progress <output htmlFor={id}>{percent}%</output>
          </label>
          <input
            id={id}
            type="range"
            aria-label="Assembly progress"
            min="0"
            max="100"
            step="1"
            value={percent}
            onChange={(event) => seek(Number(event.target.value))}
          />
          <div className={styles.seekButtons}>
            {[
              ["Start", 0],
              ["Halfway", 50],
              ["Complete", 100],
            ].map(([name, value]) => (
              <button
                key={name}
                type="button"
                onClick={() => seek(Number(value))}
              >
                {name}
              </button>
            ))}
            <span>
              {reducedMotion
                ? "Reduced motion · instant updates"
                : "Shared hero spring"}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.inspector}>
        <p className={styles.panelEyebrow}>03 / THE MOVEMENT</p>
        <h3>The same mechanism. In your hands.</h3>
        <p>
          Scrub the sequence forward and backward. This is the hero’s actual
          component, with the same spring settings and construction layers.
        </p>
        <div className={styles.codeHeader}>
          <span>Shared spring · current input</span>
          <span>TS</span>
        </div>
        <pre className={styles.code}>
          <code>{`// Shared settings · abridged\nconst constructionSpring = {\n  stiffness: ${constructionSpring.stiffness},\n  damping: ${constructionSpring.damping},\n  mass: ${constructionSpring.mass},\n};\n\n// Current workbench input\ninput.set(${(percent / 100).toFixed(2)});`}</code>
        </pre>
        <SourceLink path="src/components/desktop-construction-scene.tsx" />
      </div>
    </>
  );
}

function ComponentWorkbench() {
  const [slug, setSlug] = useState("vigour");
  const project = projects.find((item) => item.slug === slug) ?? projects[0];
  const id = useId();
  return (
    <>
      <div className={styles.componentPreview}>
        <div className={styles.previewCaption}>
          <span>LIVE COMPONENT</span>
          <span>ProjectCard</span>
        </div>
        <div className={styles.cardPreview}>
          <ProjectCard project={project} />
        </div>
        <label className={styles.dataControl} htmlFor={id}>
          Project data
          <select
            id={id}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          >
            {projects.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.inspector}>
        <p className={styles.panelEyebrow}>02 / THE COMPONENTS</p>
        <h3>Change the data. Keep the system.</h3>
        <p>
          Switch projects to see typed props update the actual card. Try its
          hover, keyboard focus, and link. The same component is used on the
          project index.
        </p>
        <div className={styles.codeHeader}>
          <span>project-card.tsx</span>
          <span>TSX</span>
        </div>
        <pre className={styles.code}>
          <code>{`const project = projects.find(\n  ({ slug }) => slug === "${slug}",\n);\n\n<ProjectCard project={project} />`}</code>
        </pre>
        <SourceLink path="src/components/project-card.tsx" />
      </div>
    </>
  );
}

export function InsideBuild() {
  const [tab, setTab] = useState<Tab>("Structure");
  const [layer, setLayer] = useState(0);
  const [inspecting, setInspecting] = useState(false);
  const exposeRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const selected = layers[layer];
  const restoreFocus = useCallback(() => {
    const target =
      exposeRef.current ??
      tabRefs.current.find(
        (button) => button?.getAttribute("aria-selected") === "true",
      );
    target?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!inspecting) return;
    const root = document.documentElement;
    root.dataset.inspectLayout = "true";
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setInspecting(false);
        restoreFocus();
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      delete root.dataset.inspectLayout;
      document.removeEventListener("keydown", close);
    };
  }, [inspecting, restoreFocus]);

  function navigateTabs(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[next]);
    tabRefs.current[next]?.focus();
  }

  return (
    <section
      id="inside-the-build"
      className={styles.section}
      aria-labelledby={`${id}-title`}
      data-component="InsideBuild"
    >
      <div className="site-container">
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{"// INSIDE THE BUILD"}</p>
            <h2 id={`${id}-title`}>
              Good software.
              <br />
              <span>Open to inspection.</span>
            </h2>
          </div>
          <div className={styles.intro}>
            <p>
              A skeleton watch reveals its movement.
              <br />
              Here, you can look beneath the interface—at the structure,
              components, and decisions that make it work.
            </p>
            <a href="/storybook/index.html" target="_blank" rel="noreferrer">
              Open component workshop <ArrowUpRight />
            </a>
          </div>
        </div>

        <div className={styles.workbench}>
          <div className={styles.toolbar}>
            <div
              className={styles.tabs}
              role="tablist"
              aria-label="Explore the inner workings"
            >
              {tabs.map((name, index) => (
                <button
                  key={name}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  id={`${id}-tab-${name}`}
                  role="tab"
                  type="button"
                  aria-selected={tab === name}
                  aria-controls={`${id}-panel-${name}`}
                  tabIndex={tab === name ? 0 : -1}
                  onClick={() => setTab(name)}
                  onKeyDown={(event) => navigateTabs(event, index)}
                >
                  <span aria-hidden="true">0{index + 1}</span>
                  {name}
                </button>
              ))}
            </div>
            <span className={styles.liveLabel}>
              <span /> REAL COMPONENTS. OPEN SOURCE.
            </span>
          </div>
          {tabs.map((name) => (
            <div
              key={name}
              role="tabpanel"
              id={`${id}-panel-${name}`}
              aria-labelledby={`${id}-tab-${name}`}
              hidden={tab !== name}
              tabIndex={0}
              className={styles.panel}
            >
              {tab === name &&
                (name === "Motion" ? (
                  <MotionWorkbench />
                ) : name === "Components" ? (
                  <ComponentWorkbench />
                ) : (
                  <>
                    <div className={styles.structurePreview}>
                      <div className={styles.previewCaption}>
                        <span>THE ARCHITECTURE</span>
                        <span>Choose a layer ↓</span>
                      </div>
                      <div className={styles.layers}>
                        {layers.map((item, index) => (
                          <button
                            key={item.title}
                            type="button"
                            aria-pressed={layer === index}
                            onClick={() => setLayer(index)}
                            className={styles.layer}
                          >
                            <span
                              className={styles.layerNumber}
                              aria-hidden="true"
                            >
                              0{index + 1}
                            </span>
                            <span className={styles.layerBody}>
                              <span
                                className={styles.layerTag}
                                aria-hidden="true"
                              >
                                {item.tag}
                              </span>
                              <span className={styles.layerTitle}>
                                {item.title}
                              </span>
                              <span
                                className={styles.wireframe}
                                aria-hidden="true"
                              >
                                <i />
                                <i />
                                <i />
                              </span>
                            </span>
                            <ArrowUpRight />
                          </button>
                        ))}
                      </div>
                      <button
                        ref={exposeRef}
                        type="button"
                        className={styles.exposeButton}
                        aria-pressed={inspecting}
                        onClick={() => setInspecting((value) => !value)}
                      >
                        {inspecting ? "Hide page layout" : "Expose page layout"}
                        <ArrowRight />
                      </button>
                      <p className={styles.previewHint}>
                        Reveal component boundaries on this very page.
                      </p>
                    </div>
                    <div className={styles.inspector}>
                      <p className={styles.panelEyebrow}>01 / THE STRUCTURE</p>
                      <h3>{selected.heading}</h3>
                      <p>{selected.description}</p>
                      <div className={styles.codeHeader}>
                        <span>{selected.file.split("/").at(-1)}</span>
                        <span>TSX</span>
                      </div>
                      <pre className={styles.code}>
                        <code>{selected.code}</code>
                      </pre>
                      <SourceLink path={selected.file} />
                    </div>
                  </>
                ))}
            </div>
          ))}
          <div className={styles.assurance}>
            <p>
              <span aria-hidden="true">↳</span> The details are part of the
              design.
            </p>
            <div>
              <a
                href={`${sourceRoot}tests/construction.spec.ts`}
                target="_blank"
                rel="noreferrer"
              >
                Browser tests <ArrowUpRight />
              </a>
              <a
                href="/storybook/index.html?path=/story/illustrations-desktop-construction-scene--scroll-assembly"
                target="_blank"
                rel="noreferrer"
              >
                Motion stories <ArrowUpRight />
              </a>
              <a
                href={`${sourceRoot}src/components/inside-build.tsx`}
                target="_blank"
                rel="noreferrer"
              >
                This section’s source <ArrowUpRight />
              </a>
            </div>
          </div>
        </div>
        <noscript>
          <p className={styles.noScript}>
            The interactive workbench needs JavaScript. The source links remain
            available to inspect the implementation.
          </p>
        </noscript>
      </div>
      {inspecting && (
        <>
          <div className={styles.layoutGrid} aria-hidden="true" />
          <div className={styles.exitDock}>
            <span>
              <i /> Structure visible
            </span>
            <button
              type="button"
              onClick={() => {
                setInspecting(false);
                restoreFocus();
              }}
            >
              Exit structure view <span aria-hidden="true">×</span>
            </button>
          </div>
        </>
      )}
    </section>
  );
}
