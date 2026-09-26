import React, { Fragment, useLayoutEffect, type ElementType, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

interface GridProps {
  data?: unknown[];
  renderItem?: (info: { item: unknown; index: number }) => ReactNode;
  keyExtractor?: (item: unknown) => string;
  sortEnabled?: boolean;
  columns?: number;
  columnGap?: number;
  rowGap?: number;
  onDragEnd?: (params: unknown) => void;
  onDragStart?: (params: unknown) => void;
  children?: ReactNode;
}

let lastGridProps: GridProps | null = null;

const Grid = (props: GridProps) => {
  const { data = [], renderItem, keyExtractor, children = null } = props;
  useLayoutEffect(() => {
    lastGridProps = props;
  });
  return renderItem
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
};

interface TouchableProps {
  onTap?: () => void;
  children?: ReactNode;
  [key: string]: unknown;
}

const Touchable = ({ onTap, children, ...viewProps }: TouchableProps) =>
  React.createElement(Pressable, { onPress: onTap, ...viewProps }, children);

const PassThrough = ({ children }: { children?: ReactNode }) => children as ReactNode;

interface ZoneHandlersProps {
  minActivationDistance?: number;
  onItemEnter?: () => void;
  onItemLeave?: () => void;
  onItemDrop?: () => void;
  children?: ReactNode;
  [key: string]: unknown;
}

let lastZoneHandlerProps: ZoneHandlersProps[] = [];

const BaseZone = (props: ZoneHandlersProps) => {
  const { children, onItemEnter, onItemLeave, onItemDrop, minActivationDistance, ...viewProps } = props;
  useLayoutEffect(() => {
    lastZoneHandlerProps.push(props);
  });
  void onItemEnter;
  void onItemLeave;
  void onItemDrop;
  void minActivationDistance;
  return React.createElement(View, viewProps, children);
};

const HOLLOW_COMPONENTS: Record<string, ElementType> = {
  Flex: PassThrough,
  Handle: PassThrough,
  Layer: PassThrough,
  PortalProvider: PassThrough,
  MultiZoneProvider: PassThrough,
  BaseZone,
};

const Sortable = { Grid, Touchable, ...HOLLOW_COMPONENTS };

export function lastGrid() {
  return lastGridProps;
}

export function fireGridDragEnd(params: unknown) {
  lastGridProps?.onDragEnd?.(params);
}

export function fireGridDragStart(params: unknown) {
  lastGridProps?.onDragStart?.(params);
}

export function getZoneHandlers() {
  return lastZoneHandlerProps;
}

export function resetZoneHandlers() {
  lastZoneHandlerProps = [];
}

export default Sortable;