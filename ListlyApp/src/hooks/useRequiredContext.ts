import { useContext, type Context } from 'react';

export function useRequiredContext<T>(context: Context<T | null>, hookName: string, providerName: string): T {
  const value = useContext(context);
  if (!value) throw new Error(`${hookName} must be used within ${providerName}`);
  return value;
}
