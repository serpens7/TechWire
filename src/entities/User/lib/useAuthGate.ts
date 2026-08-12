import { MouseEvent, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserAuthData } from '../model/selectors/getUserAuthData';
import { userActions } from '../model/slice/userSlice';

interface AuthGate {
    isAuthorized: boolean;
    /** Открыто ли предупреждение о необходимости входа. */
    isPromptOpen: boolean;
    /**
     * Вешается на onClick ссылки или кнопки. Авторизованного пропускает,
     * остальным отменяет переход и показывает предупреждение.
     */
    guard: (event: MouseEvent) => void;
    closePrompt: () => void;
    /** Закрывает предупреждение и открывает форму входа. */
    goToLogin: () => void;
}

/**
 * Гейт для действий, требующих входа.
 *
 * Живёт в entities/User, потому что нужен нескольким фичам сразу (блокам
 * главной), а импортировать друг друга фичам запрещено. В shared его положить
 * нельзя: он читает состояние авторизации, а shared про сущности знать не должен.
 */
export function useAuthGate(): AuthGate {
    const authData = useSelector(getUserAuthData);
    const dispatch = useDispatch();
    const [isPromptOpen, setIsPromptOpen] = useState(false);

    const guard = useCallback(
        (event: MouseEvent) => {
            if (authData) {
                return;
            }

            event.preventDefault();
            setIsPromptOpen(true);
        },
        [authData]
    );

    const closePrompt = useCallback(() => {
        setIsPromptOpen(false);
    }, []);

    const goToLogin = useCallback(() => {
        setIsPromptOpen(false);
        dispatch(userActions.openLoginModal());
    }, [dispatch]);

    return {
        isAuthorized: Boolean(authData),
        isPromptOpen,
        guard,
        closePrompt,
        goToLogin,
    };
}
