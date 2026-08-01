/**
 * Web Vitals Performance Monitoring
 * Measures Core Web Vitals: CLS, INP, FCP, LCP, TTFB
 * @param {Function} onPerfEntry - Callback to report metrics
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);  // Cumulative Layout Shift
      onINP(onPerfEntry);  // Interaction to Next Paint (replaces First Input Delay)
      onFCP(onPerfEntry);  // First Contentful Paint
      onLCP(onPerfEntry);  // Largest Contentful Paint
      onTTFB(onPerfEntry); // Time to First Byte
    });
  }
};

export default reportWebVitals;