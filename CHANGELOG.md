# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- README titled "Daniel's Portfolio", showing the desktop home page with a button to a screenshot gallery
  (`SCREENSHOTS.md`: home and menu on desktop, tablet and phone), and a DivineFlow section (soon its
  own npm package; copyright Daniel Khojaste).
- About section, right under the hero and one screen tall: a short headline ("I build web apps that
  are fast, look sharp and hold up."), one line of text and three facts (based in, focus: full-stack development, currently building), with no lines above them.
  The text under the headline is there from the start. When it comes into view the headline lights
  up word by word, the red words are wiped in from the left (GSAP, a clip-path over a solid copy, so
  every letter fills completely), 0.9s each, one straight after the other
  (`animation.about.highlight`, `highlightGap`), with the facts sliding in alongside them
  (`restAfter`). It starts once the section's top is in the lower fifth of the screen (`start`), so
  it's done before you scroll on. Copy lives in
  `site.config.ts`; `[brackets]` mark the red words.
- Work section, after About: "Selected work", with Lineup, ApotheonAI and ToDone as big outlined
  names, one row each, with what each is, where it's at and the logos of the tools it's built with
  (`TechIcon`; SVGs kept in `src/assets/tech`, from Simple Icons and, for VS Code, Microsoft's
  Codicons). On desktop, hovering a row fills its name white
  (at the side nav's hover pace, no glow) and drops its screenshot open underneath, next to one plain
  sentence on what it's for, a few short points on what it does and its links (every project has
  its GitHub repo, plus the live site or the VS Code Marketplace); moving off closes it, and
  clicking keeps it open until it's clicked again. Phones and tablets open a project with a tap, one
  at a time, and the hint next to the headline says "Hover over" or "Click" to match. The section is
  anchored at the top, so opening a row only pushes the rows below it. On narrower screens the row
  stacks (name, then what it is and the tools), and on tablets and phones an open project shows its
  screenshot full width with the details underneath. No lines between the projects.
  Project names are a step smaller than the headline, with a touch of letter-spacing. Rows that
  slide under a still pointer while you scroll don't open or close until the mouse moves, so
  scrolling past an open project no longer collapses it under you. ToDone shows its GIF.
  Projects, copy and screenshots (`public/projects`) are in `site.config.ts` (`work`,
  `animation.work`).
- Skills section, after Work: "What I build with", one row per group (Languages, Front end &
  design, Back end & data, Apps, Tools, AI) with the group's name in big outlined type and its
  tools as logos, with no lines between rows. A filter (All, Lineup, ApotheonAI, ToDone, Portfolio)
  lights up the tools a project uses and fades the rest, and fills the names of the groups they're
  in; hovering a row fills its name, and hovering a logo turns it red and slides its name in under
  the logos. Group names are the same size as the Work section's project names, with the same touch
  of letter-spacing. All rows share one grid, so the names' column is as wide as the longest name and
  the logos never run into it at any screen size (a little smaller between phone and wide screens,
  so each row's logos stay on one line). Tools and which project uses
  them are in `site.config.ts` (`skills`, `animation.skills`); every logo is an SVG in
  `src/assets/tech`, drawn by `TechIcon`.
- Urlocker Consulting in the Work section, second after Lineup: the website of an Ontario craft
  brewery consultancy, built on Squarespace for the client (Mar to Jul 2025), with custom HTML, CSS
  and JavaScript, cross-browser checks and SEO tracked in Google Search Console. It shows the site's
  Sell page and links to the live site (a client site, so no GitHub repo). Its tools are in the
  Skills filter, with Squarespace and Google Search Console added to Tools.
- Background section, between Skills and Contact: "How I got here", in two parts, Experience
  (Freelancer, software developer, taking on projects; Web Designer & SEO Consultant at Urlocker
  Consulting) and Education (Algonquin College, Web Development and Internet Applications diploma,
  Dean's Honours List three terms). Each place is a row like the Projects section's: its name in
  big outlined type with the role and dates beside it; hovering (or tapping) opens the details
  underneath and fills the name, and clicking keeps it open. Copy in `site.config.ts`
  (`backgroundSection`, `animation.backgroundSection`). The side nav and menu list it.
- A Lighthouse budget in CI (`lighthouserc.json`, a `lighthouse` job, `npm run lighthouse` locally):
  three runs on the built page fail the build if performance drops under 80, accessibility under
  95, best practices or SEO under 95, the largest paint passes 4 s, layout shifts pass 0.1 or
  blocking time passes 300 ms. Reports are kept as a CI artifact. Today: 89 / 96 / 100 / 100.
- Icons made from the DK signature and the main colour, so they follow `brand`: a clear tab icon
  (white on dark tabs, the main colour on light ones, sized to read at 16 px), a 32 px PNG for
  browsers without SVG icons, and a 180 px home-screen icon for Apple devices
  (`scripts/favicon.ts`, built by the `favicon.svg`, `favicon-32.png` and `apple-touch-icon.png`
  pages).
- Accessibility:
  - a "Skip to content" link, the first thing Tab reaches;
  - closed project and background rows are out of reach until opened, so Tab never lands on a
    hidden link;
  - jumping to a section from the side nav or menu moves keyboard focus there too;
  - skill logos are no longer 39 separate tab stops (screen readers still read their names);
  - axe checks the whole page (WCAG 2.2 AA) in the tests, with motion and without, with every
    row open and with the menu open;
  - new keyboard tests cover the skip link, opening rows with Enter, the side nav and the menu.
- Security: a strict Content Security Policy on every page (scripts only from the site plus the
  one inline script by its hash, no plugins, requests only to the site and Web3Forms), worked out
  at build time (`integrations/security-headers.mjs`) and added as a `<meta>` tag, and a
  `_headers` file for the host with the same policy plus no framing (clickjacking), no MIME
  sniffing, a strict referrer policy, no camera/mic/location and HTTPS only.
- Contact form hardening: what's typed is cleaned before it's sent (no control characters, no line
  breaks in the name or email, so nothing can slip extra lines into the email), each field has a
  length limit (also set as `maxlength`), the email has to look real, the "need" must be one of
  the form's own choices, one message is sent at a time, a request that hangs gives up after 15
  seconds, and an incomplete form says what's missing (`contact.form.invalid`). Status messages
  are only ever set as plain text.
- The contact form now sends through Web3Forms. Its access key is in `site.config.ts`
  (`contact.form.accessKey`), public on purpose: it can only deliver messages to my inbox. Tests
  answer every Web3Forms request themselves, so running them never sends a real message.
- Contact section, last on the page: "Two ways to work together". Two cards side by side:
  "Hiring?" (a full-time role) and "Need a site?" (websites, web apps and redesigns, each with a
  line on what it covers). Each card's button glides down to the form with its choice already
  picked. The form asks for a name, an email, what you need (A website, A web app, A redesign, A
  full-time role, Something else) and a few words. With a Web3Forms access key
  (`contact.form.accessKey`, free for 250 messages a month) it sends from the page and says whether
  it went; without one it opens the visitor's email app with the message filled in. A hidden field
  catches spam bots. Beside the form, "Or reach me directly": Email, GitHub and LinkedIn as logos
  with their names, without spelling out the email
  address. On arrival the red word wipes in and the cards and form rise in
  (`animation.contact`). Copy is in `site.config.ts` (`contact`).
- Side nav on desktop, in place of the menu button: the sections down the left in grey caps.
  Hovering one lights it up white with a glow in the main colour, slides it right a little and turns
  its marker white (`animation.textHover`, `colors.textHover`, `animation.sideNav.nudge`). The
  current section is filled white with a glowing marker and a DivineFlow underline with its own,
  flatter settings (`sideNavUnderlineFlow`). Moving to another section, the old label empties and
  the new one fills at the underline's pace (`animation.sideNav.labelIn` / `labelOut`). Hidden on
  the hero; phones and tablets keep the menu button.
- Smooth scrolling (GSAP ScrollSmoother, `animation.scroll`, 1.6s): the page glides to a stop, and section
  links glide to their section. Off for reduced motion and, by default, on touch screens.
- A fixed dark red glow behind the sections after the hero (`colors.sectionGlow`).
- The Lineup link in About nudges its arrow up and right on hover, like the hero's Lineup link.
- Hovering the DK logo makes it glow in the main colour itself, without growing (`colors.logoHover`,
  `animation.logoHover`).
- Settings for all of the above in `site.config.ts` (timings, side nav marker, underline settings per
  device).
- One main colour (`brand` in `site.config.ts`) that every colour is worked out from
  (`scripts/brand.ts`): buttons, highlights, glows, the hero's last name, the section glow, the
  logo hover, every DivineFlow palette, and a faint tint in the background and text. Each shade
  turns and saturates with the main colour but keeps its designed lightness. In CSS they're
  `--shade-*` variables. The hero photo is regraded to match with a CSS filter (none for the
  original red).
- Shared timings (`motion` in `site.config.ts`: quick, hover, draw, glide, plus matching CSS and
  GSAP eases), which the hovers, fills, underlines and smooth scrolling now use. In CSS:
  `--motion-*`, `--ease-out` and `--ease-in-out`.
- Text link hover (`.text-link`): the same glow as the side nav's labels, at the same pace, without
  the movement, for links in running text.
- Scroll prompt at the bottom of the hero ("Scroll to see more", `hero.scrollHint`): fades in right
  after the hero's animations (the signature and the DivineFlow draw-in) finish
  (`animation.scrollHint.gap` adds a pause; straight away with reduced motion). One line of small
  caps near the bottom edge, with a small downward chevron under it that bobs gently.
  It brightens on hover (no glow, so it keeps its weight), hides once you scroll and takes you to
  About when clicked.

- Search and sharing: a clearer description, Open Graph and Twitter card tags with a share image
  of the hero (`public/og.png`), a schema.org Person record, and `robots.txt`. Settings in
  `site.config.ts` (`seo`); the canonical link and absolute image address switch on once
  `seo.url` is set to the site's address.

### Changed

- About: the middle fact ("Focus") sits halfway between the other two, with equal gaps either side,
  while the first and last stay where they were. Phones keep the stacked list.
- Contact: what I can build is now three services side by side, straight on the page (an icon,
  the name and its line, with generous gaps), in place of the "Need a site?" card. The services' text
  is bigger (16px), and websites now "look sharp and run smoothly on any screen". Copy in `contact.services`.
- Copy pass across the site, from `notes/site-copy.md`:
  - About: "I build web apps that are fast, reliable and built to scale."
  - The side nav and menu call the hero "Home".
  - Projects: Lineup's summary and points (it works for soccer, volleyball, basketball and other
    team sports), "In development"; Urlocker Consulting's summary (the full brand and site, and
    its newsletter) and points; ApotheonAI is a "Concept website" with new points (designed in
    Figma, built with Astro, TypeScript and Tailwind CSS, a Sanity blog, GSAP and tests); ToDone's
    points (the Sublime Text format in VS Code, priorities and states, multi-cursor commands, the
    Outline view and theme-proof colours).
  - Prompts: "Hover over a project for details" ("Tap a project for details" on touch screens);
    Background says "an item".
  - Background: Freelancer "Present" and "Accepting new projects"; Urlocker's design and
    newsletter; Algonquin's coursework from the transcript.
  - Search: the description says npm packages instead of editor extensions.
- My legal name: the footer reads © Aref "Daniel" Khojaste, the search description starts with it,
  and search engines get all three names (Daniel Khojaste, Aref Khojaste, Aref "Daniel" Khojaste)
  as keywords, the author and the person's "also known as" names (`profile.legalName`,
  `profile.fullName`, `profile.searchNames`).
