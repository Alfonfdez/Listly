import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import LockListModal from '../../src/components/LockListModal';
import { resetStub } from '../helpers/configStub';

const PROPS = {
  visible: true,
  hasPhotos: false,
  mode: 'lock' as 'lock' | 'change',
  onCancel: vi.fn(),
  onConfirm: vi.fn(async () => {}),
};

describe('LockListModal', () => {
  beforeEach(() => {
    resetStub();
    PROPS.hasPhotos = false;
    PROPS.mode = 'lock';
    PROPS.onCancel.mockClear();
    PROPS.onConfirm.mockClear();
  });

  it('blocks locking (no confirm) when the list has photos', async () => {
    PROPS.hasPhotos = true;
    const view = await render(<LockListModal {...PROPS} />);
    expect(view.getByText('Remove the photos from this list before locking it.')).toBeTruthy();
    expect(view.queryByLabelText('Lock')).toBeNull();
    expect(PROPS.onConfirm).not.toHaveBeenCalled();
  });

  it('rejects a too-short passphrase', async () => {
    const user = userEvent.setup();
    const view = await render(<LockListModal {...PROPS} />);
    await user.type(view.getByLabelText('Passphrase'), 'abc');
    await user.type(view.getByLabelText('Confirm passphrase'), 'abc');
    await user.press(view.getByLabelText('Lock'));
    expect(view.getByText('Passphrase is too short')).toBeTruthy();
    expect(PROPS.onConfirm).not.toHaveBeenCalled();
  });

  it('rejects mismatched passphrases', async () => {
    const user = userEvent.setup();
    const view = await render(<LockListModal {...PROPS} />);
    await user.type(view.getByLabelText('Passphrase'), 'secret123');
    await user.type(view.getByLabelText('Confirm passphrase'), 'secret999');
    await user.press(view.getByLabelText('Lock'));
    expect(view.getByText('Passphrases do not match')).toBeTruthy();
    expect(PROPS.onConfirm).not.toHaveBeenCalled();
  });

  it('requires acknowledging the unrecoverable warning', async () => {
    const user = userEvent.setup();
    const view = await render(<LockListModal {...PROPS} />);
    await user.type(view.getByLabelText('Passphrase'), 'secret123');
    await user.type(view.getByLabelText('Confirm passphrase'), 'secret123');
    await user.press(view.getByLabelText('Lock'));
    expect(view.getByText('Please acknowledge the warning')).toBeTruthy();
    expect(PROPS.onConfirm).not.toHaveBeenCalled();
  });

  it('confirms with the passphrase once valid and acknowledged', async () => {
    const user = userEvent.setup();
    const view = await render(<LockListModal {...PROPS} />);
    await user.type(view.getByLabelText('Passphrase'), 'secret123');
    await user.type(view.getByLabelText('Confirm passphrase'), 'secret123');
    await user.press(view.getByLabelText('I understand this passphrase cannot be recovered'));
    await user.press(view.getByLabelText('Lock'));
    await waitFor(() => expect(PROPS.onConfirm).toHaveBeenCalledWith('secret123', ''));
  });

  it('change mode requires the current passphrase', async () => {
    const user = userEvent.setup();
    PROPS.mode = 'change';
    const view = await render(<LockListModal {...PROPS} />);
    await user.type(view.getByLabelText('Passphrase'), 'newsecret');
    await user.type(view.getByLabelText('Confirm passphrase'), 'newsecret');
    await user.press(view.getByLabelText('I understand this passphrase cannot be recovered'));
    await user.press(view.getByLabelText('Change'));
    expect(view.getByText('Current passphrase is incorrect')).toBeTruthy();
    expect(PROPS.onConfirm).not.toHaveBeenCalled();
  });

  it('change mode confirms with the new and current passphrases', async () => {
    const user = userEvent.setup();
    PROPS.mode = 'change';
    const view = await render(<LockListModal {...PROPS} />);
    await user.type(view.getByLabelText('Current passphrase'), 'oldsecret');
    await user.type(view.getByLabelText('Passphrase'), 'newsecret');
    await user.type(view.getByLabelText('Confirm passphrase'), 'newsecret');
    await user.press(view.getByLabelText('I understand this passphrase cannot be recovered'));
    await user.press(view.getByLabelText('Change'));
    await waitFor(() => expect(PROPS.onConfirm).toHaveBeenCalledWith('newsecret', 'oldsecret'));
  });
});
