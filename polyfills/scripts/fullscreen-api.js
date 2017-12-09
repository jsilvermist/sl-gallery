(function(document) {
  'use strict';

  const apis = {
    w3: {
      enabled: "fullscreenEnabled",
      element: "fullscreenElement",
      request: "requestFullscreen",
      exit:    "exitFullscreen",
      events: {
        change: "fullscreenchange",
        error:  "fullscreenerror"
      }
    },
    webkit: {
      enabled: "webkitFullscreenEnabled",
      element: "webkitCurrentFullScreenElement",
      request: "webkitRequestFullscreen",
      exit:    "webkitExitFullscreen",
      events: {
        change: "webkitfullscreenchange",
        error:  "webkitfullscreenerror"
      }
    },
    moz: {
      enabled: "mozFullScreenEnabled",
      element: "mozFullScreenElement",
      request: "mozRequestFullScreen",
      exit:    "mozCancelFullScreen",
      events: {
        change: "mozfullscreenchange",
        error:  "mozfullscreenerror"
      }
    },
    ms: {
      enabled: "msFullscreenEnabled",
      element: "msFullscreenElement",
      request: "msRequestFullscreen",
      exit:    "msExitFullscreen",
      events: {
        change: "MSFullscreenChange",
        error:  "MSFullscreenError"
      }
    }
  };

  const w3 = apis.w3;
  let api = null;
  for (const vendor in apis) {
    if (apis[vendor].enabled in document) {
      api = apis[vendor];
      break;
    }
  }

  if (api && api !== w3) {

    document[w3.enabled] = document[api.enabled];
    document[w3.element] = document[api.element];

    document[w3.exit] = document[api.exit];

    Element.prototype[w3.request] = function() {
      this[api.request].call(this);
    };

    document.registerFullscreen = function(target) {

      target = target || document;

      target.addEventListener(api.events.change, (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();

        document[w3.enabled] = document[api.enabled];
        document[w3.element] = document[api.element];

        document.dispatchEvent(new Event(w3.events.change));
      });

      target.addEventListener(api.events.error, (e) => {
        document.dispatchEvent(new Event(w3.events.error));
      });

      return true;
    };

    // document.body.registerFullscreen.call(document);
    document.registerFullscreen();

  } else {

    document.registerFullscreen = function() {
      return false;
    };

  }

})(document);