- Contact no longer has the "Hiring?" card. Under its headline, now "Let's work together", two
  short lines with a pulsing dot say what I'm open to: "Open to software developer roles" and
  "Available for freelance projects". Background says "Open to full-time roles, in Canada or
  remote" the same way, under its headline (`components/Availability.astro`; the lines are `availability` in `contact` and
  `backgroundSection`). "Need a site?" now spans the full width.
- Phones and tablets: the menu's section names shrink to fit the screen, so the longest
  ("Background") is never cut off; and the DK logo tucks away while you scroll down, so it no longer
  sits on the text, and comes back as soon as you scroll up (`scripts/logo-hide.ts`).
- Side nav: a section's underline waits a moment (`animation.sideNav.underlineDelay`, 0.3 s) before
  drawing, so jumping far (Contact to About) no longer flashes a dot under each section passed on
  the way.
- Urlocker Consulting uses Daniel's own crop of the Sell page screenshot.
- The contact form has more room between its fields, and the Send button sits a little lower,
  clear of the message field.
- The Projects and Background prompts read "Hover over an item for more details" ("Click an item
  for more details" on touch screens), and the red stars beside their points are centred on the
  first line of each point.
- Urlocker Consulting's screenshot is now its Sell page (`urlocker-consulting.jpg`), cropped to the frame (16:9, no
  scrollbar) and kept in view from the top (`focus` on a project, a CSS object-position). The SEO
  wording is plainer ("handled its SEO", "better SEO"), and Algonquin is a "College diploma".
