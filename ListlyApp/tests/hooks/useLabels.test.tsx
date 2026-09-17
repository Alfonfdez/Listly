import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useLabels } from '../../src/hooks/useLabels';
import { resetStub, setConfig } from '../helpers/configStub';

function Probe() {
  const labels = useLabels();
  return <Text>{labels.settings_title}</Text>;
}

describe('useLabels', () => {
  beforeEach(() => resetStub());

  it('returns the labels for the configured language', async () => {
    setConfig({ language: 'es' });
    const view = await render(<Probe />);
    expect(view.getByText('Ajustes')).toBeTruthy();
  });

  it('defaults to English', async () => {
    const view = await render(<Probe />);
    expect(view.getByText('Settings')).toBeTruthy();
  });
});
