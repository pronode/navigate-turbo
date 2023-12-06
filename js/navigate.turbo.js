/**
 * Navigate Turbo.
 *
 * Caveats:
 * - Navigate Turbo doesn't work with wire:navigate.hover, since it doesn't trigger click event.
 */

const navigateTurbo = {};

navigateTurbo.cache = {};
navigateTurbo.pending = null;

navigateTurbo.init = (config) => {
	navigateTurbo.turboAreaSelector = config.turboAreaSelector || "main";
	navigateTurbo.applyOverlaySelector = config.applyOverlaySelector || ".turbo";
	navigateTurbo.overlayClass = config.overlayClass || "loading-overlay";
	navigateTurbo.routes = config.routes || [];

	if (!navigateTurbo.routes.length) {
		console.warn("Navigate Turbo: No routes provided. Navigate Turbo will not work.");
		return;
	}

	navigateTurbo.registerListeners();
};

navigateTurbo.getRouteMatchingLocation = (location) => {
	// Select route from navigateTurbo.routes that matches current location.
	const route = navigateTurbo.routes.find((route) => {
		// Replace all {something} with regex matching group ([^\/]*?):
		const regexStr = "^" + route.replace(/{.*?}/g, "([^/]*?)") + "$";
		const regex = new RegExp(regexStr, "m");
		return regex.test(location);
	});

	return route;
};

navigateTurbo.cacheCurrentPage = () => {
	// Get current location:
	const location = navigateTurbo.getRelativePath(window.location.href);

	// If current location doesn't match pending location, do nothing.
	// This prevents situation when user clicks on link, but before Turbo replaces current page, user clicks on another link.
	if (navigateTurbo.pending !== null && navigateTurbo.pending != location) {
		return;
	}

	// Select route from navigateTurbo.routes that matches current location.
	const route = navigateTurbo.getRouteMatchingLocation(location);

	// If route is not found, do nothing:
	if (!route) return;

	// Get current turboArea element:
	const turboArea = document.querySelector(navigateTurbo.turboAreaSelector);

	// If turboArea element is not found, do nothing:
	if (!turboArea) return;

	// Cache current turboArea element:
	navigateTurbo.cache[route] = {
		location: location,
		time: new Date().getTime(),
		element: turboArea,
	};
};

navigateTurbo.getRelativePath = (location) => {
	const url = new URL(location);
	return url.pathname;
};

navigateTurbo.runSwapper = (location) => {
	// Get page matching location:
	const route = navigateTurbo.getRouteMatchingLocation(location);

	// Get page from cache:
	const page = navigateTurbo.cache[route];

	// If page is not found in cache, perform simple Turbo and return:
	if (!page) {
		document.querySelector(navigateTurbo.turboAreaSelector).classList.add(navigateTurbo.overlayClass);
		return;
	}

	// Scroll to top of page:
	window.scrollTo(0, 0);

	// Replace current page with cached page:
	document.querySelector(navigateTurbo.turboAreaSelector).replaceWith(page.element);

	// Add loading overlay to every element that has 'turbo' class:
	document.querySelectorAll(navigateTurbo.applyOverlaySelector).forEach((el) => {
		el.classList.add(navigateTurbo.overlayClass);
	});
};

navigateTurbo.registerListeners = () => {
	document.addEventListener("click", (e) => {
		// Get A tag:
		const a = e.target.closest("a");

		// If not A tag, do nothing:
		if (!a) return;

		// If A tag has no attribute like wire:navigate, do nothing:
		if (!a.hasAttribute("wire:navigate")) return;

		// Navigate Turbo:
		const location = navigateTurbo.getRelativePath(a.href);
		navigateTurbo.pending = location;
		navigateTurbo.runSwapper(location);
	});

	document.addEventListener("livewire:navigated", () => {
		// Simple Turbo
		document.querySelector(navigateTurbo.turboAreaSelector).classList.remove(navigateTurbo.overlayClass);

		// Add data-scroll-x to body so LiveWire "maintains" scroll position:
		document.body.setAttribute("data-scroll-x", window.scrollX);

		// Cache current page with some delay since Livewire updates DOM (including location.href) after livewire:navigated event:
		setTimeout(() => {
			navigateTurbo.cacheCurrentPage();
		}, 100);
	});
};
