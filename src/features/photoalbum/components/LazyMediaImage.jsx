import { useEffect, useRef, useState } from 'react';

const LazyMediaImage = ({ src, alt, className = '', delayMs = 300 }) => {
  const rootRef = useRef(null);
  const delayRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setShouldLoad(false);
    setIsLoaded(false);
    setHasError(false);

    if (!src) return undefined;

    const startLoading = () => {
      delayRef.current = window.setTimeout(() => {
        setShouldLoad(true);
      }, delayMs);
    };

    const element = rootRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      startLoading();
      return () => {
        if (delayRef.current) {
          window.clearTimeout(delayRef.current);
        }
      };
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        startLoading();
      }
    }, {
      rootMargin: '200px 0px'
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (delayRef.current) {
        window.clearTimeout(delayRef.current);
      }
    };
  }, [src, delayMs]);

  return (
    <div ref={rootRef} className={`lazy-media-image ${className}`}>
      {shouldLoad && src && !hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
    </div>
  );
};

export default LazyMediaImage;
