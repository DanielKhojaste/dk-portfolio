/**
 * The hero's scroll prompt: fades in once you've been on the hero for a few seconds without
 * scrolling, and goes away as soon as you scroll. Back at the top, it comes back. While it shows,
 * a DivineFlow strand under it draws itself downwards on a loop; hidden, it stops drawing.
 */
import { gsap } from "gsap";
import type { DivineFlowInstance } from "../lib/divine-flow";
import { mountDivineFlow } from "./divine-flow";

/** The bits of `window` this needs (so tests can pass a fake). */
export interface HintWindow {
	readonly scrollY: number;
	addEventListener(type: "scroll", listener: () => void, options?: AddEventListenerOptions): void;
	setTimeout(handler: () => void, ms: number): unknown;
}

/** Something to run while the prompt is showing. */
export interface HintAnimation {
	play(): void;
	pause(): void;
}

export function setupScrollHint(
	hint: HTMLElement,
	{ delay }: { delay: number },
	win: HintWindow = window,
	animation?: HintAnimation,
) {
	const atTop = () => win.scrollY < 40;
	let waited = false;
	let shown = false;
	const update = () => {
		const next = waited && atTop();
		hint.classList.toggle("is-shown", next);
		if (next === shown) return;
		shown = next;
		if (shown) animation?.play();
		else animation?.pause();
	};
	win.setTimeout(() => {
		waited = true;
		update();
	}, delay * 1000);
	win.addEventListener("scroll", update, { passive: true });
	update();
	return {
		update,
		get shown() {
			return shown;
		},
	};
}

type Flow = Pick<DivineFlowInstance, "start" | "stop" | "setReveal">;

/**
 * Loop a strand: draw it out from its start, fade it, and start again. Mounted the first time it
 * plays. Reduced motion shows it drawn and still.
 */
export function strandLoop(
	el: HTMLElement,
	loop: number,
	mount: (el: HTMLElement) => Flow | null = mountDivineFlow,
	reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
): HintAnimation {
	let flow: Flow | null = null;
	let tl: gsap.core.Timeline | null = null;
	const state = { reveal: 0 };

	const build = () => {
		const timeline = gsap.timeline({ repeat: -1, paused: true });
		timeline
			.set(el, { opacity: 1 })
			.fromTo(
				state,
				{ reveal: 0 },
				{
					reveal: 1,
					duration: loop * 0.55,
					ease: "power2.inOut",
					onUpdate: () => flow?.setReveal(state.reveal),
				},
			)
			// Hold it drawn for a moment, fade it, then a short pause before the next one.
			.to(el, { opacity: 0, duration: loop * 0.2, ease: "power1.in", delay: loop * 0.15 })
			.to({}, { duration: loop * 0.1 });
		return timeline;
	};

	return {
		play() {
			flow ??= mount(el);
			if (!flow) return;
			flow.start();
			if (reducedMotion) {
				flow.setReveal(1);
				return;
			}
			tl ??= build();
			tl.play();
		},
		pause() {
			tl?.pause();
			flow?.stop();
		},
	};
}
