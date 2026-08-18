import { Meta, StoryFn } from '@storybook/react';
import { StoreDecorator } from '@/shared/config/storybook/StoreDecorator/StoreDecorator';
import RegisterForm from './RegisterForm';

export default {
    title: 'features/RegisterForm',
    component: RegisterForm,
} as Meta<typeof RegisterForm>;

const Template: StoryFn<typeof RegisterForm> = () => <RegisterForm />;

export const Primary = Template.bind({});
Primary.args = {};
Primary.decorators = [StoreDecorator({})];
