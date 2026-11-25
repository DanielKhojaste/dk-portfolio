/**
 * Site settings: everything you might want to tweak lives here, so components never need editing for it.
 *
 *   1. Copy          what the site says about you, and the page's sections
 *   2. Animation     the site's shared pace (motion), then every timing that uses it (seconds)
 *   3. Colours       the main colour, and every colour worked out from it
 *   4. DivineFlow    the hero background and the underlines (menu and side nav)
 *
 * Save the file and `npm run dev` reloads the page.
 */
import type { DivineFlowOptions, DivineFlowPalette, RGB } from "./lib/divine-flow";
import { brandFlow, brandShades, type Shades } from "./scripts/brand";
import type { CaptionAt } from "./scripts/skills";
import { dkLogoPens } from "./assets/brand/dk-logo-pens";

/* ------------------------------------------------------------------------------------------------
 * 1. Copy
 * --------------------------------------------------------------------------------------------- */

export interface LinkItem {
	label: string;
	href: string;
}

export const profile = {
	/** The name I go by, used across the site. */
	name: "Daniel Khojaste",
	/** My legal name, and both together: in the footer and for search engines. */
	legalName: "Aref Khojaste",
	fullName: 'Aref "Daniel" Khojaste',
	/** The names people might search for me by (search engines' keywords and "also known as"). */
	searchNames: ["Daniel Khojaste", "Aref Khojaste", 'Aref "Daniel" Khojaste'],
	/** Hero: the big claim on the left. */
	role: "Software Developer",
	/** Hero: "Based in <location>". */
	location: "Canada",
	/** Hero: "Currently building <name>", linking to `href` in a new tab. */
	currently: {
		name: "Lineup",
		href: "https://github.com/DanielKhojaste/lineup",
	},
} as const;

/** How the site shows up in search results and when it's shared (BaseLayout). */
export const seo = {
	title: "Daniel Khojaste | Software Developer",
	description:
		'Aref "Daniel" Khojaste is a full-stack software developer in Canada, building web apps, desktop tools and npm packages.',
	/**
	 * The site's address (no trailing slash): the canonical link and the absolute share-image
	 * address. Empty leaves both out. The same address is the Website URL in Web3Forms.
	 */
	url: "https://www.danielkhojaste.com",
	/** The picture shown when the site is shared (in public/), 1200×630. */
	image: "/og.png",
	imageAlt: 'Aref "Daniel" Khojaste, software developer.',
	/** Profiles, for search engines' "this person" card. */
	sameAs: ["https://github.com/DanielKhojaste", "https://www.linkedin.com/in/aref-khojaste/"],
};

/** The hero. */
export const hero = {
	/** The prompt that fades in at the bottom of the hero after a few seconds. */
	scrollHint: "Scroll to see more",
	/**
	 * How much darker the throne photo is: 0 is the original, 0.05 is 5% darker, 0.1 is 10%, up to
	 * 0.5 for half as bright. Try 0.05, 0.1, 0.2, 0.3, 0.4 or 0.5.
	 */
	photoDarken: 0.05,
};

/** Page sections, top to bottom. Used by the side nav (desktop) and the menu (phones and tablets). */
export const sections: readonly LinkItem[] = [
	{ label: "Home", href: "#intro" },
	{ label: "About", href: "#about" },
	{ label: "Projects", href: "#projects" },
	{ label: "Skills", href: "#skills" },
	{ label: "Background", href: "#background" },
	{ label: "Music", href: "#music" },
	{ label: "Contact", href: "#contact" },
];

/** The full-screen menu on phones and tablets. */
export const menu = {
	/** The section names: "center" or "left" (lined up with the logo). */
	align: "center" as "left" | "center",
};

/** The section list down the left on desktop. */
export const sideNav = {
	/** Shown before each label; the current section's glows. Set to "" to drop it. */
	marker: "✦",
};

/** The About section, right under the hero. */
export const about = {
	/** Small label above the headline. */
	eyebrow: "About",
	/** Words in [brackets] are highlighted in red when the section comes into view. */
	headline: "I build web apps that are [fast], [reliable] and built to scale.",
	text: "I'm Daniel, a software developer based in Canada. I work across the stack, from the interface you touch to the systems behind it.",
	facts: [
		{ label: "Based in", value: profile.location },
		{ label: "Focus", value: "Full-stack development" },
		{ label: "Currently Building", value: profile.currently.name, href: profile.currently.href },
	] as readonly { label: string; value: string; href?: string }[],
};

