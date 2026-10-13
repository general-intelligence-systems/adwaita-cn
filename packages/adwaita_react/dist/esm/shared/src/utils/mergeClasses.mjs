const mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

export { mergeClasses };
//# sourceMappingURL=mergeClasses.mjs.map
