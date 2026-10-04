import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { isWeb } from '../utils/platform';
import { PHOTO_QUALITY } from '../constants/types';
import { copyItemPhotoToStorage, deleteItemPhotos } from '../utils/itemPhotos';
import { logError, ERROR_SCOPE } from '../utils/errors';

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

export function useItemPhotos(initialPhotos: string[] = []) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);

  const addAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const uri = isWeb ? await webPhotoUri(asset) : await copyItemPhotoToStorage(asset.uri);
      setPhotos(prev => [...prev, uri]);
    } catch (err) {
      logError(ERROR_SCOPE.addPhoto, err);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: PHOTO_QUALITY });
      if (!result.canceled && result.assets[0]) {
        await addAsset(result.assets[0]);
      }
    } catch (err) {
      logError(ERROR_SCOPE.addPhoto, err);
    }
  }, [addAsset]);

  const handlePickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: PHOTO_QUALITY });
      if (!result.canceled && result.assets[0]) {
        await addAsset(result.assets[0]);
      }
    } catch (err) {
      logError(ERROR_SCOPE.addPhoto, err);
    }
  }, [addAsset]);

  const handleRemovePhoto = useCallback(async (uri: string) => {
    try {
      await deleteItemPhotos([uri]);
    } catch (err) {
      logError(ERROR_SCOPE.removePhoto, err);
    }
    setPhotos(prev => prev.filter(p => p !== uri));
  }, []);

  return { photos, setPhotos, handleTakePhoto, handlePickFromGallery, handleRemovePhoto };
}