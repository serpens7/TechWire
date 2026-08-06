import { StoryFn, Meta } from '@storybook/react';

import { ArticleViewSelector } from './ArticleViewSelector';

export default {
    title: 'shared/ArticleViewSelector',
    component: ArticleViewSelector,
    argTypes: {
        backgroundColor: { control: 'color' },
    },
} as Meta<typeof ArticleViewSelector>;

const Template: StoryFn<typeof ArticleViewSelector> = (args) => (
    <ArticleViewSelector {...args} />
);

export const Normal = Template.bind({});
Normal.args = {};
