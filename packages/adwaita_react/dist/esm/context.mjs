"use strict";
"use client";
import { createContext, useContext, useMemo, createElement } from 'react';

const AdwaitaContext = createContext({});
function AdwaitaProvider({
  children,
  size,
  color,
  strokeWidth,
  absoluteStrokeWidth,
  nonScalingStroke,
  className
}) {
  const value = useMemo(
    () => ({
      size,
      color,
      strokeWidth,
      absoluteStrokeWidth,
      nonScalingStroke,
      className
    }),
    [size, color, strokeWidth, absoluteStrokeWidth, nonScalingStroke, className]
  );
  return createElement(AdwaitaContext.Provider, { value }, children);
}
const useAdwaitaContext = () => useContext(AdwaitaContext);

export { AdwaitaProvider, useAdwaitaContext };
//# sourceMappingURL=context.mjs.map