/** A project in the Work section. */
export interface Project {
	name: string;
	/** What it is, and where it's at: shown small next to the name. */
	kind: string;
	status: string;
	/** One plain sentence on what it's for, shown when the project is open. */
	summary: string;
	/** A few short points on what it does, in plain words (no jargon). */
	features: readonly string[];
	/** Tools used, shown as their logos next to the name (see components/TechIcon.astro). */
	stack: readonly string[];
	/**
	 * Where the project lives, opened in a new tab. Every project with code of its own has its GitHub
	 * repo here (a client site may only have its live address).
	 */
	links: readonly LinkItem[];
	/**
	 * Screenshot in src/assets/projects, shown when the project is open. It's served resized and in
	 * modern formats (AVIF, WebP) at full quality, so keep the original here as large as you like.
	 */
	image: string;
	/**
	 * Optional screen recording, played (muted, looping) instead of the screenshot: the path in
	 * public/ without its extension, with a .webm and an .mp4 there.
	 */
	motion?: string;
	/** What the screenshot shows, for screen readers. */
	alt: string;
	/**
	 * Optional: which part of the screenshot to keep in view when the frame crops it, as a CSS
	 * object-position ("50% 0%" keeps the top). Default "50% 30%".
	 */
	focus?: string;
}

/** The Work section, after About: one row per project that opens to show it. */
export const work = {
	eyebrow: "Projects",
	/** Words in [brackets] are highlighted in red when the section comes into view. */
	headline: "Selected [work]",
	/** The hint next to the headline, for mouse users and for touch screens. */
	prompt: {
		hover: "Hover over a project for details",
		click: "Tap a project for details",
	},
	projects: [
		{
			name: "Lineup",
			kind: "Desktop app",
			status: "In development",
			summary:
				"A tactical board app for coaches to design lineups, animate plays and build session libraries.",
			features: [
				"Drag and drop players on the pitch",
				"Plan formations, training drills and set plays",
				"Animate plays step by step to show how they unfold",
				"Works for soccer, volleyball, basketball and other team sports",
			],
			stack: ["Tauri", "React", "TypeScript", "Rust"],
			links: [{ label: "GitHub", href: "https://github.com/DanielKhojaste/lineup" }],
			image: "lineup.png",
			alt: "Lineup: a pitch with two teams' players placed by position, with the tools on the left and the player list on the right.",
		},
		{
			name: "Urlocker Consulting",
			kind: "Client website",
			status: "Live",
			summary: "Designed and built the site for an Ontario craft brewery consultant.",
			features: [
				"Turned the client's goals into a clear, easy-to-navigate site on Squarespace",
				"Wrote custom code to achieve the exact layout and behaviour",
				"Tested across browsers and devices before each update",
				"Implemented SEO best practices and monitored search performance in Google Search Console",
			],
			stack: ["Squarespace", "HTML", "CSS", "JavaScript", "Google Search Console"],
			links: [{ label: "Live site", href: "https://www.urlockerconsulting.com/" }],
			image: "urlocker-consulting.jpg",
			alt: "Urlocker Consulting's Sell page: a warmly lit brewery bar under the words Sell Your Ontario Craft Brewery.",
			focus: "50% 0%",
		},
		{
			name: "ApotheonAI",
			kind: "Concept website",
			status: "Live",
			summary: "The website of a made-up AI security company, built as if for a real client.",
			features: [
				"Designed the hero and key components in Figma before building them",
				"Built from reusable components and layouts that keep every page consistent",
				"A blog run from Sanity CMS: posts go live without touching the code",
				"Animated GSAP menu, keyboard-friendly navigation and end-to-end tests",
			],
			stack: ["Astro", "TypeScript", "Tailwind", "Sanity", "GSAP"],
			links: [
				{ label: "Live site", href: "https://apotheon-ai.vercel.app/" },
				{ label: "GitHub", href: "https://github.com/DanielKhojaste/apotheon-ai" },
			],
			image: "apotheon.png",
			alt: "ApotheonAI's home page: a bronze helmet over gold light filaments, with the words Ascend to the Divine.",
		},
		{
			name: "ToDone",
			kind: "VS Code extension",
			status: "Published",
			summary: "To-do lists kept as simple text files, right inside the code editor VS Code.",
			features: [
				"A VS Code port of the ToDone extension for Sublime Text, so the same files open in both",
				"Five priority levels, plus emergency, done and cancelled states that carry to subtasks",
				"Keyboard commands that work across multiple cursors and keep your notation",
				"Tasks in the Outline view and Go to Symbol, in colours that work with any theme",
			],
			stack: ["TypeScript", "VS Code"],
			links: [
				{
					label: "VS Code Marketplace",
					href: "https://marketplace.visualstudio.com/items?itemName=danielkhojaste.todone-vscode",
				},
				{ label: "GitHub", href: "https://github.com/DanielKhojaste/ToDone" },
			],
			image: "todone.png",
			motion: "/projects/todone-commands",
			alt: "ToDone in VS Code: commands raising priorities and ticking off tasks in a to-do file.",
		},
	] as readonly Project[],
};

/** A tool in the Skills section: its logo (by name, see components/TechIcon.astro) and where it's used. */
export interface Skill {
	name: string;
	/** Projects that use it: names from `work.projects`, or "Portfolio" (this site). */
	usedIn: readonly string[];
}

const everywhere = ["Lineup", "ApotheonAI", "ToDone", "Portfolio"];

