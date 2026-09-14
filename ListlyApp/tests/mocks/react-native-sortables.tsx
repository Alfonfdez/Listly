import React, { Fragment, type ElementType, type ReactNode } from 'react';
import { Pressable } from 'react-native';

interface GridProps {
  data?: unknown[];
  renderItem?: (info: { item: unknown; index: number }) => ReactNode;
  keyExtractor?: (item: unknown) => string;
  children?: ReactNode;
}

const Grid = ({ data = [], renderItem, keyExtractor, children = null }: GridProps) =>
  renderItem
    ? React.createElement(
        Fragment,
        null,
        (data as unknown[]).map((item, index) => (
          <Fragment key={keyExtractor ? keyExtractor(item) : String((item as { id?: unknown }).id)}>
            {renderItem({ item, index })}
          </Fragment>
        ))
      )
    : React.createElement(Fragment, null, children);

interface TouchableProps {
  onTap?: () => void;
  children?: ReactNode;
  [key: string]: unknown;
}

const Touchable = ({ onTap, children, ...viewProps }: TouchableProps) =>
  React.createElement(Pressable, { onPress: onTap, ...viewProps }, children);

const PassThrough = ({ children }: { children?: ReactNode }) => children as ReactNode;

const HOLLOW_COMPONENTS: Record<string, ElementType> = {
  Flex: PassThrough,
  Handle: PassThrough,
  Layer: PassThrough,
  PortalProvider: PassThrough,
  MultiZoneProvider: PassThrough,
  BaseZone: PassThrough,
};

const Sortable = { Grid, Touchable, ...HOLLOW_COMPONENTS };

export default Sortable;