Silverlinkz Photo Gallery
=========================

[![Build Status](https://travis-ci.org/jsilvermist/sl-gallery.svg?branch=master)](https://travis-ci.org/jsilvermist/sl-gallery)
[![Published on npm](https://img.shields.io/npm/v/@silverlinkz/sl-gallery.svg)](https://www.npmjs.com/package/@silverlinkz/sl-gallery)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/jsilvermist/sl-gallery)

A Polymer hash-route based photo gallery.

Note: Fullscreen won't work on `webcomponents.org` due to being inside of a fullscreen restricted iframe.

## Installation

```sh
npm install --save @silverlinkz/sl-gallery
```

## Usage

Import the gallery:

```javascript
import '@silverlinkz/sl-gallery';
```

Create an `sl-gallery` element, and add `sl-gallery-image` elements for each image:

<!--
```
<custom-element-demo>
  <template>
    <link rel="import" href="sl-gallery.html">
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->

```html
<sl-gallery>
  <sl-gallery-image
      src="https://unsplash.it/800/500/?image=257"
      small="https://unsplash.it/400/250/?image=257"
      title="Example Title 01">
  </sl-gallery-image>
  <sl-gallery-image
      src="https://unsplash.it/800/500/?image=250"
      small="https://unsplash.it/400/250/?image=250"
      title="Another Title 02">
  </sl-gallery-image>
  <sl-gallery-image
      src="https://unsplash.it/800/500/?image=399"
      small="https://unsplash.it/400/250/?image=399"
      title="Photo Title 03"
      caption="Ipsa ut distinctio aperiam quia delectus, illum voluptates non.">
  </sl-gallery-image>
  <sl-gallery-image
      src="https://unsplash.it/800/500/?image=146"
      small="https://unsplash.it/400/250/?image=146"
      title="Photo Title 04"
      caption="Necessitatibus tempora ea eius placeat. Sed culpa numquam voluptatibus possimus, eaque vel!">
  </sl-gallery-image>
</sl-gallery>
```

The `small` attribute is used for the thumbnail image and preloading the gallery slideshow image.
If the `small` attribute is missing, the gallery will use the `src` for the thumbnail image.

You can leave out the `title`, `caption`, and `small` attributes, or even lazy-load the `src` attribute.