/** The Skills section, after Work: one row per group of tools, filtered by project. */
export const skills = {
	eyebrow: "Skills",
	/** Words in [brackets] are highlighted in red when the section comes into view. */
	headline: "What I [build] with",
	/** The filter: every project in the Work section, plus this site ("Portfolio"). */
	projects: [...work.projects.map((p) => p.name), "Portfolio"] as readonly string[],
	/**
	 * Where a hovered logo's name shows: "under" (right under the logo), "above" (right over it) or
	 * "beside" (left of the row's logos, level with the row). It always stays on screen.
	 */
	captionAt: "beside" as CaptionAt,
	groups: [
		{
			title: "Languages",
			skills: [
				{ name: "TypeScript", usedIn: everywhere },
				{ name: "JavaScript", usedIn: ["ToDone", "Urlocker Consulting"] },
				{ name: "Python", usedIn: [] },
				{ name: "Java", usedIn: [] },
				{ name: "C#", usedIn: [] },
				{ name: "PHP", usedIn: [] },
				{ name: "Rust", usedIn: ["Lineup"] },
				{ name: "Dart", usedIn: [] },
			],
		},
		{
			title: "Front end & design",
			skills: [
				{ name: "React", usedIn: ["Lineup"] },
				{ name: "Next.js", usedIn: [] },
				{ name: "Astro", usedIn: ["ApotheonAI", "Portfolio"] },
				{ name: "HTML", usedIn: ["Lineup", "Urlocker Consulting", "ApotheonAI", "Portfolio"] },
				{ name: "CSS", usedIn: ["Lineup", "Urlocker Consulting", "ApotheonAI", "Portfolio"] },
				{ name: "Tailwind CSS", usedIn: ["ApotheonAI"] },
				{ name: "GSAP", usedIn: ["ApotheonAI", "Portfolio"] },
				{ name: "Figma", usedIn: ["Lineup", "Urlocker Consulting", "ApotheonAI", "Portfolio"] },
				{ name: "Illustrator", usedIn: [] },
			],
		},
		{
			title: "Back end & data",
			skills: [
				{ name: "Node.js", usedIn: [] },
				{ name: "Express", usedIn: [] },
				{ name: ".NET", usedIn: [] },
				{ name: "Spring Boot", usedIn: [] },
				{ name: "MySQL", usedIn: [] },
				{ name: "PostgreSQL", usedIn: [] },
				{ name: "MariaDB", usedIn: [] },
				{ name: "Sanity", usedIn: ["ApotheonAI"] },
			],
		},
		{
			title: "Apps",
			skills: [
				{ name: "Tauri", usedIn: ["Lineup"] },
				{ name: "Flutter", usedIn: [] },
				{ name: "PyQt", usedIn: [] },
			],
		},
		{
			title: "Tools",
			skills: [
				{ name: "Git", usedIn: everywhere },
				{ name: "Docker", usedIn: [] },
				{ name: "Playwright", usedIn: ["ApotheonAI", "Portfolio"] },
				{ name: "Squarespace", usedIn: ["Urlocker Consulting"] },
				{ name: "Google Search Console", usedIn: ["Urlocker Consulting"] },
			],
		},
		{
			title: "AI",
			skills: [
				{ name: "Codex", usedIn: ["ApotheonAI"] },
				{ name: "Claude Code", usedIn: ["Lineup", "ToDone", "Portfolio"] },
				{ name: "Cursor", usedIn: ["ApotheonAI"] },
				{ name: "GitHub Copilot", usedIn: [] },
			],
		},
	] as readonly { title: string; skills: readonly Skill[] }[],
};

/** A place in the Background section: a job, or a school. */
export interface BackgroundEntry {
	/** The place, in big type: the company, the school, or "Freelance". */
	name: string;
	/** Shown small beside it: the role or the qualification, then the dates. */
	role: string;
	when: string;
	/** One plain sentence, shown when the row is open. */
	summary: string;
	/** A few short points under it (can be empty). */
	points: readonly string[];
	/** Optional: a line with a softly pulsing dot under the points, for something ongoing. */
	badge?: string;
}

/**
 * The Background section, after Skills: where I've worked and studied, opened like Projects.
 * (`backgroundSection`, since `background` is the hero's.)
 */
