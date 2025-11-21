import { useState, useEffect } from 'react';
import { fetchProfile } from '../services/nocodb';

/**
 * Custom hook for loading avatar image
 * Priority order:
 * 1. NocoDB (profile -> avatar_img -> img_bw)
 * 2. Local file (public/avatars/avatar.*)
 * 3. Template (DiceBear API)
 */
export const useAvatar = () => {
  const [avatarUrl, setAvatarUrl] = useState(
    "https://api.dicebear.com/7.x/pixel-art/svg?seed=RPGCharacter&backgroundColor=ffffff&size=300"
  );

  useEffect(() => {
    const loadAvatar = async () => {
      // Step 1: Try to load from NocoDB
      try {
        const profile = await fetchProfile();
        if (profile?.avatarUrl) {
          setAvatarUrl(profile.avatarUrl);
          console.log('✅ Avatar loaded from NocoDB');
          return;
        }
      } catch (nocoError) {
        console.warn('⚠️ Failed to load avatar from NocoDB:', nocoError);
      }

      // Step 2: Try to load from local file
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
            console.log('✅ Avatar loaded from local file');
            break;
          }
        } catch (err) {
          continue;
        }
      }

      // Step 3: Use template avatar (already set as default)
      if (!avatarFound) {
        console.log('ℹ️ No custom avatar found, using template avatar');
      }
    };

    loadAvatar();
  }, []);

  return avatarUrl;
};
