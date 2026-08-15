import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { $api } from '@/shared/api/api';
import RegisterForm from './RegisterForm';

describe('features/RegisterForm', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    // i18nForTests не подключает реальные переводы — t() возвращает сам ключ.
    async function fillForm(username: string, password: string, passwordRepeat: string) {
        await userEvent.type(screen.getByLabelText('register.username'), username);
        await userEvent.type(screen.getByLabelText('register.password'), password);
        await userEvent.type(screen.getByLabelText('register.passwordRepeat'), passwordRepeat);
    }

    test('успешная регистрация отправляет запрос и вызывает onSuccess', async () => {
        jest.spyOn($api, 'post').mockResolvedValue({
            data: { user: { id: '1', username: 'new_user' }, token: 'jwt.token.value' },
        });
        const onSuccess = jest.fn();

        componentRender(<RegisterForm onSuccess={onSuccess} />);
        await fillForm('new_user', 'password123', 'password123');
        await userEvent.click(screen.getByText('register.submit'));

        await waitFor(() => {
            expect($api.post).toHaveBeenCalledWith('/register', {
                username: 'new_user',
                password: 'password123',
            });
        });
        await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });

    test('несовпадающие пароли не отправляют запрос', async () => {
        jest.spyOn($api, 'post').mockResolvedValue({ data: {} });

        componentRender(<RegisterForm />);
        await fillForm('new_user', 'password123', 'other_password');
        await userEvent.click(screen.getByText('register.submit'));

        expect(screen.getByText('register.errors.passwordsMismatch')).toBeInTheDocument();
        expect($api.post).not.toHaveBeenCalled();
    });

    test('слишком короткий логин не отправляет запрос', async () => {
        jest.spyOn($api, 'post').mockResolvedValue({ data: {} });

        componentRender(<RegisterForm />);
        await fillForm('ab', 'password123', 'password123');
        await userEvent.click(screen.getByText('register.submit'));

        expect(screen.getByText('register.errors.usernameLength')).toBeInTheDocument();
        expect($api.post).not.toHaveBeenCalled();
    });
});
