import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import preserveDirectives from 'rollup-plugin-preserve-directives';
import { fileURLToPath } from 'node:url';

// `@adwaita/shared` is a private workspace package whose `main` is TypeScript source, so
// it cannot be left for a consumer to install -- rollup resolves no bare specifier
// without a resolver plugin, so it was being treated as external and the published
// bundles imported a package that will never exist on anybody's disk. Resolved here
// instead of adding a dependency, which also keeps the build working offline.
const sharedRoot = fileURLToPath(new URL('../shared/src/', import.meta.url));

const shared = {
  name: 'adwaita-shared',
  resolveId(id) {
    if (id === '@adwaita/shared') return `${sharedRoot}index.ts`;
    if (id.startsWith('@adwaita/shared/')) {
      return `${sharedRoot}build/${id.slice('@adwaita/shared/'.length)}.ts`;
    }

    return null;
  },
};

const dtsOptions = {
  includeExternal: ['@adwaita/shared/types'],
  tsconfig: './tsconfig.json',
};

const packageName = 'AdwaitaReact';
const outputFileName = 'adwaita_react';
const inputs = [`src/${outputFileName}.ts`];

const bundles = [
  {
    format: 'cjs',
    inputs,
    outputDir: 'dist/cjs',
    extension: 'js',
  },
  {
    format: 'esm',
    inputs,
    outputDir: 'dist/esm',
    preserveModules: true,
    extension: 'mjs',
  },
  {
    format: 'esm',
    inputs: ['src/dynamicIconImports.ts', 'src/DynamicIcon.ts'],
    outputDir: 'dist/esm',
    external: [/src/],
    preserveModules: true,
    extension: 'mjs',
    paths: (id) => {
      if (id.match(/src/)) {
        const [, modulePath] = id.match(/src\/(.*)\.ts/);

        return `./${modulePath}.mjs`;
      }
    },
  },
  {
    format: 'esm',
    inputs: ['src/dynamic.ts'],
    outputFile: 'dynamic.mjs',
    external: [/src/],
    extension: 'mjs',
    paths: (id) => {
      if (id.match(/src/)) {
        const [, modulePath] = id.match(/src\/(.*)\.ts/);

        return `dist/esm/${modulePath}.mjs`;
      }
    },
  },
];

const configs = bundles
  .map(
    ({
      inputs,
      outputDir,
      outputFile,
      format,
      preserveModules,
      extension = 'js',
      external = [],
      paths,
    }) =>
      inputs.map((input) => ({
        input,
        plugins: [
          shared,
          esbuild({ tsconfig: './tsconfig.json' }),
          // Make sure we emit "use client" directive to make it compatible with Next.js
          preserveDirectives({
            include: [
              'src/adwaita_react.ts',
              'src/DynamicIcon.ts',
              'src/context.ts',
              'src/Icon.ts',
            ],
            suppressPreserveModulesWarning: true,
          }),
        ],
        external: ['react', ...external],
        output: {
          name: packageName,
          ...(preserveModules
            ? { dir: outputDir, entryFileNames: `[name].${extension}` }
            : { file: outputFile ?? `${outputDir}/${outputFileName}.${extension}` }),
          paths,
          format,
          sourcemap: true,
          preserveModules,
          preserveModulesRoot: 'src',
          globals: { react: 'react' },
        },
      })),
  )
  .flat();

export default [
  {
    input: 'src/dynamic.ts',
    output: [
      { file: `dynamic.d.ts`, format: 'es' },
      { file: `dynamic.d.mts`, format: 'es' },
    ],
    plugins: [shared, dts(dtsOptions)],
  },
  {
    input: inputs[0],
    output: [{ file: `dist/${outputFileName}.d.ts`, format: 'es' }],
    plugins: [shared, dts(dtsOptions)],
  },
  ...configs,
];
