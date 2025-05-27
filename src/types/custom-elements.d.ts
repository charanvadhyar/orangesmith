declare namespace JSX {
  interface IntrinsicElements {
    // Added explicit declaration for clooned-object element
    'clooned-object': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      features?: string;
      oid?: string;
      // Add any other attributes that might be used
    }, HTMLElement>;
  }
}
