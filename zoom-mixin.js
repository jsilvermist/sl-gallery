/**
 * Image zooming
 * @polymer
 * @mixinFunction
 */
export const ZoomMixin = (superclass) => class extends superclass {

  static get properties() {
    return {
      _zoom: Object,
    };
  }

  constructor() {
    super();

    this._zoom = {
      active: false,
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
    };
  }

  connectedCallback() {
    super.connectedCallback();

    // Handle zoom
    this.addEventListener('wheel', this.handleWheel);
    this.addEventListener('touchstart', this.handleZoomClickStart);
    this.addEventListener('mousedown', this.handleZoomClickStart);
    this.addEventListener('touchmove', this.handleZoomMove);
    this.addEventListener('mousemove', this.handleZoomMove);
    this.addEventListener('touchend', this.handleZoomEnd);
    this.addEventListener('mouseup', this.handleZoomEnd);
  }

  handleWheel(event) {
    if (event.deltaY < 0) {
      // Handle scroll up
      if (this._zoom.scale < 3) {
        this._zoom.scale += 0.2;
        // Save for zoom move
        const { center } = this._zoom.coordinates;
        center.x = event.clientX;
        center.y = event.clientY;
        this.$.image.style.transformOrigin = `${event.clientX}px ${event.clientY}px`;
        this.$.image.style.transform = `scale(${this._zoom.scale})`;
      }
    } else {
      // Handle scroll down
      if (this._zoom.scale > 1) {
        this._zoom.scale -= 0.2;
        this.$.image.style.transform = `scale(${this._zoom.scale})`;
      }
    }

    if (this._zoom.scale === 1) {
      this._zoom.active = false;
      this.style.cursor = '';
    } else {
      this._zoom.active = true;
      this.style.cursor = 'all-scroll';
    }
  }

  handleZoomClickStart(event) {
    if (this._zoom.active) {
      // [TODO]: Prevent navigation and toolbar toggling
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

  handleZoomMove(event) {
    if (this._zoom.active) {
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

      center.x += xDiff;
      center.y += yDiff;

      this.$.image.style.transformOrigin = `${center.x}px ${center.y}px`;
    }
  }

  handleZoomEnd(event) {
    // [TODO]: Re-enable navigation and toolbar toggling
  }

}
