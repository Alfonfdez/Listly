import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import ScreenShell from './ScreenShell';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <ScreenShell style={styles.container}>
      <Ionicons name="alert-circle-outline" size={64} color={c.textSecondary} />
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>
        {labels.error_boundary_title}
      </Text>
      <Text style={[styles.message, { color: c.textSecondary, fontSize: fs(14) }]}>
        {labels.error_boundary_message}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.button, { backgroundColor: c.primary }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={labels.error_boundary_retry}
      >
        <Text style={[styles.buttonText, { color: c.background, fontSize: fs(15) }]}>
          {labels.error_boundary_retry}
        </Text>
      </Pressable>
    </ScreenShell>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
});
