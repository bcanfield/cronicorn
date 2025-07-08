"use client";

import { useEffect, useState } from "react";

export function useKeyboardAware() {
	const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
	const [viewportHeight, setViewportHeight] = useState(0);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const initialHeight = window.innerHeight;
		setViewportHeight(initialHeight);

		const handleResize = () => {
			const currentHeight = window.innerHeight;
			const heightDifference = initialHeight - currentHeight;

			// Consider keyboard open if height decreased by more than 150px
			// This threshold accounts for browser UI changes
			const keyboardThreshold = 150;
			setIsKeyboardOpen(heightDifference > keyboardThreshold);
			setViewportHeight(currentHeight);
		};

		const handleVisualViewportChange = () => {
			if (window.visualViewport) {
				const heightDifference = window.innerHeight - window.visualViewport.height;
				setIsKeyboardOpen(heightDifference > 150);
				setViewportHeight(window.visualViewport.height);
			}
		};

		// Listen to both resize and visual viewport changes
		window.addEventListener("resize", handleResize);

		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", handleVisualViewportChange);
		}

		return () => {
			window.removeEventListener("resize", handleResize);
			if (window.visualViewport) {
				window.visualViewport.removeEventListener("resize", handleVisualViewportChange);
			}
		};
	}, []);

	return { isKeyboardOpen, viewportHeight };
}
