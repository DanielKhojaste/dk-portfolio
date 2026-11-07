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
		image: "/previews/lineup.png",
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
		image: "/previews/apotheon.png",
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
		image: "/previews/todone.png",
		motion: "/previews/todone-commands.gif",
		alt: "A to-do file in VS Code, with tasks coloured by priority and finished ones struck through.",
	},
];

export const work = { eyebrow: "Work" };

/** Not shown for now. Its screenshot (the dashboard, cropped to 16:10 from the top) is ready to use. */
export const spare: Project[] = [
	{
		name: "DK8s",
		kind: "Operations console",
		status: "v0.3.0",
		blurb:
			"Register services, request deployments and watch them roll out live. Event-driven: a Spring Boot API, a message broker and a React dashboard that shows what happened and why.",
		short: "Services, deployments and their health, live.",
		stack: ["Java", "Spring Boot", "PostgreSQL", "Solace PubSub+", "React", "TypeScript", "Docker"],
		link: { label: "GitHub", href: "https://github.com/DanielKhojaste/dk8s" },
		image: "/previews/dk8s.png",
		alt: "The DK8s dashboard: four registered services with their health, recent registrations and the message queues.",
	},
];
