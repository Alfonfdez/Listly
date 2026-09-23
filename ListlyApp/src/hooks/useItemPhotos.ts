import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { isWeb } from '../utils/platform';
import { PHOTO_QUALITY } from '../constants/types';
import { deleteItemPhotos, itemPhotoFileName } from '../utils/itemPhotos';
import { File, Paths } from '../utils/fileIo';

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

async function webPhotoUri(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  if (asset.file) return readAsDataUrl(asset.file);
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error(`Failed to fetch photo: ${response.status}`);
  const blob = await response.blob();
  return readAsDataUrl(blob);
}

async function copyPhotoToStorage(src: string): Promise<string> {
  const dest = Paths.document.uri + itemPhotoFileName();
  const destFile = new File(dest);
  await new File(src).copy(destFile, { overwrite: true });
  return dest;
}

export function useItemPhotos(initialPhotos: string[] = []) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);

  const addAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const uri = isWeb ? await webPhotoUri(asset) : await copyPhotoToStorage(asset.uri);
      setPhotos(prev => [...prev, uri]);
    } catch (err) {
      console.error('Failed to add photo:', err);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: PHOTO_QUALITY });
    if (!result.canceled && result.assets[0]) {
      await addAsset(result.assets[0]);
    }
  }, [addAsset]);

  const handlePickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: PHOTO_QUALITY });
    if (!result.canceled && result.assets[0]) {
      await addAsset(result.assets[0]);
    }
  }, [addAsset]);

  const handleRemovePhoto = useCallback(async (uri: string) => {
    await deleteItemPhotos([uri]);
    setPhotos(prev => prev.filter(p => p !== uri));
  }, []);

  return { photos, setPhotos, handleTakePhoto, handlePickFromGallery, handleRemovePhoto };
}