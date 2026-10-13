'use client';

import { createContext, createElement, type ReactNode, useContext, useMemo } from 'react';
import { AdwaitaProps } from './types';

type AdwaitaConfig = {
  size: number;
  color: string;
  strokeWidth: number;
  /**
   * @deprecated Use `nonScalingStroke` instead.
   */
  absoluteStrokeWidth: boolean;
  nonScalingStroke: boolean;
  className: string;
};

const AdwaitaContext = createContext<AdwaitaProps>({});

type AdwaitaProviderProps = {
  children: ReactNode;
} & Partial<AdwaitaConfig>;

export function AdwaitaProvider({
  children,
  size,
  color,
  strokeWidth,
  absoluteStrokeWidth,
  nonScalingStroke,
  className,
}: AdwaitaProviderProps) {
  const value = useMemo(
    () => ({
      size,
      color,
      strokeWidth,
      absoluteStrokeWidth,
      nonScalingStroke,
      className,
    }),
    [size, color, strokeWidth, absoluteStrokeWidth, nonScalingStroke, className],
  );

  return createElement(AdwaitaContext.Provider, { value }, children);
}

export const useAdwaitaContext = () => useContext(AdwaitaContext);
