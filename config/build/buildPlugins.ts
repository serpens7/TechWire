import webpack from 'webpack';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { BuildOptions } from './types/config';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// eslint-disable-next-line max-len
export function buildPlugins({ paths, isDev, apiUrl, project }: BuildOptions): webpack.WebpackPluginInstance[] {
    const plugins: webpack.WebpackPluginInstance[] = [
        new HtmlWebpackPlugin({
            template: paths.html,
        }),
        new webpack.ProgressPlugin(),
        // NOTE: the placeholder must be `[contenthash:8]` with no space —
        // `[contenthash: 8]` is not recognised, so webpack emitted files
        // literally named `css/main.[contenthash` while the generated HTML
        // asked for `css/main.%5Bcontenthash%3A%208%5D.css`. The two never
        // matched, so production builds shipped with no stylesheet at all.
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash:8].css',
            chunkFilename: 'css/[name].[contenthash:8].css',
        }),
        new webpack.DefinePlugin({
            __IS_DEV__: JSON.stringify(isDev),
            __API__: JSON.stringify(apiUrl),
            __PROJECT__: JSON.stringify(project),
        }),
        new webpack.HotModuleReplacementPlugin(),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
        }),
    ];

    if (isDev) {
        // Paired with swc-loader's jsc.transform.react.refresh (buildLoaders.ts):
        // edited components keep their state instead of remounting on save.
        plugins.push(new ReactRefreshWebpackPlugin({ overlay: false }));
    }

    if (!isDev) {
        // Runtime i18next loads locales from /locales/{{lng}}/{{ns}}.json, so the
        // public/locales folder must be emitted into the build output. In dev this
        // is served automatically by webpack-dev-server from public/.
        plugins.push(new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(paths.public, 'locales'),
                    to: paths.buildLocales,
                },
            ],
        }));
    }

    return plugins;
}