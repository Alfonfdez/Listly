import PhotoSection from './PhotoSection';

interface Props {
  photos: string[];
  onTakePhoto: () => Promise<void>;
  onPickFromGallery: () => Promise<void>;
  onRemovePhoto: (uri: string) => Promise<void>;
  /** Smaller squares for the inline add bar. */
  compact?: boolean;
}

export default function ItemPhotosField({
  photos,
  onTakePhoto,
  onPickFromGallery,
  onRemovePhoto,
  compact = false,
}: Props) {
  return (
    <PhotoSection
      photos={photos}
      onTakePhoto={() => void onTakePhoto()}
      onPickFromGallery={() => void onPickFromGallery()}
      onRemovePhoto={uri => void onRemovePhoto(uri)}
      compact={compact}
    />
  );
}