export const backgroundSection = {
	eyebrow: "Background",
	/** Words in [brackets] are highlighted in red when the section comes into view. */
	headline: "How I [got] here",
	prompt: {
		hover: "Hover over an item for details",
		click: "Tap an item for details",
	},
	groups: [
		{
			title: "Experience",
			entries: [
				{
					name: "Freelancer",
					role: "Software developer",
					when: "Present",
					summary:
						"I build websites and web apps for clients and businesses, handling everything from design to launch.",
					points: [],
					badge: "Accepting new projects",
				},
				{
					name: "Urlocker Consulting",
					role: "Web Designer & SEO Consultant",
					when: "Mar – Jul 2025",
					summary: "Built and maintained the company's public website, and managed its SEO.",
					points: [
						"Designed the logo and every page, and built the site on Squarespace",
						"Performed cross-browser and responsive testing before every release",
						"Implemented SEO best practices and monitored search performance with Google Search Console",
						"Set up a newsletter that grew the client's outreach",
					],
				},
			],
		},
		{
			title: "Education",
			entries: [
				{
					name: "Algonquin College",
					role: "College diploma",
					when: "Jan 2024 – Aug 2025",
					summary:
						"Web Development and Internet Applications: web programming, web app development, databases, web security and project management, with a final project built for a real stakeholder.",
					points: ["Dean's Honours List: Winter 2024, Fall 2024 and Spring 2025"],
				},
			],
		},
	] as readonly { title: string; entries: readonly BackgroundEntry[] }[],
};

/** A song in the Music section. The colours are taken from the song's card in MUSIC.md. */
export interface Song {
	title: string;
	artist: string;
	album: string;
	/** Its Spotify track. */
	url: string;
	/** The cover, in src/assets/music. */
	cover: string;
	colors: {
		/** The card's outline. */
		border: RGB;
		/** The card's fill when hovered: dark top left to light bottom right. */
		dark: RGB;
		light: RGB;
		/** The artist's name. */
		artist: RGB;
	};
}

/**
 * The Music section, after Background: the songs from MUSIC.md on my GitHub profile, as cards that
 * link to Spotify. The cards are hollow (an outline and outlined title) until hovered, then fill in
 * with the song's colours. Lines too long for a card slide to show the rest (scripts/marquee.ts).
 */
export const music = {
	eyebrow: "Music",
	/** Words in [brackets] are highlighted in red when the section comes into view. */
	headline: "My coding [soundtrack]",
	text: "I love soundtracks, and since most have no vocals, they give me room to think while I code. These are the ones I play the most.",
	prompt: {
		hover: "Click a song to play it on Spotify",
		click: "Tap a song to play it on Spotify",
	},
	/** The small line over each title, as on the README cards. */
	label: "Recently played",
	/**
	 * The artist's name on a card: "quiet" keeps it grey until the card is hovered, then it takes the
	 * song's colour; "color" shows the song's colour all the time.
	 */
	artist: "quiet" as "quiet" | "color",
	songs: [
		{
			title: "Desert Chant",
			artist: "Timothée Chalamet & Hans Zimmer",
			album: "Dune: Part Three",
			url: "https://open.spotify.com/track/1aQUGQ7AcRxk96SX69gd4S",
			cover: "desert-chant.jpg",
			colors: {
				border: [226, 186, 108],
				dark: [52, 30, 13],
				light: [97, 54, 17],
				artist: [240, 196, 119],
			},
		},
		{
			title: "What Are You Going To Do When You're Not Saving The World?",
			artist: "Hans Zimmer",
			album: "Live in Prague",
			url: "https://open.spotify.com/track/44klKbTwlsqhIku1IyzowX",
			cover: "man-of-steel.jpg",
			colors: {
				border: [241, 107, 251],
				dark: [38, 14, 49],
				light: [57, 22, 77],
				artist: [219, 178, 249],
			},
		},
		{
			title: "Arsène",
			artist: "Mathieu Lamboley",
			album: "Lupin",
			url: "https://open.spotify.com/track/4vkmFustYM7mqMVZDIRDbj",
			cover: "arsene.jpg",
			colors: {
				border: [229, 127, 76],
				dark: [37, 26, 20],
				light: [103, 60, 36],
				artist: [240, 123, 70],
			},
		},
		{
			title: "Válgame Dios",
			artist: "Niña Pastori & Antonio Orozco",
			album: "Realmente Volando (En Directo)",
			url: "https://open.spotify.com/track/6GnHyBBUwSC0hvdi3G6ZVW",
			cover: "valgame-dios.jpg",
			colors: {
				border: [219, 85, 158],
				dark: [34, 30, 59],
				light: [104, 50, 105],
				artist: [243, 123, 186],
			},
		},
		{
			title: "Challenger",
			artist: "Leo Birenberg & Zach Robinson",
			album: "Cobra Kai: Season 3",
			url: "https://open.spotify.com/track/3vWZKWs92Q7eq0ySsekcaB",
			cover: "challenger.jpg",
			colors: {
				border: [153, 153, 179],
				dark: [40, 47, 51],
				light: [83, 102, 108],
				artist: [230, 220, 203],
			},
		},
		{
			title: "November Sky",
			artist: "Yanni",
			album: "If I Could Tell You",
			url: "https://open.spotify.com/track/3zFLqLlp8jnOSJJW9p8Iwh",
			cover: "november-sky.jpg",
			colors: {
				border: [127, 153, 204],
				dark: [24, 35, 59],
				light: [62, 90, 140],
				artist: [159, 182, 237],
			},
		},
		{
			title: "Dark Horse",
			artist: "Amanda Marshall",
			album: "Amanda Marshall",
			url: "https://open.spotify.com/track/170yC1xDfjyYRkL2JFFAL1",
			cover: "dark-horse.jpg",
			colors: {
				border: [229, 204, 204],
				dark: [45, 45, 42],
				light: [112, 108, 97],
				artist: [228, 218, 200],
			},
		},
		{
			title: "Now We Are Free",
			artist: "Ekaterina Shelehova & Emanuele Tedeschi",
			album: "Now We Are Free",
			url: "https://open.spotify.com/track/2MRzU88isUimYDUhPgxcEw",
			cover: "now-we-are-free.jpg",
			colors: {
				border: [255, 204, 128],
				dark: [46, 34, 30],
				light: [131, 96, 67],
				artist: [242, 194, 126],
			},
		},
		{
			title: "Clean",
			artist: "Taylor Swift",
			album: "1989",
			url: "https://open.spotify.com/track/06WgOCf0LV2h4keYXDRnuh",
			cover: "clean.jpg",
			colors: {
				border: [200, 182, 158],
				dark: [47, 42, 41],
				light: [110, 97, 91],
				artist: [221, 201, 168],
			},
		},
		{
			title: "Supermen",
			artist: "Dino Merlin & Željko Joksimović",
			album: "Burek",
			url: "https://open.spotify.com/track/3p6gkqKpSDUwIVY2ACcM2T",
			cover: "supermen.jpg",
			colors: {
				border: [239, 66, 66],
				dark: [66, 30, 13],
				light: [152, 39, 32],
				artist: [252, 240, 75],
			},
		},
	] as readonly Song[],
};

