export function WebViewPolyfills() {
  return (
    <script
      id="rutero-webview-polyfills"
      dangerouslySetInnerHTML={{
        __html: `
        (function () {
          if (typeof window === "undefined") return;
          if (typeof window.ResizeObserver === "undefined") {
            window.ResizeObserver = function ResizeObserver(callback) {
              this.callback = callback;
              this.elements = [];
              this.observe = function (element) {
                this.elements.push(element);
                var rect = element.getBoundingClientRect ? element.getBoundingClientRect() : { width: 0, height: 0 };
                this.callback([{ target: element, contentRect: rect }]);
              };
              this.unobserve = function (element) {
                this.elements = this.elements.filter(function (item) { return item !== element; });
              };
              this.disconnect = function () {
                this.elements = [];
              };
            };
          }
        })();
      `
      }}
    />
  );
}
