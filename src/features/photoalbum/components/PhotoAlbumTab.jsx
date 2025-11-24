import { useState, useEffect } from 'react';
import { fetchPhotoAlbums } from '../../../services/nocodb';
import { useLanguage } from '../../../contexts';
import './PhotoAlbumTab.css';

const getItemsPerView = (width) => {
  return 1;
};

const PhotoAlbumTab = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
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
    if (selectedAlbum) {
      setCarouselIndex(0);
      setZoomedImage(null);
    }
  }, [selectedAlbum]);

  useEffect(() => {
    if (!selectedAlbum) {
      setCarouselIndex(0);
      setZoomedImage(null);
      return;
    }

    const totalImages = selectedAlbum.img?.length || 0;
    const maxStartIndex = Math.max(0, totalImages - itemsPerView);
    setCarouselIndex((prev) => Math.min(prev, maxStartIndex));
  }, [itemsPerView, selectedAlbum]);

  const modalImages = selectedAlbum?.img || [];
  const maxCarouselIndex = Math.max(0, modalImages.length - itemsPerView);
  const visibleImages = modalImages.slice(carouselIndex, carouselIndex + itemsPerView);
  const shouldShowCarouselNav = true;
  const isSingleImage = modalImages.length === 1;
  const gridColumnsClass = `photoalbum-modal-grid-${itemsPerView}`;
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

  // Format datetime based on language
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
      // English format with AM/PM
      const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      };
      return d.toLocaleString('en-US', options);
    }
  };

  useEffect(() => {
    loadAlbums();
    
    // Listen for photo album refresh events
    const handleRefresh = () => {
      if (import.meta.env.MODE !== 'production') {
        console.log('📸 PhotoAlbumTab: Refreshing albums after upload...');
      }
      loadAlbums();
    };
    
    window.addEventListener('photoalbum:refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('photoalbum:refresh', handleRefresh);
    };
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      // Debug: Log photo albums fetch start (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('📸 PhotoAlbumTab: Fetching photo albums...');
      }
      
      const data = await fetchPhotoAlbums();
      
      // Debug: Log photo albums fetch result (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('📸 PhotoAlbumTab: Fetched albums:', data);
        console.log('📸 PhotoAlbumTab: Album count:', data?.length || 0);
        
        // Debug: Log first album images structure
        if (data && data.length > 0) {
          const firstAlbum = data[0];
          console.log('📸 First album structure:', firstAlbum);
          console.log('📸 First album images:', firstAlbum.img);
          
          if (firstAlbum.img && firstAlbum.img.length > 0) {
            console.log('📸 First image structure:', firstAlbum.img[0]);
            console.log('📸 First image URL:', firstAlbum.img[0].signedUrl || firstAlbum.img[0].url);
          }
        }
      }
      
      setAlbums(data);
    } catch (error) {
      console.error('Error loading photo albums:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="photoalbum-content">
        <div className="photoalbum-empty">{t('photoalbum.loading')}</div>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="photoalbum-content">
        <div className="photoalbum-empty">{t('photoalbum.empty')}</div>
      </div>
    );
  }

  return (
    <div className="photoalbum-content">
      <div className="photoalbum-grid">
        {albums.map((album) => {
          const images = album.img || [];
          const firstImage = images.length > 0 ? images[0] : null;
          const createdDate = album.created_time
            ? new Date(album.created_time)
            : album.CreatedAt
              ? new Date(album.CreatedAt)
              : null;

          return (
            <div
              key={album.Id}
              className="photoalbum-card"
              onClick={() => setSelectedAlbum(album)}
            >
              {firstImage ? (
                <div className="photoalbum-card-image">
                  <img
                    src={firstImage.signedUrl || firstImage.url}
                    alt={album.desc || 'Album'}
                  />
                  {images.length > 1 && (
                    <div className="photoalbum-card-count">
                      +{images.length - 1}
                    </div>
                  )}
                </div>
              ) : (
                <div className="photoalbum-card-placeholder">
                  📷
                </div>
              )}

              <div className="photoalbum-card-content">
                {album.desc && (
                  <div className="photoalbum-card-desc-wrapper">
                    <div className="photoalbum-card-note-badge" title={album.desc}>
                      {lang === 'VI' ? 'Ghi chú' : 'Note'}
                    </div>
                    <div className="photoalbum-card-desc-text" title={album.desc}>
                      <div className="photoalbum-card-desc-content">
                        {album.desc.length > 35 ? `${album.desc.substring(0, 35)}...` : album.desc}
                      </div>
                      {createdDate && (
                        <div className="photoalbum-card-date">
                          {formatDateTime(createdDate, lang === 'VI')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for viewing full album */}
      {selectedAlbum && (
        <div className="photoalbum-modal" onClick={() => setSelectedAlbum(null)}>
          <div className="photoalbum-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="photoalbum-modal-close"
              onClick={() => setSelectedAlbum(null)}
            >
              ✕
            </button>

            <div className="photoalbum-modal-carousel">
              <button
                type="button"
                className="photoalbum-modal-nav-button photoalbum-modal-nav-button-prev"
                onClick={handlePrev}
                disabled={!canGoPrev}
                aria-label="Previous images"
              >
                ‹
              </button>

              <div className={`photoalbum-modal-grid ${gridColumnsClass}`}>
                {visibleImages.map((image, index) => (
                  <button
                    key={`${carouselIndex}-${index}`}
                    className="photoalbum-modal-image"
                    type="button"
                    onClick={() => handleImageClick(image, carouselIndex + index)}
                  >
                    <img
                      src={image.signedUrl || image.url}
                      alt={`${selectedAlbum.desc || 'Album'} ${carouselIndex + index + 1}`}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="photoalbum-modal-nav-button photoalbum-modal-nav-button-next"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label="Next images"
              >
                ›
              </button>
            </div>

            {selectedAlbum.desc && (
              <div className="photoalbum-modal-desc-wrapper">
                <div className="photoalbum-modal-note-badge" title={selectedAlbum.desc}>
                  {lang === 'VI' ? 'Ghi chú' : 'Note'}
                </div>
                <div className="photoalbum-modal-desc">
                  {selectedAlbum.desc}
                  {(() => {
                    const modalDate = selectedAlbum.created_time
                      ? new Date(selectedAlbum.created_time)
                      : selectedAlbum.CreatedAt
                        ? new Date(selectedAlbum.CreatedAt)
                        : null;

                    return modalDate && (
                      <div className="photoalbum-modal-date">
                        {formatDateTime(modalDate, lang === 'VI')}
                      </div>
                    );
                  })()}
                </div>
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
                    alt={`${selectedAlbum.desc || 'Album'} ${zoomedImage.index + 1}`}
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

export default PhotoAlbumTab;
