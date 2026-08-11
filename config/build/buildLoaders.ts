import webpack from 'webpack';
import { BuildOptions } from './types/config';
import { buildCssLoader } from './loaders/buildCssLoader';

export function buildLoaders({ isDev }: BuildOptions): webpack.RuleSetRule[] {

    // svgo (which svgr runs by default) strips `viewBox` via its
    // `removeViewBox` plugin. Without a viewBox an <svg> cannot be resized:
    // setting width/height just crops the canvas while the paths keep their
    // original coordinates, so any icon rendered smaller than its authored
    // size gets clipped instead of scaled. Keeping the viewBox makes the icons
    // genuinely scalable.
    const svgLoader = {
        test: /\.svg$/,
        use: [
            {
                loader: '@svgr/webpack',
                options: {
                    svgoConfig: {
                        plugins: [
                            {
                                name: 'preset-default',
                                params: {
                                    overrides: { removeViewBox: false },
                                },
                            },
                        ],
                    },
                },
            },
        ],
    }

    const jsResolveLoader = {
        test: /\.m?js$/,
        include: /node_modules/,
        resolve: {
            fullySpecified: false,
        },
    }

    const fileLoader = {
        test: /\.(png|jpe?g|gif|woff2|woff)$/i,
        use: [
            {
                loader: 'file-loader',
            },
        ],
    }

    const cssLoader = buildCssLoader(isDev);

    // SWC (Rust) transpiles TS/JSX far faster than ts-loader. Type-checking is
    // NOT done here — it lives in the separate `npm run type:check` (tsc --noEmit),
    // exactly as ts-loader's `transpileOnly: true` behaved before.
    const codeLoader = {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
            loader: 'swc-loader',
            options: {
                jsc: {
                    parser: {
                        syntax: 'typescript',
                        tsx: true,
                    },
                    // Matches tsconfig target: es6
                    target: 'es2015',
                    transform: {
                        react: {
                            // Matches tsconfig jsx: react-jsx
                            runtime: 'automatic',
                            development: isDev,
                            // Paired with ReactRefreshWebpackPlugin (buildPlugins.ts):
                            // component state survives edits instead of remounting.
                            refresh: isDev,
                        },
                    },
                },
            },
        },
    };
    return [
        jsResolveLoader,
        svgLoader,
        fileLoader,
        codeLoader,
        cssLoader
    ];
}