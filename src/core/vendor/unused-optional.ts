/**
 * Stand-in for jsPDF's optional dependencies (html2canvas, canvg, DOMPurify). They back `doc.html()`
 * and SVG import, which ImmerQR never calls; aliasing them here keeps them out of the bundle.
 */
export default undefined;
