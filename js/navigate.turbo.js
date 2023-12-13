/**
 * Navigate Turbo.
 */

const navigateTurbo = {};

navigateTurbo.cache = {};
navigateTurbo.pending = null;
navigateTurbo.originalTurboAreaElement = null;

navigateTurbo.init = (config) => {
	// If document is called with query parameter dontRunNavigateTurbo=true, do nothing.
	// It is necessary for prefetching purposes.
	if (window.location.search.includes("dontRunNavigateTurbo=true")) return;

	// Set up configuration:
	navigateTurbo.turboAreaSelector = config.turboAreaSelector || "main";
	navigateTurbo.applyOverlaySelector = config.applyOverlaySelector || ".turbo";
	navigateTurbo.overlayClass = config.overlayClass || "loading-overlay";
	navigateTurbo.routes = config.routes || [];
	navigateTurbo.simpleTurboEnabled = config.simpleTurboEnabled || true;
	navigateTurbo.prefetch = config.prefetch || [];

	if (!navigateTurbo.routes.length) {
		console.warn("Navigate Turbo: No routes provided. Navigate Turbo will not work.");
		return;
	}

	navigateTurbo.registerListeners();
	navigateTurbo.drawIframesAndPrefetch(); // Only if prefetch urls are provided.
};

navigateTurbo.drawIframesAndPrefetch = () => {
	// Draw iframes for every link in navigateTurbo.prefetch:
	navigateTurbo.prefetch.forEach((url) => {
		// If iframe points to current location, do nothing:
		if (url == navigateTurbo.getRelativePath(window.location.href)) return;

		// Create hidden iframe:
		const iframe = document.createElement("iframe");
		iframe.src = url + "?dontRunNavigateTurbo=true";
		iframe.style.display = "none";

		// Join iframe to DOM:
		document.body.appendChild(iframe);
	});

	// When every iframe is loaded, get turboArea element from every iframe and cache it:
	const iframes = document.querySelectorAll("iframe");

	iframes.forEach((iframe) => {
		iframe.addEventListener("load", () => {
			// Get turboArea element from iframe:
			const turboArea = iframe.contentWindow.document.querySelector(navigateTurbo.turboAreaSelector);

			// If turboArea element is not found, do nothing:
			if (!turboArea) return;

			// Get current location:
			const location = navigateTurbo.getRelativePath(iframe.contentWindow.location.href);

			// Select route from navigateTurbo.routes that matches current location.
			const route = navigateTurbo.getRouteMatchingLocation(location);

			// If route is not found, do nothing:
			if (!route) return;

			// Cache turboArea element:
			navigateTurbo.cache[route] = {
				location: location,
				time: new Date().getTime(),
				element: turboArea,
			};

			console.log(turboArea);

			// Remove iframe from DOM so it doesn't take memory:
			iframe.remove();
		});
	});
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

	// If page is not found in cache, perform Simple Turbo and return:
	if (!page) {
		navigateTurbo.simpleTurboEnabled && document.querySelector(navigateTurbo.turboAreaSelector).classList.add(navigateTurbo.overlayClass);
		return;
	}

	// Scroll to top of page:
	window.scrollTo(0, 0);

	// Remember original turboArea element:
	navigateTurbo.originalTurboAreaElement = document.querySelector(navigateTurbo.turboAreaSelector);

	// Replace current page with cached page:
	navigateTurbo.originalTurboAreaElement.replaceWith(page.element);

	// Add .turbo-loading-show class to every element with .turbo-loading class:
	page.element.querySelectorAll(".turbo-loading").forEach((el) => el.classList.add("turbo-loading-show"));

	// Add loading overlay to every element that has 'turbo' class:
	page.element.querySelectorAll(navigateTurbo.applyOverlaySelector).forEach((el) => {
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

	document.addEventListener("livewire:navigating", () => {
		// Restore original turboArea element:
		if (navigateTurbo.originalTurboAreaElement) {
			document.querySelector(navigateTurbo.turboAreaSelector).replaceWith(navigateTurbo.originalTurboAreaElement);
		}
	});

	document.addEventListener("livewire:navigated", () => {
		// Simple Turbo
		navigateTurbo.simpleTurboEnabled && document.querySelector(navigateTurbo.turboAreaSelector).classList.remove(navigateTurbo.overlayClass);

		// Add data-scroll-x to body so LiveWire "maintains" scroll position:
		document.body.setAttribute("data-scroll-x", window.scrollX);

		// Cache current page with some delay since Livewire updates DOM (including location.href) after livewire:navigated event:
		setTimeout(() => {
			navigateTurbo.cacheCurrentPage();
		}, 100);
	});
};

// Dispatch event that navigateTurbo is ready:
document.dispatchEvent(new CustomEvent("navigateTurbo:ready"));
