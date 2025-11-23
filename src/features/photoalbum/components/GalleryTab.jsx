import { useState, useEffect } from 'react';
import { fetchHomePageGallery } from '../../../services/nocodb';
import { useLanguage } from '../../../contexts';
import './PhotoAlbumTab.css';

const getItemsPerView = (width) => {
  if (!width) return 3;
  if (width <= 480) return 1;
  if (width <= 768) return 2;
  return 3;
};

const GalleryTab = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(() =>
    getItemsPerView(typeof window !== 'undefined' ? window.innerWidth : 1024)
  );
  const [zoomedImage, setZoomedImage] = useState(null);
  const { t, lang } = useLanguage();

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

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      const data = await fetchHomePageGallery();

      if (import.meta.env.MODE !== 'production') {
        console.log('🎨 GalleryTab: Fetched gallery records:', data);
        console.log('🎨 GalleryTab: Gallery count:', data?.length || 0);
      }

      setGalleries(data);
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
  const shouldShowCarouselNav = modalImages.length > itemsPerView;
  const isSingleImage = modalImages.length === 1;
  const gridColumnsClass = `photoalbum-modal-grid-${itemsPerView}`;
  const singleImageGridStyle = isSingleImage && itemsPerView === 3
    ? { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
    : undefined;
  const singleImageItemStyle = isSingleImage && itemsPerView === 3
    ? { gridColumn: '2 / 3' }
    : undefined;
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

  if (loading) {
    return (
      <div className="photoalbum-content">
        <div className="photoalbum-empty">{t('photoalbum.loading')}</div>
      </div>
    );
  }

  if (galleries.length === 0) {
    return (
      <div className="photoalbum-content">
        <div className="photoalbum-empty">{t('photoalbum.empty')}</div>
      </div>
    );
  }

  return (
    <div className="photoalbum-content">
      <div className="photoalbum-grid">
        {galleries.map((gallery) => {
          const images = gallery.img || [];
          const firstImage = images.length > 0 ? images[0] : null;
          const createdDate = gallery.created_time
            ? new Date(gallery.created_time)
            : null;

          return (
            <div
              key={gallery.Id}
              className="photoalbum-card"
              onClick={() => setSelectedGallery(gallery)}
            >
              {firstImage ? (
                <div className="photoalbum-card-image">
                  <img
                    src={firstImage.signedUrl || firstImage.url}
                    alt={gallery.desc || 'Gallery'}
                  />
                  {images.length > 1 && (
                    <div className="photoalbum-card-count">
                      +{images.length - 1}
                    </div>
                  )}
                </div>
              ) : (
                <div className="photoalbum-card-placeholder">
                  🖼️
                </div>
              )}
              <div className="photoalbum-card-desc">
                {gallery.desc || gallery.title || 'Gallery'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for viewing full gallery */}
      {selectedGallery && (
        <div className="photoalbum-modal" onClick={() => setSelectedGallery(null)}>
          <div className="photoalbum-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="photoalbum-modal-close"
              onClick={() => setSelectedGallery(null)}
            >
              ✕
            </button>

            {(() => {
              const modalDate = selectedGallery.created_time
                ? new Date(selectedGallery.created_time)
                : null;

              return modalDate && (
                <div className="photoalbum-modal-date">
                  {formatDateTime(modalDate, lang === 'VI')}
                </div>
              );
            })()}

            <div className="photoalbum-modal-carousel">
              {shouldShowCarouselNav && (
                <button
                  type="button"
                  className="photoalbum-modal-nav-button photoalbum-modal-nav-button-prev"
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  aria-label="Previous images"
                >
                  ‹
                </button>
              )}

              <div
                className={`photoalbum-modal-grid ${gridColumnsClass} ${isSingleImage ? 'photoalbum-modal-grid-single' : ''}`}
                style={singleImageGridStyle}
              >
                {visibleImages.map((image, index) => (
                  <button
                    key={`${carouselIndex}-${index}`}
                    className="photoalbum-modal-image"
                    type="button"
                    onClick={() => handleImageClick(image, carouselIndex + index)}
                    style={singleImageItemStyle}
                  >
                    <img
                      src={image.signedUrl || image.url}
                      alt={`${selectedGallery.desc || 'Gallery'} ${carouselIndex + index + 1}`}
                    />
                  </button>
                ))}
              </div>

              {shouldShowCarouselNav && (
                <button
                  type="button"
                  className="photoalbum-modal-nav-button photoalbum-modal-nav-button-next"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  aria-label="Next images"
                >
                  ›
                </button>
              )}
            </div>

            {selectedGallery.desc && (
              <div className="photoalbum-modal-desc">
                {selectedGallery.desc}
              </div>
            )}

            {zoomedImage && (
              <div className="photoalbum-zoom-overlay" onClick={closeZoom}>
                <div className="photoalbum-zoom-content" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="photoalbum-zoom-close" onClick={closeZoom}>
                    ✕
                  </button>
                  <img
                    src={zoomedImage.image.signedUrl || zoomedImage.image.url}
                    alt={`${selectedGallery.desc || 'Gallery'} ${zoomedImage.index + 1}`}
                    className="photoalbum-zoom-image"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryTab;

