export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Where an image's pixels actually land inside its box with `object-fit: contain`.
 * `alignX`/`alignY` mirror `object-position` (0 = start, 0.5 = centre, 1 = end).
 */
export function containedRect(
	box: Rect,
	naturalWidth: number,
	naturalHeight: number,
	alignX = 0.5,
	alignY = 1,
): Rect {
	if (naturalWidth <= 0 || naturalHeight <= 0 || box.width <= 0 || box.height <= 0) {
		return { x: box.x, y: box.y, width: 0, height: 0 };
	}
	const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight);
	const width = naturalWidth * scale;
	const height = naturalHeight * scale;
	return {
		x: box.x + (box.width - width) * alignX,
		y: box.y + (box.height - height) * alignY,
		width,
		height,
	};
}

/** CSS custom properties that place `image` as a mask inside `target`'s box. */
export function maskVariables(image: Rect, target: Rect): Record<string, string> {
	const px = (value: number) => `${Math.round(value * 100) / 100}px`;
	return {
		"--mask-x": px(image.x - target.x),
		"--mask-y": px(image.y - target.y),
		"--mask-w": px(image.width),
		"--mask-h": px(image.height),
	};
}

/**
 * Mask the ghost copy of the name with the throne photo's alpha, so the name only shows (faintly)
 * where it overlaps the throne. Re-aligns on resize, font load and image (re)selection.
 */
export function syncNameGhost(hero: HTMLElement): () => void {
	const ghost = hero.querySelector<HTMLElement>("[data-name-ghost]");
	const img = hero.querySelector<HTMLImageElement>(".hero__figure img");
	if (!ghost || !img) return () => {};

	let frame = 0;

	const update = () => {
		frame = 0;
		if (!img.complete || img.naturalWidth === 0) return;

		const style = getComputedStyle(img);
		const [posX = "50%", posY = "100%"] = style.objectPosition.split(" ");
		const align = (value: string, fallback: number) =>
			value.endsWith("%") ? parseFloat(value) / 100 : fallback;

		const content = containedRect(
			img.getBoundingClientRect(),
			img.naturalWidth,
			img.naturalHeight,
			align(posX, 0.5),
			align(posY, 1),
		);

		const vars = maskVariables(content, ghost.getBoundingClientRect());
		for (const [key, value] of Object.entries(vars)) ghost.style.setProperty(key, value);
		ghost.style.setProperty("--throne-mask", `url("${img.currentSrc || img.src}")`);
		ghost.dataset.ready = "true";
	};

	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(update);
	};

	const observer = new ResizeObserver(schedule);
	observer.observe(hero);
	observer.observe(ghost);
	img.addEventListener("load", schedule);
	document.fonts?.ready.then(schedule);
	schedule();

	return () => {
		cancelAnimationFrame(frame);
		observer.disconnect();
		img.removeEventListener("load", schedule);
	};
}

export function syncNameGhosts(root: ParentNode = document) {
	root.querySelectorAll<HTMLElement>(".hero").forEach((hero) => syncNameGhost(hero));
}
