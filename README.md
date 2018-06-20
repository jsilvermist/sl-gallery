Silverlinkz Photo Gallery
=========================

[![Build Status](https://travis-ci.org/jsilvermist/sl-gallery.svg?branch=master)](https://travis-ci.org/jsilvermist/sl-gallery)
[![Published on npm](https://img.shields.io/npm/v/@silverlinkz/sl-gallery.svg)](https://www.npmjs.com/package/@silverlinkz/sl-gallery)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@silverlinkz/sl-gallery)

A web-component based hash-route photo gallery.

The gallery will load all `small` images for thumbnails in the grid.

When you open the fullscreen slideshow, it will display the small image
as a placeholder while loading the larger full-sized `src` image.

After the current image in the slideshow is loaded, the next and previous images
will be lazy-loaded so that they are immediately ready upon changing image.

Note: Fullscreen won't work in the demo at `webcomponents.org`
due to being inside of a fullscreen restricted iframe.

## Installation (Polymer 3)

```sh
npm install --save @silverlinkz/sl-gallery
```

### Legacy Installation (Polymer 2 / Bower)

```sh
bower install --save jsilvermist/sl-gallery#^1.0.0
```

## Usage

Import the gallery (Polymer 3):

```javascript
import '@silverlinkz/sl-gallery';
```

Legacy import (Polymer 2 / Bower):

```html
<link rel="import" href="bower_components/sl-gallery/sl-gallery.html">
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

The `title`, `caption`, and `small` attributes are optional, and you can also set the `src` attribute dynamically.
