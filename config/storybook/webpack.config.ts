import webpack, { DefinePlugin, RuleSetRule } from 'webpack';
import { BuildPaths } from '../build/types/config';
import { buildCssLoader } from '../build/loaders/buildCssLoader';
import path from 'path';

export default ({ config }: { config: webpack.Configuration }) => {
    const paths: BuildPaths = {
        build: '',
        html: '',
        entry: '',
        src: path.resolve(__dirname, '..', '..', 'src'),
        public: '',
        buildLocales: '',
    };
    config.resolve ??= {};
    config.resolve.modules ??= [];
    config.resolve.extensions ??= [];

    config.resolve.modules.push(paths.src);
    config.resolve.extensions.push('.ts', '.tsx');

    config.resolve.alias = {
        ...config.resolve.alias,
        '@': paths.src,
        app: path.resolve(paths.src, 'app'),
    };

    config.module ??= { rules: [] };
    config.module.rules = (config.module.rules || []).map((rule) => {
        const typedRule = rule as RuleSetRule;

        if (typedRule.test instanceof RegExp && typedRule.test.test('.svg')) {
            return {
                ...typedRule,
                exclude: /\.svg$/i,
            };
        }

        return typedRule;
    });

    config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
    });
    config.module.rules.push(buildCssLoader(true));

    config.plugins?.push(
        new DefinePlugin({
            __IS_DEV__: true,
            __API__: JSON.stringify(''),
            __PROJECT__: JSON.stringify('storybook'),
        })
    );

    return config;
};