- The Work section is now called Projects (side nav, menu, its label and `#projects` in the
  address). The headline stays "Selected work".
- Hovering the logo now writes a brush stroke under it instead of glowing: one simple stroke on a
  slight arc, blunt at the start and tapering to a point, drawn left to right in 0.45s. Its look is
  set in `site.config.ts` (`animation.logoUnderline`): `style` ("single", "double" for a shorter
  second stroke underneath, or "off" to go back to the glow), `drop` (how far below the logo, in
  px), `curve` (0 straight, 1 the full arc), `weight` and `draw` (seconds).
- Work screenshots are served resized, in AVIF and WebP at full quality (`src/assets/projects`),
  and ToDone's recording is a looping muted video (WebM and MP4) instead of a GIF: the page
  weighs about 430 KB instead of about 2 MB. The page's colour and timing variables moved from
  `<html>` into a `<style>` block, so the charset comes first.

- The tab title reads "Daniel Khojaste | Software Developer" (a bar instead of the em dash).

- The hero's "View my work" and "Get in touch" buttons are gone; the scroll prompt takes their place.
- Menu underline settings: no tail sway, faster glide (`travelSpeed` 6) and 30 sparkles.
- The placeholder Contact section is gone, replaced by the real one.
- Sections run Intro, About, Work, Skills, Contact; every section is at least one screen tall and
  section headings no longer have numbers.