/** The Contact section, last on the page: two ways to work together, and one form for both. */
export const contact = {
	eyebrow: "Contact",
	/** Words in [brackets] are highlighted in red when the section comes into view. */
	headline: "Let's [work] together",
	email: "danielkhojaste101@gmail.com",
	/** Links under the form, as logos with their names (logos: components/TechIcon.astro). */
	links: [
		{ label: "Email", href: "mailto:danielkhojaste101@gmail.com" },
		{ label: "GitHub", href: "https://github.com/DanielKhojaste" },
		/** Leave an address empty to hide it. */
		{ label: "LinkedIn", href: "https://www.linkedin.com/in/aref-khojaste/" },
	] as readonly LinkItem[],
	/** What I'm open to: lines with a pulsing dot under the headline. */
	availability: [
		"Open to software developer roles",
		"Available for freelance projects",
	] as readonly string[],
	/** What I can build for you: one entry per service, each with an icon and a line. */
	services: {
		label: "What I can build for you",
		items: [
			{
				title: "Websites",
				icon: "website",
				text: "A site for your business or project, designed and built from scratch, that looks sharp and runs smoothly on any screen.",
			},
			{
				title: "Web apps",
				icon: "web-app",
				text: "Any web app your customers or team need, from booking systems and dashboards to custom tools, built from the front end to the database.",
			},
			{
				title: "Redesigns",
				icon: "redesign",
				text: "A modern refresh for your site: cleaner, faster and easier for customers to find.",
			},
		],
	},
	form: {
		/** The "What do you need?" choices; the first is picked to start with. */
		needs: ["A website", "A web app", "A redesign", "A full-time role", "Something else"],
		/**
		 * The Web3Forms access key (free at web3forms.com; see notes/contact-form.md). With a key the
		 * form sends messages straight to your inbox; set it to "" and Send opens the visitor's
		 * email app instead.
		 *
		 * Why it's public, here in the code: this key isn't a secret. The visitor's browser sends it
		 * with every message, so anyone can read it in the live page whatever we do, and all it can
		 * do is deliver a message to my inbox: it can't read, change or delete anything. Web3Forms'
		 * own setup puts it straight in the page's HTML. Their spam filter, and the form's Website
		 * URL setting in Web3Forms, guard against misuse. If spam ever gets through, make a new key
		 * at web3forms.com and replace this one. (Real secrets, like passwords or payment keys, must
		 * never go in the code.)
		 */
		accessKey: "2161df19-2f7e-4c42-a52a-35aed6d5e4c3",
		sent: "Thanks! Your message is on its way. I'll get back to you soon.",
		failed: "That didn't send. Please try again, or email me directly.",
		invalid: "Please add your name, a valid email and a few words.",
	},
	linksTitle: "Or reach me directly",
};

/* ------------------------------------------------------------------------------------------------
 * 2. Animation (seconds). Eases are GSAP ease names: https://gsap.com/docs/v3/Eases
 *    Everything is skipped for visitors who prefer reduced motion.
 * --------------------------------------------------------------------------------------------- */

/**
 * The site's pace. Timings below pick from these, so hovers, fills and glides move as one system:
 * change one here and everything that uses it follows. Things that need their own timing still set
 * a number directly.
 */
