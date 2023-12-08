# Navigate Turbo
Navigate Turbo for **Laravel LiveWire 3** is a tiny script that **tremendously speeds up navigation** using **wire:navigate** directive.

It delivers an instant UI reaction and delivers much better UX, especially in slow connection enviroment, boosting the "SPA feeling".

# How it works
- Navigate Turbo caches main content element (configurable) - known as "turboArea" - with corresponding route key as the user browses the website.
- When user visits given route again (for different product / post / whatever), cached view is displayed immediately and every element with `.turbo` (configurable) class is overlayed with loading indicator.
- If the page has not been cached yet, whole "turboArea" is overlayed, giving a reactive feedback to the user.

## Standard wire:navigate (on 3G connection)
![](https://raw.githubusercontent.com/pronode/navigate-turbo/main/3G-standard-wire-navigate.gif)

## With Navigate Turbo (on 3G connection)
![](https://raw.githubusercontent.com/pronode/navigate-turbo/main/3G-with-navigate-turbo.gif)

# Installation
```html
<head>
  ...
  <script type="text/javascript" src="https://cdn.jsdelivr.net/gh/pronode/navigate-turbo@main/js/navigate.turbo.js" defer></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/pronode/navigate-turbo@main/css/navigate.turbo.css" />
  ...
</head>
```

# Initialization and configuration
```html
<script>
  document.addEventListener('navigateTurbo:ready', () => {
    navigateTurbo.init({

      // Routes to work on:
      routes: [
        '/',
        '/products/{slug}'
      ],

      // Selector for turboArea.
      // It is recommended to select the smallest dynamic content area, with no headers and footers. But can be set to 'body' as well.
      turboAreaSelector: 'main',

      // Every element that can be queried with applyOverlaySelector will be covered
      // with special loading overlay while wire:navigate is loading content.
      applyOverlaySelector: '.turbo',

      // The class that Navigate Turbo applies to the elements while wire:navigate is loading content.
      overlayClass: 'loading-overlay',

      // If turboArea for given route is not cached yet, an overlay will be applied to whole turboArea element, performing "Simple Turbo" effect.
      simpleTurboEnabled: true
    })
  })
</script>
```

# Using loading overlay
Add "turbo" class to dynamic elements. Now, while wire:navigate is loading data, every element will be overlayed with loading overlay (.loading-overlay class will be applied). 
```
<main>
  <h1>Product details</h1>
  <p class="... turbo">{{ $product->name }}</p>
  <img class="... turbo" src="{{ $product->image->path }}"/>
</main>
```

# Caveats
- Navigate Turbo doesn't work with wire:navigate.hover, since it doesn't trigger click event.
- Since LiveWire is not aborting previous wire:navigate operation when new request is made (ex. user meanwhile clicks some other link), an UI flickering may occur. I hope I'm gonna find a workaround soon.