- The side nav fill and About's red-word wipe start on the first letter: the wipe no longer crosses
  empty space first, and hover fills use an ease that starts at full speed.

## [0.1.0-alpha.1] - 2026-10-31

### Added

- Astro 7 project with strict TypeScript, Prettier and EditorConfig.
- Base layout with self-hosted Archivo (variable width) and Inter fonts, dark design tokens and
  reduced-motion defaults.
- Playwright end-to-end setup (desktop and mobile projects) with a smoke test.
- GitHub Actions CI: format check, type check, unit tests, build and end-to-end tests.
- DivineFlow (`src/lib/divine-flow`): framework-agnostic canvas renderer for the light-filament background,
  with themes (gold, crimson, violet, white), per-filament colour variance within configurable hue and
  lightness ranges, one-sided strands (`sides`), fan `spread`, wave `amplitude`, a `tilt` angle,
  `wave`, `tailSway`, `thickness`, `uniform`/`alpha` strands, a draw-in `reveal` with `revealStagger`, ambient embers, a
  frame-rate cap, reduced-motion support and unit tests. Light pulses and sparkles glide smoothly
  (pulses are one gradient stroke ending exactly at their position, not snapped to samples) and fade in
  and out instead of popping; their speed is adjustable (`travelSpeed`). Gradients and sprites are cached and the bloom
  is a separate GPU-scaled layer, so frames are cheap.
- Full-viewport hero (`100svh`, 600px floor on desktop, 480px on compact screens) with the masthead name
  ("DANIEL" in white, "KHOJASTE" as a deep red shape behind the throne so the photo leads), the throne
  photo at 90% of the hero height and centred calls to action.
- Two hero claims on either side of the throne, low in the hero: "Software Developer" (based in Canada)
  and the current project (Lineup, linked), in white expanded caps with a red glow. Their labels and
  the first lines of their headlines always line up.
- DivineFlow draws in on load, at the same time as the logo: filaments grow out from the origin towards
  the sides (GSAP-driven, skipped for reduced motion), with a bright tip leading each one.
- Tablet and mobile share the desktop composition (large throne, info and buttons over a bottom scrim),
  and the whole hero fits on portrait phones without scrolling.
- `src/site.config.ts`: one file for everything tweakable: the copy, every animation timing (logo,
  DivineFlow draw-in, menu, hovers), the DivineFlow colours and options, and the menu underline.
- Real copy: based in Canada, and Lineup (linked) as the current project.
- Full-screen menu with the section links centred over a blurred page. Hovering, focusing or pressing a
  link draws a single strand of the background's DivineFlow with a gentle "~" wave, from the centre,
  the left or the right (set in `site.config.ts`), fading out at both ends. It eases in and out, its
  tail ends sway slowly up and down while it stays one smooth curve, and its sparkle and light pulse
  glide along it. Every link draws the same strand, in its own configurable colour (`colors.menuUnderline`,
  the background's red by default). Esc, a section link or a click anywhere else closes it; the rest of the page is
  inert while it is open, and DivineFlow pauses behind it.
- The header (logo and menu button) stays fixed at the top while scrolling.
- Crimson DivineFlow background in varying shades of deep red (never drifting towards orange) with
  drifting embers behind the hero, with separate settings for compact screens.
- Header with the DK logo, written stroke by stroke on page load like handwriting (GSAP DrawSVG; skipped
  for reduced motion), and a hamburger menu button on every screen size. The K's stem writes as a clean
  italic I before its arm and leg.
- DivineFlow draws in a web worker on `OffscreenCanvas`es (one worker shared by every flow on the page),
  so the main thread only handles layout and input: in testing, the page's main thread went from ~79%
  busy to ~3% while the hero animates, and stayed at 60fps on a 4x-throttled CPU (24fps before).
  Browsers without `OffscreenCanvas` draw on the main thread as before.
- Smooth intro: the DivineFlow bloom layer composites without a blend mode and the hero caps its pixel
  density at 1.5, so the logo, the draw-in and hovers stay smooth together. The fonts and the hero
  photo are preloaded.
- Placeholder Work, Skills, About and Contact sections (lorem ipsum) and a footer, so the page scrolls
  and the hero links have targets.
- SVG favicon from the DK logo.
- Unit tests for the site's client scripts (Vitest) and end-to-end tests for the hero, header and menu.

[Unreleased]: https://github.com/DanielKhojaste/dk-portfolio/compare/v0.1.0-alpha.1...dev
[0.1.0-alpha.1]: https://github.com/DanielKhojaste/dk-portfolio/releases/tag/v0.1.0-alpha.1
