import { useState, useEffect } from 'react';
import { fetchPhotoAlbums } from '../../../services/nocodb';
import { useLanguage } from '../../../contexts';
import './PhotoAlbumTab.css';

const PhotoAlbumTab = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const { t, lang } = useLanguage();

  // Format datetime in a simple and elegant way
  const formatDateTime = (date, isVietnamese = true) => {
    if (!date) return '';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (isVietnamese) {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } else {
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const data = await fetchPhotoAlbums();
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
                    <div className="photoalbum-card-note-badge" title={album.desc}>Ghi chú</div>
                    <div className="photoalbum-card-desc-text" title={album.desc}>
                      {album.desc.length > 100 ? `${album.desc.substring(0, 100)}...` : album.desc}
                    </div>
                  </div>
                )}

                {createdDate && (
                  <div className="photoalbum-card-date">
                    {formatDateTime(createdDate, lang === 'VI')}
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

            <div className="photoalbum-modal-grid">
              {(selectedAlbum.img || []).map((image, index) => (
                <div key={index} className="photoalbum-modal-image">
                  <img
                    src={image.signedUrl || image.url}
                    alt={`${selectedAlbum.desc || 'Album'} ${index + 1}`}
                  />
                </div>
              ))}
            </div>

            {selectedAlbum.desc && (
              <div className="photoalbum-modal-desc-wrapper">
                <div className="photoalbum-modal-note-badge" title={selectedAlbum.desc}>Ghi chú</div>
                <div className="photoalbum-modal-desc">{selectedAlbum.desc}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoAlbumTab;
