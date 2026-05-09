import { useMemo } from 'react';

export function useUserPageHeader(noteDate) {
  const formattedDate = useMemo(() => {
    return new Date(noteDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [noteDate]);

  const goHome = () => {
    const base = window.location.hostname.endsWith('github.io')
      && window.location.pathname.startsWith('/meosjourney')
      ? '/meosjourney/'
      : '/';
    window.location.href = base;
  };

  return {
    formattedDate,
    goHome
  };
}
