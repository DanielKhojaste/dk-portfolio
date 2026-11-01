/**
 * The hero's throne photo and how it is served. Shared by the hero (which renders it) and the page
 * head (which preloads it), so both always ask for exactly the same files.
 */
import { getImage } from "astro:assets";
import throne from "../assets/images/throne.png";

export { throne };
export const throneWidths = [360, 540, 723];
export const throneSizes = "(max-width: 1023px) 80vw, 34vw";

/** The AVIF `srcset` the browser picks from, for a `<link rel="preload">`. */
export async function throneAvifSrcset(): Promise<string> {
	const image = await getImage({ src: throne, format: "avif", widths: throneWidths });
	return image.srcSet.attribute;
}
