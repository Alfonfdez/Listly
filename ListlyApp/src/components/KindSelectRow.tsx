import { useLabels } from '../hooks/useLabels';
import FormField from './FormField';
import SelectorInline, { type Option } from './settings/SelectorInline';
import { LIST_KINDS, type ListKind } from '../constants/types';

interface Props {
  kind: ListKind;
  onChange: (kind: ListKind) => void;
  disabled?: boolean;
}

export default function KindSelectRow({ kind, onChange, disabled = false }: Props) {
  const labels = useLabels();

  const options: Option<ListKind>[] = [
    { label: labels.list_kind_standard, value: LIST_KINDS.standard },
    { label: labels.list_kind_numeric, value: LIST_KINDS.numeric },
  ];

  if (disabled) return null;

  return (
    <FormField label={labels.list_kind_label}>
      <SelectorInline options={options} selected={kind} onSelect={onChange} />
    </FormField>
  );
}
