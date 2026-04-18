import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase }       from '@/lib/supabase/client';
import { useAuth }        from '@/providers/AuthProvider';

// ─── Canvas resize ────────────────────────────────────────────────────────────

const MAX_PX   = 256;
const QUALITY  = 0.8;

function resizeToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      const scale = Math.min(MAX_PX / width, MAX_PX / height, 1);

      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(width  * scale);
      canvas.height = Math.round(height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas 2d unavailable')); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
        'image/jpeg',
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('failed to load image for resize'));
    };

    img.src = url;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAvatarUploadReturn {
  /** Upload a File, resize it, save to Storage and update both profile + auth metadata. Returns the new URL. */
  upload:      (file: File) => Promise<string>;
  /** Delete from Storage and clear avatar_url from both profile + auth metadata. */
  remove:      () => Promise<void>;
  isUploading: boolean;
}

export function useAvatarUpload(): UseAvatarUploadReturn {
  const { user, updateProfile } = useAuth();
  const queryClient             = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    setIsUploading(true);
    try {
      const blob = await resizeToBlob(file);
      const path = `${user.id}/avatar.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadErr) throw uploadErr;

      // Cache-busting timestamp so the browser fetches the new image
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // Persist in auth user metadata (fast read for own profile)
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      // Persist in profiles table (needed for partner to see our avatar)
      const { error: profileErr } = await updateProfile({ avatar_url: publicUrl });
      if (profileErr) throw profileErr;

      queryClient.invalidateQueries({ queryKey: ['profiles'] });

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const remove = async (): Promise<void> => {
    if (!user) return;
    setIsUploading(true);
    try {
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`]);
      await supabase.auth.updateUser({ data: { avatar_url: null } });

      const { error: profileErr } = await updateProfile({ avatar_url: null });
      if (profileErr) throw profileErr;

      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, remove, isUploading };
}
