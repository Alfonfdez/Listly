import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import FormField from '../../src/components/FormField';

describe('FormField', () => {
  it('renders the label and children', async () => {
    const view = await render(
      <FormField label="Name">
        <Text>input</Text>
      </FormField>
    );
    expect(view.getByText('Name')).toBeTruthy();
    expect(view.getByText('input')).toBeTruthy();
  });

  it('renders the error message when provided', async () => {
    const view = await render(
      <FormField label="Name" error="Required">
        <Text>input</Text>
      </FormField>
    );
    expect(view.getByText('Required')).toBeTruthy();
  });

  it('omits the error message when null', async () => {
    const view = await render(
      <FormField label="Name" error={null}>
        <Text>input</Text>
      </FormField>
    );
    expect(view.queryByText('Required')).toBeNull();
  });
});
