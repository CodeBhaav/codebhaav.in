export const siteConfig = {
  name: "CodeBhaav",
  url: "https://codebhaav.in",
  description:
    "A community for self-taught developers, starting in Amravati. Waitlist open, founding member applications live.",
  tagline: "Code with Bhaav. Build with purpose.",
  cta: "Join the Waitlist",
  ctaHref: "/waitlist",
  location: "Amravati, India",

  nav: {
    links: [
      { id: "mission", name: "Mission", href: "/mission" },
      { id: "ideas", name: "Ideas", href: "/ideas" },
      { id: "projects", name: "Projects", href: "/projects" },
      { id: "leaderboard", name: "Leaderboard", href: "/leaderboard" },
      { id: "contact", name: "Contact", href: "/contact" },
    ],
  },

  hero: {
    badge: "Waitlist open",
    title: "Code with Bhaav.\nBuild with purpose.",
    description:
      "A community for self-taught developers, starting in Amravati. We haven't launched yet. The waitlist is open and we're taking applications for the founding circle.",
    cta: {
      primary: { text: "Join the Waitlist", href: "/waitlist" },
      secondary: {
        text: "Apply as a founding member",
        href: "/founding-member",
      },
    },
    footnote: "No fluff. No paid courses. Built in the open.",
  },

  stats: [
    { value: "Pre-launch", label: "Status" },
    { value: "Amravati", label: "Where we're starting" },
    { value: "Open", label: "Founding applications" },
    { value: "Free", label: "Always, for members" },
  ],

  features: [
    {
      id: "build",
      title: "Learn by building",
      description:
        "Less tutorials, more commits. We'll pair members on real projects so you ship something instead of getting stuck in tutorial loops.",
    },
    {
      id: "community",
      title: "Community first",
      description:
        "You won't be the only self-taught dev in your city for long. The community is online from day one and IRL where members are dense.",
    },
    {
      id: "open",
      title: "Open by default",
      description:
        "No paywalls, no proprietary courses. Everything we build for the community is open source, including this site.",
    },
  ],

  faq: [
    {
      question: "Are you live yet?",
      answer:
        "Not yet. We're pre-launch. Right now you can join the waitlist or apply for the founding circle. The community platform itself opens to founding members first, then the wider waitlist.",
    },
    {
      question: "What's a founding member?",
      answer:
        "A small group of self-taught developers who help shape what the community becomes. Founding members get early access, decision-making input on what we build, and recognition on the site. Applications are open right now.",
    },
    {
      question: "Where are you based?",
      answer:
        "Amravati, Maharashtra. We're starting in tier-3 India because that's where the founder is from and that's where most self-taught devs are figuring it out alone. The community itself will be online and global.",
    },
    {
      question: "What does Bhaav mean?",
      answer:
        "Bhaav means feeling, intent, soul. Code with Bhaav means writing code that means something to you, not just shipping for the sake of shipping or chasing a paycheck.",
    },
    {
      question: "How do I move up the waitlist?",
      answer:
        "Refer friends. Each successful referral moves you up. The earliest members and top referrers get founding-tier access when we open the platform.",
    },
    {
      question: "Is there a paid tier?",
      answer:
        "No. The community is free for members. We're not selling courses, certifications, or coaching. Long-term funding will come from sponsorships and grants, never from gating knowledge behind a paywall.",
    },
  ],

  footerLinks: [
    {
      title: "Pages",
      links: [
        { id: "mission", title: "Mission", url: "/mission" },
        { id: "projects", title: "Projects", url: "/projects" },
        { id: "leaderboard", title: "Leaderboard", url: "/leaderboard" },
        { id: "contact", title: "Contact", url: "/contact" },
      ],
    },
    {
      title: "Community",
      links: [
        { id: "waitlist", title: "Join Waitlist", url: "/waitlist" },
        {
          id: "founding",
          title: "Founding Member",
          url: "/founding-member",
        },
        {
          id: "github",
          title: "GitHub",
          url: "https://github.com/CodeBhaav",
        },
        {
          id: "instagram",
          title: "Instagram",
          url: "https://instagram.com/codebhaav",
        },
      ],
    },
    {
      title: "Legal",
      links: [
        { id: "privacy", title: "Privacy", url: "/privacy" },
        { id: "terms", title: "Terms", url: "/terms" },
      ],
    },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
