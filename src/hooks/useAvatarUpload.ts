import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase }       from '@/lib/supabase/client';
import { useAuth }        from '@/providers/AuthProvider';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAvatarUploadReturn {
  /** Upload a cropped Blob, save to Storage and update both profile + auth metadata. Returns the new URL. */
  upload:      (blob: Blob) => Promise<string>;
  /** Delete from Storage and clear avatar_url from both profile + auth metadata. */
  remove:      () => Promise<void>;
  isUploading: boolean;
}

export function useAvatarUpload(): UseAvatarUploadReturn {
  const { user, updateProfile } = useAuth();
  const queryClient             = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (blob: Blob): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    setIsUploading(true);
    try {
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
