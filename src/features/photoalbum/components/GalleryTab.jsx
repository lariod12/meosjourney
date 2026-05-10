import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchHomePageGallery } from '../../../services/nocodb';
import { useLanguage } from '../../../contexts';
import './GalleryTab.css';

const getItemsPerView = (width) => {
  return 1;
};

const GalleryTab = ({ isActive = true }) => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(() =>
    getItemsPerView(typeof window !== 'undefined' ? window.innerWidth : 1024)
  );
  const [zoomedImage, setZoomedImage] = useState(null);
  const { t, lang } = useLanguage();
  const modalContentRef = useRef(null);
  const galleriesRef = useRef([]);
  const optimisticGalleriesRef = useRef(new Map());
  const completedOptimisticIdsRef = useRef(new Set());

  const revokeOptimisticGallery = (gallery) => {
    const previewUrl = gallery?.img?.[0]?.url;
    if (gallery?.__optimistic && previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const mergeOptimisticGalleries = (records = []) => {
    const realRecords = records.filter((record) => !record.__optimistic);
    return [...optimisticGalleriesRef.current.values(), ...realRecords];
  };

  const createOptimisticGallery = (detail) => ({
    Id: detail.optimisticId,
    title: detail.title,
    desc: detail.title,
    created_time: detail.createdAt,
    __optimistic: true,
    img: [{
      url: detail.optimisticPreviewUrl,
      signedUrl: detail.optimisticPreviewUrl
    }]
  });

  useEffect(() => {
    galleriesRef.current = galleries;
  }, [galleries]);

  // Reset UI-only state when leaving the tab (keep loaded data)
  useEffect(() => {
    if (isActive) return;
    setSelectedGallery(null);
    setZoomedImage(null);
    setCarouselIndex(0);
  }, [isActive]);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedGallery) {
      setCarouselIndex(0);
      setZoomedImage(null);
      
      // Scroll modal content to bottom (100%) if scrollable (only on screens > 426px)
      setTimeout(() => {
        if (modalContentRef.current && window.innerWidth > 425) {
          const element = modalContentRef.current;
          const scrollHeight = element.scrollHeight;
          const clientHeight = element.clientHeight;
          
          // Only scroll if content is scrollable
          if (scrollHeight > clientHeight) {
            const scrollTo = scrollHeight - clientHeight; // Scroll to bottom (100%)
            element.scrollTo({
              top: scrollTo,
              behavior: 'smooth'
            });
          }
        }
      }, 100); // Small delay to ensure modal is rendered
    }
  }, [selectedGallery]);

  useEffect(() => {
    if (!selectedGallery) {
      setCarouselIndex(0);
      setZoomedImage(null);
      return;
    }

    const totalImages = selectedGallery.img?.length || 0;
    const maxStartIndex = Math.max(0, totalImages - itemsPerView);
    setCarouselIndex((prev) => Math.min(prev, maxStartIndex));
  }, [itemsPerView, selectedGallery]);

  // Lazy load: only fetch when tab becomes active for the first time
  useEffect(() => {
    if (!isActive || hasLoadedOnce) return;
    
    setHasLoadedOnce(true);
    loadGallery();
  }, [isActive, hasLoadedOnce]);

  // Refresh after camera/gallery uploads from other tabs.
  useEffect(() => {
    const handleRefresh = (event) => {
      if (import.meta.env.MODE !== 'production') {
        console.log('🖼️ GalleryTab: Refreshing gallery after upload...');
      }
      loadGallery({ completedOptimisticId: event.detail?.optimisticId });
    };

    window.addEventListener('gallery:refresh', handleRefresh);

    return () => {
      window.removeEventListener('gallery:refresh', handleRefresh);
    };
  }, []);

  useEffect(() => {
    const handleOptimisticPhoto = (event) => {
      const detail = event.detail;
      if (detail?.target !== 'gallery' || !detail.optimisticId || !detail.optimisticPreviewUrl) return;

      const optimisticGallery = createOptimisticGallery(detail);
      optimisticGalleriesRef.current.set(detail.optimisticId, optimisticGallery);

      const nextGalleries = mergeOptimisticGalleries(galleriesRef.current);
      galleriesRef.current = nextGalleries;
      setGalleries(nextGalleries);
      setLoading(false);
      setHasLoadedOnce(true);
    };

    const handleOptimisticComplete = (event) => {
      const detail = event.detail;
      if (detail?.target !== 'gallery' || !detail.optimisticId) return;

      completedOptimisticIdsRef.current.add(detail.optimisticId);
    };

    const handleOptimisticFailed = (event) => {
      const detail = event.detail;
      if (detail?.target !== 'gallery' || !detail.optimisticId) return;

      const optimisticGallery = optimisticGalleriesRef.current.get(detail.optimisticId);
      revokeOptimisticGallery(optimisticGallery);
      optimisticGalleriesRef.current.delete(detail.optimisticId);
      completedOptimisticIdsRef.current.delete(detail.optimisticId);

      const nextGalleries = mergeOptimisticGalleries(
        galleriesRef.current.filter((gallery) => gallery.Id !== detail.optimisticId)
      );
      galleriesRef.current = nextGalleries;
      setGalleries(nextGalleries);
      setSelectedGallery((current) => current?.Id === detail.optimisticId ? null : current);
    };

    window.addEventListener('pet-photo:optimistic', handleOptimisticPhoto);
    window.addEventListener('pet-photo:optimistic-complete', handleOptimisticComplete);
    window.addEventListener('pet-photo:optimistic-failed', handleOptimisticFailed);

    return () => {
      window.removeEventListener('pet-photo:optimistic', handleOptimisticPhoto);
      window.removeEventListener('pet-photo:optimistic-complete', handleOptimisticComplete);
      window.removeEventListener('pet-photo:optimistic-failed', handleOptimisticFailed);
      optimisticGalleriesRef.current.forEach(revokeOptimisticGallery);
      optimisticGalleriesRef.current.clear();
      completedOptimisticIdsRef.current.clear();
    };
  }, []);

  const loadGallery = async ({ completedOptimisticId = null } = {}) => {
    if (galleriesRef.current.length === 0 && optimisticGalleriesRef.current.size === 0) {
      setLoading(true);
    }

    try {
      const data = await fetchHomePageGallery();
      if (completedOptimisticId && completedOptimisticIdsRef.current.has(completedOptimisticId)) {
        const optimisticGallery = optimisticGalleriesRef.current.get(completedOptimisticId);
        revokeOptimisticGallery(optimisticGallery);
        optimisticGalleriesRef.current.delete(completedOptimisticId);
        completedOptimisticIdsRef.current.delete(completedOptimisticId);
      }

      const nextGalleries = mergeOptimisticGalleries(data);

      galleriesRef.current = nextGalleries;
      setGalleries(nextGalleries);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date, isVietnamese = true) => {
    if (!date) return '';

    const d = new Date(date);

    if (isVietnamese) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } else {
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return d.toLocaleDateString('en-US', options);
    }
  };

  const modalImages = selectedGallery?.img || [];
  const maxCarouselIndex = Math.max(0, modalImages.length - itemsPerView);
  const visibleImages = modalImages.slice(carouselIndex, carouselIndex + itemsPerView);
  const shouldShowCarouselNav = true;
  const isSingleImage = modalImages.length === 1;
  const gridColumnsClass = `gallery-modal-grid-${itemsPerView}`;
  const canGoPrev = carouselIndex > 0;
  const canGoNext = carouselIndex < maxCarouselIndex;

  const handlePrev = () => {
    if (!canGoPrev) return;
    setCarouselIndex((prev) => Math.max(prev - itemsPerView, 0));
    setZoomedImage(null);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    setCarouselIndex((prev) => Math.min(prev + itemsPerView, maxCarouselIndex));
    setZoomedImage(null);
  };

  const handleImageClick = (image, index) => {
    setZoomedImage({ image, index });
  };

  const closeZoom = () => setZoomedImage(null);

  if (loading && galleries.length === 0) {
    return (
      <div className="gallery-content">
        <div className="gallery-empty">{t('photoalbum.loading')}</div>
      </div>
    );
  }

  if (galleries.length === 0) {
    return (
      <div className="gallery-content">
        <div className="gallery-empty">{t('photoalbum.empty')}</div>
      </div>
    );
  }

  return (
    <div className="gallery-content">
      <div className="gallery-grid">
        {galleries.map((gallery) => {
          const images = gallery.img || [];
          const firstImage = images.length > 0 ? images[0] : null;
          const galleryDesc = typeof gallery.desc === 'string' ? gallery.desc.trim() : '';
          const galleryNotePlaceholder = lang === 'VI' ? 'Chưa có ghi chú' : 'No note yet';
          const createdDate = gallery.created_time
            ? new Date(gallery.created_time)
            : null;

          return (
            <div
              key={gallery.Id}
              className="gallery-card"
              onClick={() => setSelectedGallery(gallery)}
            >
              <div className="gallery-card-hanger">
                <div className="gallery-card-nail" />
                <div className="gallery-card-rope gallery-card-rope-left" />
                <div className="gallery-card-rope gallery-card-rope-right" />
              </div>
              <div className="gallery-card-frame">
                {firstImage ? (
                  <div className="gallery-card-image">
                    <img
                      src={firstImage.signedUrl || firstImage.url}
                      alt={gallery.desc || 'Gallery'}
                    />
                    {images.length > 1 && (
                      <div className="gallery-card-count">
                        +{images.length - 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="gallery-card-placeholder">
                    🖼️
                  </div>
                )}
              </div>
              <div className="gallery-card-desc">
                <div className={`gallery-card-desc-content${galleryDesc ? '' : ' gallery-card-desc-content-empty'}`}>
                  {galleryDesc
                    ? galleryDesc.length > 30
                      ? `${galleryDesc.substring(0, 30)}...`
                      : galleryDesc
                    : galleryNotePlaceholder}
                </div>
                {createdDate && (
                  <div className="gallery-card-date">
                    {formatDateTime(createdDate, lang === 'VI')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for viewing full gallery */}
      {selectedGallery && typeof document !== 'undefined' && createPortal((
        <div className="gallery-modal" onClick={() => setSelectedGallery(null)}>
          <div className="gallery-modal-content" ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
            <button
              className="gallery-modal-close"
              onClick={() => setSelectedGallery(null)}
            >
              ✕
            </button>

            <div className="gallery-modal-carousel">
              <button
                type="button"
                className="gallery-modal-nav-button gallery-modal-nav-button-prev"
                onClick={handlePrev}
                disabled={!canGoPrev}
                aria-label="Previous images"
              >
                ‹
              </button>

              <div className={`gallery-modal-grid ${gridColumnsClass}`}>
                {visibleImages.map((image, index) => (
                  <button
                    key={`${carouselIndex}-${index}`}
                    className="gallery-modal-image"
                    type="button"
                    onClick={() => handleImageClick(image, carouselIndex + index)}
                  >
                    <img
                      src={image.signedUrl || image.url}
                      alt={`${selectedGallery.desc || 'Gallery'} ${carouselIndex + index + 1}`}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="gallery-modal-nav-button gallery-modal-nav-button-next"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label="Next images"
              >
                ›
              </button>
            </div>

            <div className="gallery-modal-desc">
              {(() => {
                const selectedDesc = typeof selectedGallery.desc === 'string' ? selectedGallery.desc.trim() : '';
                const notePlaceholder = lang === 'VI' ? 'Chưa có ghi chú' : 'No note yet';
                const modalDate = selectedGallery.created_time
                  ? new Date(selectedGallery.created_time)
                  : null;

                return (
                  <>
                    <span className={selectedDesc ? '' : 'gallery-modal-desc-empty'}>
                      {selectedDesc || notePlaceholder}
                    </span>
                    {modalDate && (
                      <div className="gallery-modal-date">
                        {formatDateTime(modalDate, lang === 'VI')}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {zoomedImage && (
              <div className="gallery-zoom-overlay" onClick={closeZoom}>
                <div className="gallery-zoom-content" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="gallery-zoom-close" onClick={closeZoom}>
                    ✕
                  </button>
                  <img
                    src={zoomedImage.image.signedUrl || zoomedImage.image.url}
                    alt={`${selectedGallery.desc || 'Gallery'} ${zoomedImage.index + 1}`}
                    className="gallery-zoom-image"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

export default GalleryTab;

