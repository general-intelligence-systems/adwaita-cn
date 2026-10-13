const hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
  return false;
};

export { hasA11yProp };
//# sourceMappingURL=hasA11yProp.mjs.map
