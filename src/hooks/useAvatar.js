import { useState, useEffect } from 'react';

export const useAvatar = () => {
  const [avatarUrl, setAvatarUrl] = useState(
    "https://api.dicebear.com/7.x/pixel-art/svg?seed=RPGCharacter&backgroundColor=ffffff&size=300"
  );

  useEffect(() => {
    const loadAvatar = async () => {
      const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      let avatarFound = false;

      for (const ext of extensions) {
        try {
          const response = await fetch(`/public/avatars/avatar.${ext}`);
          if (response.ok) {
            setAvatarUrl(`/public/avatars/avatar.${ext}`);
            avatarFound = true;
            console.log(`✅ Avatar loaded: avatar.${ext}`);
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!avatarFound) {
        console.log('ℹ️ No custom avatar found, using template avatar');
      }
    };

    loadAvatar();
  }, []);

  return avatarUrl;
};