export const motion = {
	/** Small, immediate feedback: buttons, icons, borders. */
	quick: 0.2,
	/** Hovering text and links: colour changes, fills, underlines, arrows. */
	hover: 0.45,
	/** Things that draw or fill in by themselves: the red words in About. */
	draw: 0.9,
	/** Big, slow moves: DivineFlow underlines drawing out, the page catching up as you scroll. */
	glide: 1.1,
	/**
	 * Eases, as CSS (for transitions) and GSAP (for tweens) pairs that match. "out" starts at full
	 * speed and settles, which suits anything answering the pointer; "inOut" eases in and out.
	 */
	ease: {
		out: { css: "cubic-bezier(0.22, 1, 0.36, 1)", gsap: "power3.out" },
		inOut: { css: "cubic-bezier(0.65, 0, 0.35, 1)", gsap: "power2.inOut" },
	},
} as const;

/**
 * The side nav's current-section change: the new section's underline draws out and its label fills
 * in; the old one's underline draws back and its label empties. Shared, so underline and label move
 * together; animation.sideNav has a setting for each in case you want them apart.
 */
const sideNavChange = { in: motion.glide, out: 0.7 };

/** The DK signature in the header, written stroke by stroke. */
const logo = {
	delay: 0.2,
	/** Total writing time, shared between the strokes by length. */
	duration: 1.7,
	/** Pause between strokes, as if the pen lifts. */
	penLift: 0.08,
};

/** The red DivineFlow behind the hero, drawn out from the centre on load (alongside the logo). */
const background = {
	delay: 0.0,
	duration: 6.5,
	ease: "power1.out",
	/** Opacity fade-in of the whole canvas, under the draw-in. */
	fadeIn: 0.0,
};

/**
 * When the hero's own animations are done (seconds after load): the signature written out (its
 * strokes plus the pen lifts between them) and the DivineFlow drawn in, whichever ends last.
 */
const heroIntroEnd = Math.max(
	logo.delay + logo.duration + logo.penLift * (dkLogoPens.length - 1),
	background.delay + background.duration,
);

