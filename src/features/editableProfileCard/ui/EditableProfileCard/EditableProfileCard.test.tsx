import { screen } from '@testing-library/react';
import { Profile } from '@/entities/Profile';
import { Currency } from '@/entities/Currency';
import { Country } from '@/entities/Country';
import userEvent from '@testing-library/user-event';
import { AxiosRequestConfig } from 'axios';
import { $api } from '@/shared/api/api';
import { profileReducer } from '../../model/slice/profileSlice';
import { EditableProfileCard } from './EditableProfileCard';
import { componentRender } from '@/shared/lib/tests/componentRender';

const profile: Profile = {
    id: '1',
    first: 'admin',
    lastname: 'admin',
    age: 465,
    currency: Currency.USD,
    country: Country.Kazakhstan,
    city: 'Moscow',
    username: 'admin213',
};

const options = {
    initialState: {
        profile: {
            readonly: true,
            data: profile,
            form: profile,
        },
        user: {
            authData: { id: '1', username: 'admin' },
        },
    },
    asyncReducers: {
        profile: profileReducer,
    },
};

describe('features/EditableProfileCard', () => {
    beforeEach(() => {
        // RTK Query's axiosBaseQuery calls $api.request(); stub it so the
        // initial getProfile query resolves instead of hitting the network.
        jest.spyOn($api, 'request').mockImplementation(
            async (config: AxiosRequestConfig) => ({
                data: config.method === 'PUT' && config.data ? config.data : profile,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config as never,
            })
        );
    });

    test('Readonly should switch', async () => {
        componentRender(<EditableProfileCard id='1' />, options);
        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.EditButton')
        );
        expect(
            screen.getByTestId('EditableProfileCardHeader.CancelButton')
        ).toBeInTheDocument();
    });

    test('Values should be reset when canceled', async () => {
        componentRender(<EditableProfileCard id='1' />, options);
        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.EditButton')
        );

        await userEvent.clear(screen.getByTestId('ProfileCard.firstname'));
        await userEvent.clear(screen.getByTestId('ProfileCard.lastname'));

        await userEvent.type(
            screen.getByTestId('ProfileCard.firstname'),
            'user'
        );
        await userEvent.type(
            screen.getByTestId('ProfileCard.lastname'),
            'user'
        );

        expect(screen.getByTestId('ProfileCard.firstname')).toHaveValue('user');
        expect(screen.getByTestId('ProfileCard.lastname')).toHaveValue('user');

        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.CancelButton')
        );

        expect(screen.getByTestId('ProfileCard.firstname')).toHaveValue(
            'admin'
        );
        expect(screen.getByTestId('ProfileCard.lastname')).toHaveValue('admin');
    });

    test('Error should appear', async () => {
        componentRender(<EditableProfileCard id='1' />, options);
        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.EditButton')
        );

        await userEvent.clear(screen.getByTestId('ProfileCard.firstname'));

        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.SaveButton')
        );

        expect(
            screen.getByTestId('EditableProfileCard.Error.Paragraph')
        ).toBeInTheDocument();
    });

    test('If there are no validation errors, a PUT request should be sent to the server', async () => {
        componentRender(<EditableProfileCard id='1' />, options);
        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.EditButton')
        );

        await userEvent.type(
            screen.getByTestId('ProfileCard.firstname'),
            'user'
        );

        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.SaveButton')
        );

        const putCall = ($api.request as jest.Mock).mock.calls.find(
            ([config]: [AxiosRequestConfig]) => config.method === 'PUT'
        );
        expect(putCall).toBeDefined();
    });

    test('Status field edits and is sent in the PUT request', async () => {
        componentRender(<EditableProfileCard id='1' />, options);
        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.EditButton')
        );

        await userEvent.type(
            screen.getByTestId('ProfileCard.status'),
            'Coffee and code'
        );

        expect(screen.getByTestId('ProfileCard.status')).toHaveValue(
            'Coffee and code'
        );

        await userEvent.click(
            screen.getByTestId('EditableProfileCardHeader.SaveButton')
        );

        const putCall = ($api.request as jest.Mock).mock.calls.find(
            ([config]: [AxiosRequestConfig]) => config.method === 'PUT'
        );
        expect(putCall?.[0].data).toMatchObject({ status: 'Coffee and code' });
    });
});
