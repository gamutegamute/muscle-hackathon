import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { auth, firebaseStorage } from '@/lib/firebase-client';

type ClosableBlob = Blob & {
  close?: () => void;
};

function uriToBlob(uri: string) {
  return new Promise<ClosableBlob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as ClosableBlob);
    xhr.onerror = () => reject(new Error('failed to load avatar image'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send();
  });
}

export async function uploadAvatarImage(uri: string, contentType?: string | null) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('avatar upload requires a signed-in user');
  }

  const blob = await uriToBlob(uri);

  try {
    const metadata = {
      contentType: contentType || blob.type || 'image/jpeg',
    };
    const avatarRef = ref(firebaseStorage, `users/${currentUser.uid}/avatar.jpg`);

    await uploadBytes(avatarRef, blob, metadata);
    return await getDownloadURL(avatarRef);
  } finally {
    blob.close?.();
  }
}
