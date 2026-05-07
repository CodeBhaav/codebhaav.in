# CodeBhaav v2 — Design Brief for Varent.ai

## What is CodeBhaav?

A student-led tech community from Amravati, India for self-taught developers. No courses, no certifications — just a space to build real projects, learn by doing, and connect with other devs who share the grind. Founded by a self-taught developer who started as an office boy in a tier-3 city.

**Brand voice:** Authentic, raw, honest. Anti-gatekeeping. "No fake guru energy." Warm but not childish. Credible but not corporate.

---

## Tech Stack

- **Framework:** Astro (static pages + React islands for interactive parts)
- **Backend:** Convex (real-time database)
- **AI:** Cloudflare Workers AI (powers the onboarding wizard)
- **Deploy:** Cloudflare Pages
- **Email:** Resend

---

## Design Direction

**Inspiration: Linear.app**

- Dark, polished, professional
- Subtle gradients used sparingly (hero background only)
- Clean typography does the heavy lifting — Inter for everything, Geist Mono for metadata/code
- Restrained color: mostly monochrome with a single violet (#8B5CF6) accent
- Subtle depth through faint borders (#1F1F23 on #09090B), not shadows or glows
- Structured grid layouts with generous whitespace
- NO blobs, NO floating shapes, NO glassmorphism, NO heavy gradients everywhere
- Moderate border-radius (8px cards, 6px buttons, 4px badges — nothing fully rounded)
- Minimal animation: opacity fades, subtle button hover, scroll fade-in. No parallax, no spring physics.
- Should feel like a real product, not a student project

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | #09090B | Page background |
| Surface | #111113 | Cards, elevated sections |
| Border | #1F1F23 | All borders, dividers |
| Text Primary | #FAFAFA | Headlines, body text |
| Text Secondary | #71717A | Descriptions, labels |
| Text Muted | #52525B | Metadata, timestamps |
| Accent | #8B5CF6 | CTAs, active states, links — used sparingly |
| Accent Hover | #7C3AED | Button hover states |
| Success | #22C55E | Online indicators, success states |
| Gradient | linear-gradient(135deg, #8B5CF6, #6366F1) | Hero headline text + primary CTA button ONLY |

### Typography

| Role | Font | Weight | Size | Color |
|------|------|--------|------|-------|
| Headline | Inter | Bold/Semibold | 36-56px, -0.02em tracking | #FAFAFA |
| Body | Inter | Regular | 15-16px | #FAFAFA or #71717A |
| Small body | Inter | Regular | 14px | #71717A |
| Label/Mono | Geist Mono | Regular | 12-13px | #52525B |
| Button | Inter | Medium | 14-15px | #FAFAFA |

### Component Specs

**Cards:** #111113 bg, 1px #1F1F23 border, 8px radius. No gradient borders. No background hover change — just border color to #2F2F35 on hover.

**Buttons:**
- Primary: #8B5CF6 solid fill, white text, 6px radius. Hover: #7C3AED.
- Secondary: transparent bg, 1px #1F1F23 border, #FAFAFA text, 6px radius.
- Ghost: no border, #71717A text, hover: #FAFAFA.

**Inputs:** #111113 fill, 1px #1F1F23 border, 6px radius. Focus: #8B5CF6 border (no glow/ring). Placeholder: #52525B.

**Tags/Badges:** #1F1F23 bg, #71717A text, 4px radius. Active: #8B5CF6/10% bg, #8B5CF6 text.

---

## Pages to Design

### 1. Landing Page (/)

**Nav (sticky):**
- Left: "CodeBhaav" text logo in Inter Semibold
- Right: Mission, Projects, Leaderboard (text links, #71717A) + "Join Waitlist" button (primary)
- 1px #1F1F23 bottom border

**Hero:**
- Background: #09090B with ONE subtle radial gradient — soft violet (#8B5CF6 at 6-8% opacity) radiating from center-top, fading to black. Like a distant spotlight.
- Center-aligned:
  - Headline (Inter Bold, 56px): "Code with Bhaav. Build with purpose."
  - Subtext (Inter Regular, 18px, #71717A, max-w 540px): "A community for self-taught developers. Learn by building real projects, not watching tutorials."
  - Primary CTA: "Join the Waitlist"
  - Counter (Geist Mono, 13px, #52525B): "2,847 developers in line"
- Generous whitespace. Nothing else.

**Features section:**
- Section label: "What we do" (Geist Mono, 12px, #52525B, uppercase)
- 3 cards in a row:
  1. Icon (simple line icon) + "Learn by building" + "No tutorials. Build real projects that solve real problems."
  2. "Community first" + "Connect with developers who share your journey."
  3. "Open source" + "Everything we build is open. Contribute and grow."

**About section:**
- Two columns.
- Left: "Built by students, for students." (Inter Bold 36px) + paragraph about the founder + "Learn more →" link (#8B5CF6)
- Right: dark card (#111113) with a code snippet or terminal mockup

**Stats bar (full width, bordered top and bottom):**
- 4 inline stats: "2,847 / In line" | "12 / Cities" | "100% / Open source" | "0 / Boring lectures"
- Numbers: Inter Bold 32px white. Labels: 14px #71717A.

**Footer:**
- Logo, quick links (About, Mission, Projects, Waitlist, Founding Member, Contact), resources, social (GitHub, Instagram)
- "From Amravati, India" — #52525B
- Legal: Terms | Privacy
- 1px #1F1F23 top border

---

### 2. Waitlist Onboarding — AI Step Wizard (/waitlist)

This is the star feature. NOT a chat interface. It's a step-by-step wizard where an AI asks one question at a time with clean, focused UI around each step. Should feel like Linear's workspace setup or Stripe's onboarding.

**Layout:**
- Top bar: "CodeBhaav" logo left. Thin progress bar center (2px height, #8B5CF6 fill for completed, #1F1F23 for remaining). "Skip to form →" link right (#52525B).
- Content: centered, max-width 480px, vertically centered on page.
- Background: #09090B with the same subtle violet radial gradient as landing hero (faint, for visual continuity).

**Each step has:**
- Step indicator: "Step X of 5" (Geist Mono, 12px, #52525B)
- AI prompt text: Clean text (Inter Regular, 20px, white) — NOT in a bubble or card. Just text. The AI's personality comes through in the wording.
- Input area below the prompt (varies by step)
- "Continue" button (primary, full width of content area). Disabled until input provided.
- "← Back" link (#52525B)

**Step 1 — Name:**
- AI: "Let's get you on the list. What's your name?"
- Input: Large text input, placeholder "Your name"

**Step 2 — Role:**
- AI: "Nice to meet you, [Name]. What do you do?"
- 3 option cards stacked vertically:
  - "Student" / "Currently studying" — #111113, 1px #1F1F23 border, 8px radius
  - "Professional" / "Working in tech"
  - "Self-learning" / "Learning independently"
  - Selected: 2px #8B5CF6 left border, faint violet background tint

**Step 3 — Email:**
- AI: "Where should we send your invite?"
- Input: Email input, placeholder "you@example.com"

**Step 4 — Interests:**
- AI: "What gets you excited?"
- Multi-select tag chips: Frontend, Backend, Mobile, UI/UX Design, AI/ML, Other
  - Default: #1F1F23 bg, #71717A text, 4px radius
  - Selected: #8B5CF6/10% bg, #8B5CF6 text

**Step 5 — Why:**
- AI: "Last one — why do you want to join CodeBhaav?"
- Textarea, placeholder "Tell us a bit about yourself..."
- Legal note below: "By continuing, you agree to our Terms and Privacy Policy." (#52525B, 13px)

**Success screen (after submission):**
- Checkmark icon (#22C55E)
- "You're in." (Inter Bold, 32px)
- "Your position: #[X]" (Inter, 18px, #71717A)
- Referral card (#111113, bordered):
  - "Share your referral link to move up"
  - Code displayed in Geist Mono with copy button
  - Share options: WhatsApp, X/Twitter, Copy Link
- "Return home" link

---

### 3. Referral Leaderboard (/leaderboard)

**Header:**
- "Leaderboard" (Inter Bold, 36px)
- "Refer friends, climb the ranks." (16px, #71717A)

**Your stats card (if user has a referral code):**
- Single #111113 card with horizontal layout:
  - Position: "#47" (Inter Bold 28px) / "Your position" (13px #71717A)
  - | divider
  - Referrals: "12" / "Referrals"
  - | divider
  - Code: "ARJUN-X7K2" (Geist Mono) / "Your code" + Copy button (#8B5CF6)
  - Share button (secondary) far right
- Below card: "23 more referrals until founding member access" (13px, #52525B)

**Leaderboard table:**
- Header row: RANK | NAME | REFERRALS — Geist Mono 11px #52525B uppercase
- Data rows separated by 1px #1F1F23 borders:
  - Rank (Geist Mono, #71717A), Name (Inter, white, masked: "Pr***v B."), Referrals (Geist Mono, white, right-aligned)
  - #1 row: rank number in #8B5CF6
  - Current user's row: subtle violet tint bg + 2px #8B5CF6 left border
- ~20 rows visible

**How it works sidebar (right on desktop, below on mobile):**
- 4 numbered steps connected by a thin #1F1F23 vertical line:
  1. "Join the waitlist"
  2. "Get your referral code"
  3. "Share with friends"
  4. "Top referrers get founding access"
- Numbers in #8B5CF6, text in #71717A

---

### 4. Founding Member Application (/founding-member)

**Two-column layout:**

**Left sidebar (sticky, 35%):**
- "Why become a founding member?" (Inter Semibold, 20px)
- Description paragraph
- 3 benefit cards (#111113, bordered):
  1. "Recognition" — "Be recognized as a founding member on our site"
  2. "Decision making" — "Help shape the direction of the community"
  3. "Early access" — "First access to all resources and events"
- "Just want to join?" box: "Join Waitlist Instead" link

**Right (65%) — Application form:**
- "Founding Member Application" heading
- "Limited spots available" badge (#1F1F23 bg, #71717A text)

- **Personal Information section:**
  - Full Name, WhatsApp Number, Email, GitHub (optional), LinkedIn (optional), Portfolio (optional)

- **Skills & Experience section:**
  - "What skills can you contribute?" (textarea)
  - "Your relevant experience" (textarea)

- **Motivation section:**
  - "Why founding member?" (textarea)
  - "Weekly time commitment" (textarea)
  - "Ideas for the community" (textarea, optional)

- Legal note + "Submit Application" button (primary)

**Success:** Same pattern as waitlist — checkmark, confirmation, return home.

---

### 5. Mission Page (/mission)

- "Our Mission" (Inter Bold, 36px)
- "Building something raw, real, and valuable for self-taught developers." (#71717A)

**The Problem section:**
- "The Problem We're Solving" heading
- Paragraph about tech communities focusing on hype over value, self-taught devs feeling like outsiders

**Core Values — 4 cards in 2x2 grid:**
1. "Authenticity" — "No fake guru energy. No overpriced fluff. Just honest learning."
2. "Practical Learning" — "Real-world projects, not theoretical knowledge. Learning by doing."
3. "Inclusivity" — "Everyone belongs, especially those without the 'perfect background.'"
4. "Open Source" — "Building in the open. Knowledge shared freely."

**Our Approach section:**
- Paragraph about starting small, building practical tools, fostering connections

**Bottom CTA:**
- "Join Our Mission" + "Become a Founding Member" button

---

### 6. Contact Page (/contact)

- "Contact Us" heading
- "Get in touch with the CodeBhaav team" subtitle
- Email: pranav@codebhaav.in
- Location: Amravati, Maharashtra, India
- Social: GitHub, Instagram

---

### 7. Projects Page (/projects)

- "Our Projects" heading
- Category filter tabs: All | Web | Mobile | AI | Open Source | Community
- Project cards grid (currently empty — show placeholder state)
- "Have a Project Idea?" CTA section with "Submit Project Idea" button

---

### 8. Privacy Policy (/privacy) & Terms (/terms)

Simple content pages. Long-form text with section headings. Same nav/footer. No special design needed — just clean readable typography on the dark background.

---

## Key User Flows

### Flow 1: Waitlist Signup
Landing page → Click "Join the Waitlist" → Step wizard (5 steps) → Success screen with referral code → Share or return home

### Flow 2: Referral
Receive referral link → Landing page (with referral param) → Step wizard → Success screen (shows position, credits referrer)

### Flow 3: Founding Member
Landing page → "Become a Founding Member" → Application form → Success screen

### Flow 4: Check Leaderboard
Nav → Leaderboard → See rankings → Copy own referral code → Share

---

## Mobile Considerations

- Nav collapses to hamburger menu
- Hero text scales down (36px headline)
- Feature cards stack vertically
- Wizard stays centered, full-width inputs
- Leaderboard sidebar moves below table
- Founding member form goes full-width, sidebar becomes top section

---

## What Makes This Site Special

The AI-powered step wizard is the differentiator. Students don't fill out a boring Google Form — they go through a polished, one-question-at-a-time experience that feels premium and personal. The AI adds personality to each prompt (casual, warm, slightly funny) while collecting the exact same data a form would. This is what should make students say "this is different from everything I've seen."

The design should communicate: "This community is serious, credible, and built by people who actually know what they're doing" — not "this is a weekend hackathon project." Linear-level polish applied to a community for self-taught devs from small-town India.
