import { useConfig } from '../context/ConfigContext';

interface ItemDisplayFlags {
  showNotes: boolean;
  showPhotos: boolean;
  editShowNotes: boolean;
  editShowPhotos: boolean;
}

export function useItemDisplayFlags(numeric: boolean): ItemDisplayFlags {
  const { config } = useConfig();

  return numeric
    ? {
        showNotes: config.showNotesNumeric,
        showPhotos: config.showPhotosNumeric,
        editShowNotes: config.editShowNotesNumeric,
        editShowPhotos: config.editShowPhotosNumeric,
      }
    : {
        showNotes: config.showNotes,
        showPhotos: config.showPhotos,
        editShowNotes: config.editShowNotes,
        editShowPhotos: config.editShowPhotos,
      };
}
