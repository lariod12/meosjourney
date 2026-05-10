import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchPhotoAlbums } from '../../../services/nocodb';
import { useLanguage } from '../../../contexts';
import './PhotoAlbumTab.css';

const getItemsPerView = (width) => {
  return 1;
};

const PhotoAlbumTab = ({ isActive = true }) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(() =>
    getItemsPerView(typeof window !== 'undefined' ? window.innerWidth : 1024)
  );
  const [zoomedImage, setZoomedImage] = useState(null);
  const { t, lang } = useLanguage();
  const modalContentRef = useRef(null);
  const albumsRef = useRef([]);
  const optimisticAlbumsRef = useRef(new Map());
  const completedOptimisticIdsRef = useRef(new Set());

  const revokeOptimisticAlbum = (album) => {
    const previewUrl = album?.img?.[0]?.url;
    if (album?.__optimistic && previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const mergeOptimisticAlbums = (records = []) => {
    const realRecords = records.filter((record) => !record.__optimistic);
    return [...optimisticAlbumsRef.current.values(), ...realRecords];
  };

  const createOptimisticAlbum = (detail) => ({
    Id: detail.optimisticId,
    title: detail.title,
    desc: detail.title,
    created_time: detail.createdAt,
    CreatedAt: detail.createdAt,
    __optimistic: true,
    img: [{
      url: detail.optimisticPreviewUrl,
      signedUrl: detail.optimisticPreviewUrl
    }]
  });

  useEffect(() => {
    albumsRef.current = albums;
  }, [albums]);

  // Reset UI-only state when leaving the tab (keep loaded data)
  useEffect(() => {
    if (isActive) return;
    setSelectedAlbum(null);
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
    if (selectedAlbum) {
      setCarouselIndex(0);
      setZoomedImage(null);
      
      // Scroll modal content to bottom (100%) if scrollable (only on screens > 426px)
      setTimeout(() => {
        if (modalContentRef.current && window.innerWidth > 426) {
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

  // Lazy load: only fetch when tab becomes active for the first time
  useEffect(() => {
    if (!isActive || hasLoadedOnce) return;
    
    setHasLoadedOnce(true);
    loadAlbums();
  }, [isActive, hasLoadedOnce]);

  // Listen for photo album refresh events
  useEffect(() => {
    const handleRefresh = (event) => {
      if (import.meta.env.MODE !== 'production') {
        console.log('📸 PhotoAlbumTab: Refreshing albums after upload...');
      }
      loadAlbums({ completedOptimisticId: event.detail?.optimisticId });
    };
    
    window.addEventListener('photoalbum:refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('photoalbum:refresh', handleRefresh);
    };
  }, []);

  useEffect(() => {
    const handleOptimisticPhoto = (event) => {
      const detail = event.detail;
      if (detail?.target !== 'album' || !detail.optimisticId || !detail.optimisticPreviewUrl) return;

      const optimisticAlbum = createOptimisticAlbum(detail);
      optimisticAlbumsRef.current.set(detail.optimisticId, optimisticAlbum);

      const nextAlbums = mergeOptimisticAlbums(albumsRef.current);
      albumsRef.current = nextAlbums;
      setAlbums(nextAlbums);
      setLoading(false);
      setHasLoadedOnce(true);
    };

    const handleOptimisticComplete = (event) => {
      const detail = event.detail;
      if (detail?.target !== 'album' || !detail.optimisticId) return;

      completedOptimisticIdsRef.current.add(detail.optimisticId);
    };

    const handleOptimisticFailed = (event) => {
      const detail = event.detail;
      if (detail?.target !== 'album' || !detail.optimisticId) return;

      const optimisticAlbum = optimisticAlbumsRef.current.get(detail.optimisticId);
      revokeOptimisticAlbum(optimisticAlbum);
      optimisticAlbumsRef.current.delete(detail.optimisticId);
      completedOptimisticIdsRef.current.delete(detail.optimisticId);

      const nextAlbums = mergeOptimisticAlbums(
        albumsRef.current.filter((album) => album.Id !== detail.optimisticId)
      );
      albumsRef.current = nextAlbums;
      setAlbums(nextAlbums);
      setSelectedAlbum((current) => current?.Id === detail.optimisticId ? null : current);
    };

    window.addEventListener('pet-photo:optimistic', handleOptimisticPhoto);
    window.addEventListener('pet-photo:optimistic-complete', handleOptimisticComplete);
    window.addEventListener('pet-photo:optimistic-failed', handleOptimisticFailed);

    return () => {
      window.removeEventListener('pet-photo:optimistic', handleOptimisticPhoto);
      window.removeEventListener('pet-photo:optimistic-complete', handleOptimisticComplete);
      window.removeEventListener('pet-photo:optimistic-failed', handleOptimisticFailed);
      optimisticAlbumsRef.current.forEach(revokeOptimisticAlbum);
      optimisticAlbumsRef.current.clear();
      completedOptimisticIdsRef.current.clear();
    };
  }, []);

  const loadAlbums = async ({ completedOptimisticId = null } = {}) => {
    if (albumsRef.current.length === 0 && optimisticAlbumsRef.current.size === 0) {
      setLoading(true);
    }

    try {  
      const data = await fetchPhotoAlbums();
      if (completedOptimisticId && completedOptimisticIdsRef.current.has(completedOptimisticId)) {
        const optimisticAlbum = optimisticAlbumsRef.current.get(completedOptimisticId);
        revokeOptimisticAlbum(optimisticAlbum);
        optimisticAlbumsRef.current.delete(completedOptimisticId);
        completedOptimisticIdsRef.current.delete(completedOptimisticId);
      }

      const nextAlbums = mergeOptimisticAlbums(data);
      
      albumsRef.current = nextAlbums;
      setAlbums(nextAlbums);
    } catch (error) {
      console.error('Error loading photo albums:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && albums.length === 0) {
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
          const albumDesc = typeof album.desc === 'string' ? album.desc.trim() : '';
          const albumNotePlaceholder = lang === 'VI' ? 'Chưa có ghi chú' : 'No note yet';
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
                <div className="photoalbum-card-desc-wrapper">
                  <div className="photoalbum-card-note-badge" title={albumDesc || albumNotePlaceholder}>
                    {lang === 'VI' ? 'Ghi chú' : 'Note'}
                  </div>
                  <div className="photoalbum-card-desc-text" title={albumDesc || albumNotePlaceholder}>
                    <div className={`photoalbum-card-desc-content${albumDesc ? '' : ' photoalbum-card-desc-content-empty'}`}>
                      {albumDesc
                        ? albumDesc.length > 35
                          ? `${albumDesc.substring(0, 35)}...`
                          : albumDesc
                        : albumNotePlaceholder}
                    </div>
                    {createdDate && (
                      <div className="photoalbum-card-date">
                        {formatDateTime(createdDate, lang === 'VI')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for viewing full album*/}
      {selectedAlbum && typeof document !== 'undefined' && createPortal((
        <div className="photoalbum-modal" onClick={() => setSelectedAlbum(null)}>
          <div className="photoalbum-modal-content" ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
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

            <div className="photoalbum-modal-desc-wrapper">
              {(() => {
                const selectedDesc = typeof selectedAlbum.desc === 'string' ? selectedAlbum.desc.trim() : '';
                const notePlaceholder = lang === 'VI' ? 'Chưa có ghi chú' : 'No note yet';
                const modalDate = selectedAlbum.created_time
                  ? new Date(selectedAlbum.created_time)
                  : selectedAlbum.CreatedAt
                    ? new Date(selectedAlbum.CreatedAt)
                    : null;

                return (
                  <>
                    <div className="photoalbum-modal-note-badge" title={selectedDesc || notePlaceholder}>
                      {lang === 'VI' ? 'Ghi chú' : 'Note'}
                    </div>
                    <div className="photoalbum-modal-desc">
                      <span className={selectedDesc ? '' : 'photoalbum-modal-desc-empty'}>
                        {selectedDesc || notePlaceholder}
                      </span>
                      {modalDate && (
                        <div className="photoalbum-modal-date">
                          {formatDateTime(modalDate, lang === 'VI')}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

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
      ), document.body)}
    </div>
  );
};

export default PhotoAlbumTab;
