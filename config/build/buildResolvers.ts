import path from 'path'
import { ResolveOptions } from 'webpack'
import { BuildPaths } from './types/config'

export const buildResolvers = (paths: BuildPaths): ResolveOptions => ({
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
        '@': paths.src,
        // Force a single React copy so a duplicate transitive React can never
        // cause an invalid-hook-call. Alias the package DIRECTORY (not
        // require.resolve('react'), which returns the entry file and would break
        // subpath imports like react/jsx-runtime).
        react: path.dirname(require.resolve('react/package.json')),
        'react-dom': path.dirname(require.resolve('react-dom/package.json')),
    },
})