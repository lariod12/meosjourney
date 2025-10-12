import { useState, useEffect } from 'react';

export const useAvatar = () => {
  const [avatarUrl, setAvatarUrl] = useState(
    "https://api.dicebear.com/7.x/pixel-art/svg?seed=RPGCharacter&backgroundColor=ffffff&size=300"
  );

  useEffect(() => {
    const loadAvatar = async () => {
      const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      let avatarFound = false;
      
      // Get base path from import.meta.env (Vite's base path)
      const basePath = import.meta.env.BASE_URL;

      for (const ext of extensions) {
        try {
          const avatarPath = `${basePath}avatars/avatar.${ext}`;
          const response = await fetch(avatarPath);
          if (response.ok) {
            setAvatarUrl(avatarPath);
            avatarFound = true;
            console.log(`✅ Avatar loaded: ${avatarPath}`);
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
