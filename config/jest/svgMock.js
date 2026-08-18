/**
 * Заглушка для импортов *.svg в jest.
 *
 * Пропсы прокидываются в <div> намеренно: раньше мок их отбрасывал, и любая
 * иконка в jsdom оказывалась мёртвой — без className её нельзя было найти
 * селектором, а без onClick по ней нельзя было кликнуть. Из-за этого
 * компоненты, у которых иконка и есть интерактивный элемент (StarRating),
 * были непроверяемы юнит-тестами и держались только на e2e.
 */
module.exports = {
    process() {
        return {
            code: `
                const React = require('react');
                const SvgStub = (props) => React.createElement('div', props);
                module.exports = {
                    __esModule: true,
                    default: SvgStub,
                    ReactComponent: SvgStub,
                };
            `,
        };
    },
};
