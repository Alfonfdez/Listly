import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import ErrorBoundary from '../../src/components/ErrorBoundary';
import { resetStub } from '../helpers/configStub';

let shouldThrow = true;

function Flaky() {
  if (shouldThrow) throw new Error('render boom');
  return <Text>recovered</Text>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    resetStub();
    shouldThrow = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the fallback when a child throws', async () => {
    const view = await render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>
    );

    expect(view.getByText('Something went wrong')).toBeTruthy();
    expect(view.getByText('Try again')).toBeTruthy();
  });

  it('recovers when retry is pressed after the error is resolved', async () => {
    const view = await render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>
    );
    expect(view.getByText('Something went wrong')).toBeTruthy();

    shouldThrow = false;
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Try again' }));
    });

    await waitFor(() => expect(view.getByText('recovered')).toBeTruthy());
  });
});
