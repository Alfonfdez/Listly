import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import FullscreenViewer from '../../src/components/FullscreenViewer';

describe('FullscreenViewer', () => {
  it('renders children and the close control when visible', async () => {
    const view = await render(
      <FullscreenViewer visible onClose={vi.fn()}>
        <Text>content</Text>
      </FullscreenViewer>,
    );
    expect(view.getByText('content')).toBeTruthy();
    expect(view.getByLabelText('Close')).toBeTruthy();
  });

  it('calls onClose when the close control is pressed', async () => {
    const onClose = vi.fn();
    const view = await render(
      <FullscreenViewer visible onClose={onClose}>
        <Text>content</Text>
      </FullscreenViewer>,
    );
    fireEvent.press(view.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when tapping the backdrop outside the content', async () => {
    const onClose = vi.fn();
    const view = await render(
      <FullscreenViewer visible onClose={onClose}>
        <Text>content</Text>
      </FullscreenViewer>,
    );
    fireEvent.press(view.getByTestId('viewer-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when tapping the content', async () => {
    const onClose = vi.fn();
    const view = await render(
      <FullscreenViewer visible onClose={onClose}>
        <Text>content</Text>
      </FullscreenViewer>,
    );
    fireEvent.press(view.getByText('content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders nothing when hidden', async () => {
    const view = await render(
      <FullscreenViewer visible={false} onClose={vi.fn()}>
        <Text>content</Text>
      </FullscreenViewer>,
    );
    expect(view.queryByText('content')).toBeNull();
  });
});