export const animation = {
	logo,

	background,

	/** The full-screen menu. */
	menu: {
		/** Fade of the whole overlay, in and out. */
		fade: 0.45,
		/** Each section link sliding up into place. */
		links: 0.75,
		/** Delay between one link and the next. */
		linkStagger: 0.06,
		/** The menu button's bars folding into an X, and its label swapping. */
		button: 0.4,
		/** The DivineFlow underline drawing out under a hovered or focused menu link, and back in. */
		underlineIn: motion.glide,
		underlineOut: 0.7,
		/** GSAP ease for both. */
		underlineEase: motion.ease.inOut.gsap,
	},

	/** The side nav (desktop). */
	sideNav: {
		/** The DivineFlow underline drawing out under the current section, and back in when you leave. */
		underlineIn: sideNavChange.in,
		underlineOut: sideNavChange.out,
		underlineEase: motion.ease.inOut.gsap,
		/**
		 * The current section's label filling in (and its marker lighting up), and emptying when you
		 * leave. Same speed and ease as the underline by default.
		 */
		labelIn: sideNavChange.in,
		labelOut: sideNavChange.out,
		labelEase: motion.ease.inOut.css,
		/** How far (px) a hovered label slides to the right, on top of the glow (textHover). */
		nudge: 4,
		/**
		 * Seconds a section must stay current before its underline starts drawing. Jumping far
		 * (Contact to About) passes the sections in between; without this wait, each would flash a
		 * tiny dot of underline on the way.
		 */
		underlineDelay: 0.3,
	},

	/**
	 * Hovering text: side nav labels and text links (like Lineup ↗ in About). The text fills white and
	 * glows in the main colour (colors.textHover).
	 */
	textHover: {
		duration: motion.hover,
		/** CSS easing. */
		ease: motion.ease.out.css,
	},

	/**
	 * Smooth scrolling (GSAP ScrollSmoother). The page still scrolls freely; it just glides to a stop
	 * instead of stopping dead. Off for reduced motion.
	 */
	scroll: {
		/**
		 * Seconds the page takes to catch up with the wheel or scrollbar. 0 turns it off. Tried on
		 * preview/polish: 0.6 (light), 1.1 (the shared glide), 1.6 (picked).
		 */
		smooth: 1.6,
		/** The same on touch screens. 0 keeps the phone's own scrolling, which already feels smooth. */
		smoothTouch: 0,
	},

	/** Hovering the logo with the underline off: it glows in the main colour (colors.logoHover). */
	logoHover: {
		duration: motion.hover,
		/** CSS easing. */
		ease: motion.ease.out.css,
	},

	/**
	 * Hovering the logo writes a brush stroke under it, on a slight arc: a little low on the left,
	 * rising to just past the middle, then dipping a touch as it tapers off to the right.
	 */
	logoUnderline: {
		/** "single", "double" (a shorter, thinner second stroke underneath) or "off" (glow instead). */
		style: "single" as "single" | "double" | "off",
		/** How far below the logo it sits, in px. Bigger is lower. */
		drop: 16,
		/** How much it bends: 0 is a straight line, 1 the full arc. */
		curve: 0.55,
		/** How thick it is: 1 is normal, 1.3 a third thicker. */
		weight: 1,
		/** Seconds to write it (the second stroke of "double" follows a beat later). */
		draw: 0.45,
	},

	/** The Work section. */
	work: {
		/** A project's row opening (the screenshot dropping down) and closing. */
		open: 0.7,
		close: 0.5,
		/** The headline's red word filling in when the section comes into view. */
		highlight: motion.draw,
		/** The rows rising in on arrival, one after another. */
		rows: 0.8,
		rowStagger: 0.1,
	},

	/** The Background section: rows open and close like Projects', and rise in the same way. */
	backgroundSection: {
		open: 0.6,
		close: 0.45,
		highlight: motion.draw,
		rows: 0.8,
		rowStagger: 0.1,
	},

	/** The Skills section. */
	skills: {
		/** The headline's red word filling in when the section comes into view. */
		highlight: motion.draw,
		/** The rows rising in on arrival, one after another. */
		rows: 0.8,
		rowStagger: 0.08,
	},

	/** The Music section: the headline's red word, the cards rising in, and long lines sliding. */
	music: {
		highlight: motion.draw,
		rows: 0.8,
		rowStagger: 0.06,
		/**
		 * Lines too long for their card slide when the card is hovered (scripts/marquee.ts): speed in
		 * px a second (steady, no easing), then seconds before the first move, resting on the end,
		 * and for each half of the fade back.
		 */
		marquee: { speed: 90, start: 0.3, wait: 1.5, fade: 0.4 },
	},

	/** The Contact section: the headline's red word, and the cards and form rising in. */
	contact: {
		highlight: motion.draw,
		rows: 0.8,
		rowStagger: 0.1,
	},

	/** The hero's scroll prompt. */
	scrollHint: {
		/**
		 * Seconds after the hero's own animations finish (the signature and the DivineFlow drawing
		 * in) before it fades in. 0 is straight after.
		 */
		gap: 0,
		/** When it fades in, worked out from the gap above. Not a setting: change `gap` instead. */
		get delay() {
			return heroIntroEnd + this.gap;
		},
		/** Its fade in and out. */
		fade: 0.8,
	},

	/** The About section, once it comes into view. */
	about: {
		delay: 0.25,
		/** The headline's words lighting up, one after another. */
		wordStagger: 0.05,
		word: 0.6,
		/** Each red word filling in, after the headline has lit up. */
		highlight: motion.draw,
		/** Pause between one red word finishing and the next starting. 0 for none. */
		highlightGap: 0,
		/** The facts (based in, focus, currently building) sliding in. The text above them is there from the start. */
		rest: 0.8,
		/** When the facts start: seconds after the headline lights up (so alongside the red words). */
		restAfter: 0.15,
		/**
		 * When it all starts: once the section's top is this far down the screen (0 top, 1 bottom).
		 * Higher starts sooner.
		 */
		start: 0.8,
	},

	/** Hover and focus feedback on buttons and icons: the hero buttons, the menu button's spin. */
	hover: motion.quick,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 3. Colours
 * --------------------------------------------------------------------------------------------- */

/**
 * The site's main colour, as [red, green, blue] (each 0–255). Everything coloured is worked out from
 * it: buttons, highlighted words, glows, the hero's last name, the background glow and every
 * DivineFlow filament, sparkle and ember (scripts/brand.ts). Even the near-black background and the
 * off-white text carry a faint tint of it. Change it and the whole site follows; the hero photo is
 * the one thing that doesn't, as its red is in the picture.
 *
 * This is the only colour setting: [200, 32, 43] is the original red. Try [37, 99, 235] (blue),
 * [124, 58, 237] (violet), [5, 150, 105] (green) or [217, 119, 6] (amber).
 */
export const brand: RGB = [200, 32, 43];

/** Every shade, worked out from `brand`. */
export const shades: Shades = brandShades(brand);

/** The DivineFlow palette, worked out from `brand`. */
const flow: DivineFlowPalette = brandFlow(shades);

/** A shade as CSS, optionally see-through. */
const rgb = ([r, g, b]: RGB, alpha = 1) =>
	alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;

export const colors: {
	background: DivineFlowPalette;
	menuUnderline: DivineFlowPalette;
	sideNavUnderline: DivineFlowPalette;
	textHover: { color: string; glow: string };
	logoHover: { color: string; glow: string; glowSize: number; core: string };
	sectionGlow: string;
} = {
	/**
	 * The hero's DivineFlow. Each of these can also be your own palette (see DivineFlowPalette), or
	 * one of DivineFlow's themes, if you want it to differ from the main colour.
	 */
	background: flow,
	/** The underline under hovered menu links. */
	menuUnderline: flow,
	/** The underline under the current section in the side nav. */
	sideNavUnderline: flow,
	/**
	 * Hovered text (side nav labels, text links): its colour, and the glow around it as a CSS
	 * text-shadow, in the main colour.
	 */
	textHover: {
		color: rgb(shades.text),
		glow: `0 0 14px ${rgb(shades.halo, 0.85)}, 0 0 2px ${rgb(shades.bright, 0.6)}`,
	},
	/**
	 * The logo while hovered: it stays white and glows in the main colour itself (the deeper red, not
	 * the lighter highlight shades, which read orange around white). `glowSize` is the wide glow's
	 * blur in px; `core` is a tight glow hugging the strokes.
	 */
	logoHover: {
		color: rgb(shades.text),
		glow: rgb(shades.accent),
		glowSize: 14,
		core: rgb(shades.accent, 0.95),
	},
	/**
	 * The glow behind every section after the hero. It stays put while the page scrolls. Any CSS
	 * colour; the alpha sets how strong it is.
	 */
	sectionGlow: rgb(shades.sectionGlow, 0.62),
};

/* ------------------------------------------------------------------------------------------------
 * 4. DivineFlow. Every option is documented in src/lib/divine-flow/README.md.
 * --------------------------------------------------------------------------------------------- */

type FlowOptions = Omit<DivineFlowOptions, "canvas" | "theme" | "palette" | "reveal">;

/** The hero background. `compact` overrides it on phones, tablets and portrait screens. */
export const backgroundFlow: { desktop: FlowOptions; compact: FlowOptions } = {
	desktop: {
		/** Animation speed and wave size. */
		motion: 1.6,
		/** Filaments per side, plus a few strays above and below. */
		lineCount: 8,
		scatterCount: 3,
		/** Where the filaments start (fractions of the hero) and how far out they emerge (px). */
		originY: 0.46,
		innerGap: 130,
		/** Per-filament shade variation, 0–1, picked within these hue (degrees) and lightness ranges. */
		variance: 0.7,
		hueRange: [-9, 0],
		lightRange: [-0.21, 0.07],
		/** Embers drifting up, and their speed. */
		emberCount: 70,
		emberSpeed: 0.9,
		/** Pixel density cap: lower is cheaper to draw. */
		maxDpr: 1.5,
	},
	compact: {
		originY: 0.46,
		lineCount: 6,
		scatterCount: 2,
		innerGap: 70,
		emberCount: 36,
	},
};

/** Settings for a DivineFlow underline. */
export interface UnderlineFlow {
	/**
	 * Where the strand starts drawing from: "center" (out to both sides), "left" (across to the right)
	 * or "right" (across to the left).
	 */
	from: "center" | "left" | "right";
	/** Height of the "~" wave in px (0 for a straight line), and how many waves across the word. */
	wave: number;
	waves: number;
	/** Line thickness, as a multiple of the background's filaments. */
	thickness: number;
	/** Brightness of the strand, 0–1. */
	alpha: number;
	/** How far (px) the two tail ends slowly sway up and down. 0 keeps it still. */
	sway: number;
	/** Speed of the sparkle and light pulse gliding along the strand. */
	travelSpeed: number;
	/** Animation speed. */
	motion?: number;
	/** Sparkles sliding along the strand. */
	sparkleCount: number;
}

// TODO: The middle of the wave looks like the two gradients are overlapping.
/**
 * The underline that draws out under a hovered or focused menu link (phones and tablets): one strand
 * of the background's DivineFlow (same colours) with a gentle "~" wave.
 */
export const menuUnderlineFlow: UnderlineFlow = {
	/**
	 * Where the strand starts drawing from: "center" (out to both sides), "left" (across to the right)
	 * or "right" (across to the left).
	 */
	from: "center",
	/** Height of the "~" wave in px (0 for a straight line), and how many waves across the word. */
	wave: 7,
	waves: 1,
	/** Line thickness, as a multiple of the background's filaments. */
	thickness: 1.6,
	/** Brightness of the strand, 0–1. */
	alpha: 1,
	/**
	 * How far (px) the two tail ends slowly sway up and down, like the background's filaments. The
	 * middle stays put and the line stays one smooth curve. 0 keeps it still.
	 */
	sway: 0,
	/** Speed of the sparkle and light pulse gliding along the strand. */
	travelSpeed: 6.0,
	/** Animation speed: the same as the background unless you change it. */
	motion: backgroundFlow.desktop.motion,
	/** Sparkles sliding along the strand. */
	// TODO: Measure performance on different devices and adjust the number of particles.
	// PENDING: Use different options based on device type and connection speed.
	sparkleCount: 30,
};

/**
 * The underline under the current section in the side nav (desktop). The labels are small and close
 * together, so the wave is much flatter than the menu's and stays clear of the labels above and below.
 */
export const sideNavUnderlineFlow: UnderlineFlow = {
	from: "center",
	wave: 1.5,
	waves: 1,
	thickness: 1.2,
	alpha: 1,
	sway: 0,
	travelSpeed: 6.0,
	motion: backgroundFlow.desktop.motion,
	sparkleCount: 14,
};
