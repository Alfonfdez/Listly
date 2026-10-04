import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import PhotoSection from '../../src/components/PhotoSection';
import { resetStub } from '../helpers/configStub';

const { handlers } = vi.hoisted(() => ({
  handlers: {
    onTakePhoto: vi.fn(),
    onPickFromGallery: vi.fn(),
    onRemovePhoto: vi.fn(),
  },
}));

describe('PhotoSection', () => {
  beforeEach(() => {
    resetStub();
    handlers.onTakePhoto.mockReset();
    handlers.onPickFromGallery.mockReset();
    handlers.onRemovePhoto.mockReset();
  });

  function renderSection(photos: string[]) {
    return render(
      <PhotoSection
        photos={photos}
        onTakePhoto={handlers.onTakePhoto}
        onPickFromGallery={handlers.onPickFromGallery}
        onRemovePhoto={handlers.onRemovePhoto}
      />
    );
  }

  it('renders an add button when under the limit', async () => {
    const view = await renderSection(['data:image/a']);
    expect(view.getByLabelText('Add photo')).toBeTruthy();
  });

  it('hides the add button at the maximum of 3 photos', async () => {
    const view = await renderSection(['data:image/a', 'data:image/b', 'data:image/c']);
    expect(view.queryByLabelText('Add photo')).toBeNull();
  });

  it('shows a thumbnail and remove button per photo', async () => {
    const view = await renderSection(['data:image/a', 'data:image/b']);
    expect(view.getAllByLabelText('Remove photo')).toHaveLength(2);
  });

  it('requires confirmation before removing a photo', async () => {
    const view = await renderSection(['data:image/a']);
    fireEvent.press(view.getAllByLabelText('Remove photo')[0]);
    expect(await view.findByText('Delete this photo?')).toBeTruthy();
    expect(handlers.onRemovePhoto).not.toHaveBeenCalled();

    const removes = view.getAllByLabelText('Remove photo');
    fireEvent.press(removes[removes.length - 1]);
    expect(handlers.onRemovePhoto).toHaveBeenCalledWith('data:image/a');
  });

  it('cancelling the remove confirmation keeps the photo', async () => {
    const view = await renderSection(['data:image/a']);
    fireEvent.press(view.getAllByLabelText('Remove photo')[0]);
    await view.findByText('Delete this photo?');
    fireEvent.press(view.getByLabelText('Cancel'));
    expect(handlers.onRemovePhoto).not.toHaveBeenCalled();
  });

  it('offers the source options from the add button and calls the gallery handler', async () => {
    const view = await renderSection([]);
    fireEvent.press(view.getByLabelText('Add photo'));
    expect(await view.findByText('Add from gallery')).toBeTruthy();

    fireEvent.press(view.getByText('Add from gallery'));
    expect(handlers.onPickFromGallery).toHaveBeenCalled();
  });

  it('cancel keeps the source modal closed with no photo added', async () => {
    const view = await renderSection([]);
    fireEvent.press(view.getByLabelText('Add photo'));
    await view.findByText('Add from gallery');
    fireEvent.press(view.getByLabelText('Cancel'));
    expect(handlers.onPickFromGallery).not.toHaveBeenCalled();
  });
});