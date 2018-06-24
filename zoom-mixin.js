/**
 * Slideshow view-image zooming
 * @polymer
 * @mixinFunction
 */
export const ZoomMixin = (superclass) => class extends superclass {

  static get properties() {
    return {
      zoomActive: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
      },
      zoomClicked: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
      },
      _zoom: Object,
    };
  }

  constructor() {
    super();

    this._zoom = {
      scale: 1,
      coordinates: {
        center: {
          x: null,
          y: null,
        },
        previous: {
          x: null,
          y: null,
        },
      },
      max: 5,
      min: 1,
    };
  }

  connectedCallback() {
    super.connectedCallback();

    // Handle zoom
    this.addEventListener('wheel', this.handleWheel);
    this.addEventListener('touchstart', this.handleZoomClickStart);
    this.addEventListener('mousedown', this.handleZoomClickStart);
    this.addEventListener('touchmove', this.handleZoomClickMove);
    this.addEventListener('mousemove', this.handleZoomClickMove);
    this.addEventListener('touchend', this.handleZoomClickEnd);
    this.addEventListener('mouseup', this.handleZoomClickEnd);
  }

  handleWheel(event) {
    if (event.deltaY < 0 && this.activeImage.loaded) {
      // Handle scroll up
      this.zoomIn(0.2, event.clientX, event.clientY);
    } else {
      // Handle scroll down
      this.zoomOut(0.2);
    }
  }

  handleZoomClickStart(event) {
    if (this.zoomActive) {
      this.zoomClicked = true;
      event.preventDefault();
      const { previous } = this._zoom.coordinates;
      if (event.touches && event.touches[0]) {
        previous.x = event.touches[0].clientX;
        previous.y = event.touches[0].clientY;
      } else {
        previous.x = event.clientX;
        previous.y = event.clientY;
      }
    }
  }

  handleZoomClickMove(event) {
    if (this.zoomActive) {
      event.preventDefault();
      const { center, previous } = this._zoom.coordinates;
      let x, y;
      if (event.touches && event.touches[0]) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      } else {
        if (event.buttons !== 1) return;
        x = event.clientX;
        y = event.clientY;
      }

      const xDiff = previous.x - x;
      const yDiff = previous.y - y;

      previous.x = x;
      previous.y = y;

      const newX = center.x + (xDiff * 2 / this._zoom.scale);
      const newY = center.y + (yDiff * 2 / this._zoom.scale);

      this.updateZoomOrigin(newX, newY);
    }
  }

  handleZoomClickEnd() {
    if (this.zoomActive) {
      this.zoomClicked = false;
    }
  }

  recenterZoom(x, y) {
    const { center } = this._zoom.coordinates;
    let newX, newY;
    if (this._zoom.scale > 1) {
      newX = center.x + ((x - center.x) / this._zoom.scale);
      newY = center.y + ((y - center.y) / this._zoom.scale);
    } else {
      newX = x;
      newY = y;
    }

    this.updateZoomOrigin(newX, newY);
  }

  updateZoomOrigin(x, y) {
    const { center } = this._zoom.coordinates;
    const dimensions = this._dimensions.current;

    // Handle max zoom for X axis
    if (x > dimensions.width + dimensions.offset) {
      center.x = dimensions.width + dimensions.offset;
    } else if (x < dimensions.offset) {
      center.x = dimensions.offset;
    } else {
      center.x = x;
    }

    // Handle max zoom for Y axis
    if (y > dimensions.height + dimensions.offset) {
      center.y = dimensions.height + dimensions.offset;
    } else if (y < -dimensions.offset) {
      center.y = -dimensions.offset;
    } else {
      center.y = y;
    }

    this.$.image.style.transformOrigin = `${center.x}px ${center.y}px`;
  }

  zoomIn(increase, x, y) {
    if (this._zoom.scale < this._zoom.max) {
      if (this._zoom.scale + increase < this._zoom.max) {
        this._zoom.scale = this._zoom.scale + increase;
      } else {
        this._zoom.scale = this._zoom.max;
      }

      // Update zoom related properties
      this.zoomActive = true;
      if (x && y) this.recenterZoom(x, y);
      this.$.image.style.transform = `scale(${this._zoom.scale})`;
    }
  }

  zoomOut(decrease) {
    if (this._zoom.scale > this._zoom.min) {
      if (this._zoom.scale - decrease > this._zoom.min) {
        this._zoom.scale = this._zoom.scale - decrease;
      } else {
        this._zoom.scale = this._zoom.min;
      }

      // Update zoom or reset
      if (this._zoom.scale !== this._zoom.min) {
        this.$.image.style.transform = `scale(${this._zoom.scale})`;
      } else {
        this._resetZoom();
      }
    }
  }

  _resetZoom() {
    this.zoomActive = false;
    this.zoomClicked = false;
    this._zoom.scale = this._zoom.min;
    this._zoom.coordinates.center.x = null;
    this._zoom.coordinates.center.y = null;
    this.$.image.style.transform = '';
  }

}
