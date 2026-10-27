/** Facts about Daniel used across the site (hero, menu, footer). Edit here, not in components. */

export interface LinkItem {
	label: string;
	href: string;
	/** Opens in a new tab. */
	external?: boolean;
}

export const profile = {
	name: "Daniel Khojaste",
	role: "Software Developer",
	slogan: "temporary slogan",
	location: "Ottawa, Canada",
	coaching: "Coaching soccer",
	currently: {
		label: "Building Lineup",
		description: "A tactical board for coaches",
		href: "https://github.com/DanielKhojaste/lineup",
		external: true,
	},
} as const;

/** Page sections, in order. Used by the menu. */
export const sections: readonly LinkItem[] = [
	{ label: "Work", href: "#work" },
	{ label: "Skills", href: "#skills" },
	{ label: "About", href: "#about" },
	{ label: "Contact", href: "#contact" },
];

export const socials: readonly LinkItem[] = [
	{ label: "GitHub", href: "https://github.com/DanielKhojaste", external: true },
];
