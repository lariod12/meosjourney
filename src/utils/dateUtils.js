export const formatDate = (date, locale = 'vi-VN', includeWeekday = false) => {
  if (!date) return '';
  if (String(locale).toLowerCase().startsWith('vi')) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    if (includeWeekday) {
      const weekdaysVI = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const weekday = weekdaysVI[date.getDay()];
      return `${dd}/${mm}/${yyyy} (${weekday})`;
    }
    return `${dd}/${mm}/${yyyy}`; // Việt Nam: ngày/tháng/năm
  }
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(locale, options);
};

export const getTimeAgo = (timestamp, locale = 'VI') => {
  const now = new Date();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  // Check if Vietnamese
  const isVI = String(locale).toUpperCase().startsWith('VI');

  if (seconds < 30) {
    return isVI ? 'Vừa xong' : 'Just now';
  } else if (seconds < 60) {
    return isVI ? `${seconds} giây trước` : `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return isVI ? `${minutes} phút trước` : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return isVI ? `${hours} giờ trước` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return isVI ? `${days} ngày trước` : `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (weeks < 4) {
    return isVI ? `${weeks} tuần trước` : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (months < 12) {
    return isVI ? `${months} tháng trước` : `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    return isVI ? `${years} năm trước` : `${years} year${years > 1 ? 's' : ''} ago`;
  }
};

// Format "H:MM AM/PM" to 24h (HH:mm) for vi-VN; otherwise keep original
export const formatTime = (timeStr, locale = 'vi-VN') => {
  if (!timeStr) return '';
  const s = String(timeStr).trim();
  const isVI = String(locale).toLowerCase().startsWith('vi');
  if (!isVI) return s;

  // Already 24h like HH:mm
  if (/^\d{1,2}:\d{2}$/.test(s) && !/\s?(AM|PM)$/i.test(s)) {
    const [h, m] = s.split(':');
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return s;
  let hour = parseInt(m[1], 10);
  const minute = m[2];
  const period = m[3].toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
};
