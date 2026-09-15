import { File } from './fileIo';

let photoCounter = 0;

export function parseItemPhotos(pictures: string | null | undefined): string[] {
  if (!pictures) return [];
  try {
    const parsed = JSON.parse(pictures);
    return Array.isArray(parsed) ? parsed : [pictures];
  } catch {
    return [pictures];
  }
}

export function serializeItemPhotos(photos: string[]): string | null {
  return photos.length > 0 ? JSON.stringify(photos) : null;
}

export function itemPhotoFileName(): string {
  photoCounter += 1;
  return `item_photo_${Date.now()}_${photoCounter}.jpg`;
}

export async function deleteItemPhotos(photos: string[]): Promise<void> {
  if (photos.length === 0) return;
  for (const uri of photos) {
    if (uri.startsWith('data:')) continue;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch (error) {
      console.warn('Failed to delete photo:', uri, error);
    }
  }
}