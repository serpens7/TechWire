import { StoryFn, Meta } from '@storybook/react';
import { AuthorCard } from './AuthorCard';

export default {
    title: 'entities/User/AuthorCard',
    component: AuthorCard,
} as Meta<typeof AuthorCard>;

const Template: StoryFn<typeof AuthorCard> = (args) => <AuthorCard {...args} />;

export const Normal = Template.bind({});
Normal.args = {
    author: {
        id: '1',
        username: 'admin',
        first: 'Иван',
        lastname: 'Иванов',
        avatar: 'https://loremflickr.com/320/240/face',
        status: 'Пью кофе и пишу код',
        age: 28,
        city: 'Москва',
        articlesCount: 12,
    },
};

export const NoName = Template.bind({});
NoName.args = {
    author: {
        id: '1',
        username: 'admin',
        articlesCount: 1,
    },
};

export const Loading = Template.bind({});
Loading.args = {
    isLoading: true,
};
