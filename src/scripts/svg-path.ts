/**
 * Split compound path data into its subpaths (each starts with an absolute `M`). Only valid for path
 * data that uses absolute commands, which is true for the logo.
 */
export function splitSubpaths(d: string): string[] {
	return d
		.split(/(?=M)/)
		.map((part) => part.trim())
		.filter(Boolean);
}
