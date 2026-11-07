/** Projects for the Work previews (preview/work only). Copy is a draft. */
export interface Project {
	name: string;
	kind: string;
	status: string;
	blurb: string;
	/** One-line version for tight layouts. */
	short: string;
	stack: string[];
	link: { label: string; href: string };
	/** Screenshot, in public/previews. */
	image: string;
	/** Optional moving version (a GIF) for layouts with room to show it. */
	motion?: string;
	alt: string;
}

export const projects: Project[] = [
	{
		name: "Lineup",
		kind: "Desktop app",
		status: "In progress",
		blurb:
			"A tactical board for coaches. Drag players into formations, drills and plays, step through them as an animation, and it all works offline.",
		short: "A tactical board for coaches, offline.",
		stack: ["Tauri", "Rust", "React", "TypeScript"],
		link: { label: "GitHub", href: "https://github.com/DanielKhojaste/lineup" },
		image: "/previews/lineup.webp",
		alt: "Lineup: a pitch with two teams' players placed by position, with the tools on the left and the player list on the right.",
	},
	{
		name: "ApotheonAI",
		kind: "Marketing site",
		status: "Live",
		blurb:
			"A multi-page site for a fictional AI security brand, with a blog run from a headless CMS and an animated hero.",
		short: "A brand site with a CMS-driven blog.",
		stack: ["Astro", "TypeScript", "Tailwind", "Sanity", "GSAP"],
		link: { label: "Live site", href: "https://apotheon-ai.vercel.app/" },
		image: "/previews/apotheon.webp",
		alt: "ApotheonAI's home page: a bronze helmet over gold light filaments, with the words Ascend to the Divine.",
	},
	{
		name: "ToDone",
		kind: "VS Code extension",
		status: "Published",
		blurb:
			"Plain-text to-do lists in VS Code: priorities, states, notes and headings, with commands that work across multiple cursors. A port of the ToDone syntax from Sublime Text.",
		short: "Plain-text to-do lists in VS Code.",
		stack: ["TypeScript", "VS Code API", "TextMate grammar"],
		link: {
			label: "Marketplace",
			href: "https://marketplace.visualstudio.com/items?itemName=danielkhojaste.todone-vscode",
		},
		image: "/previews/todone.webp",
		motion: "/previews/todone-commands.gif",
		alt: "A to-do file in VS Code, with tasks coloured by priority and finished ones struck through.",
	},
];

export const work = { eyebrow: "Work" };
