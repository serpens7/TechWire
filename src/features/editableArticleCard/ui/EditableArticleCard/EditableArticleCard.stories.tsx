import { Meta, StoryFn } from '@storybook/react';
import { EditableArticleCard } from './EditableArticleCard';
import { StoreDecorator } from '@/shared/config/storybook/StoreDecorator/StoreDecorator';

export default {
    title: 'features/editableArticleCard/EditableArticleCard',
    component: EditableArticleCard,
    argTypes: {
        backgroundColor: { control: 'color' },
    },
    decorators: [
        StoreDecorator({
            user: { authData: { id: '1', username: 'admin' } },
        }),
    ],
} as Meta<typeof EditableArticleCard>;

const Template: StoryFn<typeof EditableArticleCard> = (args) => (
    <EditableArticleCard {...args} />
);

export const Create = Template.bind({});
Create.args = {};
