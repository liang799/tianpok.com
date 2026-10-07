export type Project = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: "Apps" | "Web" | "Experiments";
  overview: string;
  image: string;
  imageAlt: string;
  url?: string;
};

// Project descriptions and destinations are based on the original portfolio:
// https://github.com/liang799/portfolio/blob/main/components/Portfolio.tsx
export const projects: Project[] = [
  {
    slug: "vigour",
    title: "Vigour",
    description:
      "An Android fitness app that rewards walking with cryptocurrency.",
    tags: ["Android", "Fitness", "Crypto"],
    category: "Apps",
    overview:
      "An Android fitness application that rewards users with cryptocurrency after they walk a specified number of steps. The project brings step-based activity and a rewards system into a mobile experience.",
    image: "/images/vigour.webp",
    imageAlt:
      "Vigour fitness app screens on Android phones, showing step rewards and Vigour Coin.",
    url: "https://github.com/liang799/Vigour",
  },
  {
    slug: "bellcurvehero",
    title: "BellCurveHero",
    description:
      "A dedicated copyright policy page, built with Next.js during my internship.",
    tags: ["Next.js", "Web", "Internship"],
    category: "Web",
    overview:
      "During my internship at BellCurveHero, I identified that customers were unclear about the company's copyright policy. I created a dedicated page using Next.js to explain the policy and make that information easier to find.",
    image: "/images/bellcurvehero.webp",
    imageAlt:
      "BellCurveHero copyright policy displayed on a tablet with keyboard and a phone.",
    url: "https://www.bellcurvehero.com/copyright",
  },
  {
    slug: "tree",
    title: "TREE",
    description:
      "A Bootstrap template turned into a dynamic website with PHP for my CSAD project.",
    tags: ["PHP", "Bootstrap", "Web"],
    category: "Web",
    overview:
      "For my CSAD project, I converted a Bootstrap template into a dynamic website using PHP. TREE presents an environmental organisation, with pages about its work, activities, and community.",
    image: "/images/tree.webp",
    imageAlt:
      "TREE environmental organisation website displayed on a desktop monitor and laptop.",
    url: "https://github.com/liang799/CSAD-Project",
  },
  {
    slug: "poketeams",
    title: "PokéTeams",
    description:
      "A Pokémon team builder app designed in Adobe XD as a personal project.",
    tags: ["Adobe XD", "Design", "Prototype"],
    category: "Experiments",
    overview:
      "A personal design project exploring a Pokémon team builder app in Adobe XD. The screens bring together Pokémon search, competitive tiers, and individual Pokémon information in a mobile interface.",
    image: "/images/poketeams.webp",
    imageAlt:
      "PokéTeams mobile design showing Pokémon search, competitive tiers, and Bulbasaur details.",
    url: "https://xd.adobe.com/view/9d1e5b95-4673-45ea-be94-07db8f1edcc0-c84d/",
  },
  {
    slug: "mindfulhacks-bot",
    title: "MindfulHacks Bot",
    description:
      "A Python Discord bot that shares music based on keywords in a conversation.",
    tags: ["Python", "Discord", "YouTube"],
    category: "Experiments",
    overview:
      "A Python Discord bot that responds to keywords stored in a database by sharing appropriate music videos from YouTube. Created for MindfulHacks, the project explores a small tool for supporting conversations through music.",
    image: "/images/bot.webp",
    imageAlt:
      "A laptop showing the MindfulHacks Discord bot sharing a YouTube music video.",
    url: "https://github.com/liang799/mental-health-sol",
  },
  {
    slug: "onesystem-technologies",
    title: "Onesystem Technologies",
    description:
      "A blog system and product promotional page for a freelance client.",
    tags: ["Web", "Freelance", "Blog"],
    category: "Web",
    overview:
      "As a freelancer for Onesystem Technologies PTE LTD, I created a blog system and a product promotional page. The project presents the client's products and provides a dedicated home for its blog content.",
    image: "/images/ost.webp",
    imageAlt:
      "Onesystem Technologies product website on a laptop alongside its blog on a phone.",
    url: "https://onesystemstech.com/blog",
  },
];
