import { useTranslation } from 'react-i18next';
import cls from './Navbar.module.scss';
import { classNames } from '@/shared/lib/classNames/classNames';
import { memo, useCallback } from 'react';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { LoginModal } from '@/features/AuthByUserName';
import {
    getIsLoginModalOpen,
    getUserAuthData,
    isUserAdmin,
    userActions,
} from '@/entities/User';
import { useDispatch, useSelector } from 'react-redux';
import { Text, TextTheme } from '@/shared/ui/Text/Text';
import { getRouteArticleCreate, getRouteMain, getRouteProfile } from '@/shared/const/router';
import { AppLink, AppLinkTheme } from '@/shared/ui/AppLink/AppLink';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { Dropdown } from '@/shared/ui/Dropdown';
import { HStack } from '@/shared/ui/Stack';
import { NotificationButton } from '@/features/NotificationButton';

interface NavbarProps {
    className?: string;
}

export const Navbar = memo(({ className = '' }: NavbarProps) => {
    const { t } = useTranslation();
    const authData = useSelector(getUserAuthData);
    const isAdmin = useSelector(isUserAdmin);
    // Состояние модалки живёт в сторе, а не здесь: открыть её просят и другие
    // места приложения — например главная, когда незалогиненный посетитель
    // пытается открыть статью.
    const isAuthModal = useSelector(getIsLoginModalOpen);
    const dispatch = useDispatch();

    const onCloseModal = useCallback(() => {
        dispatch(userActions.closeLoginModal());
    }, [dispatch]);

    const onShowModal = useCallback(() => {
        dispatch(userActions.openLoginModal());
    }, [dispatch]);

    const onLogout = useCallback(() => {
        dispatch(userActions.logout());
    }, [dispatch]);

    return (
        <header className={classNames(cls.Navbar, {}, [className])}>
            <AppLink to={getRouteMain()} className={cls.appName}>
                <Text title={t('IT-NEWS')} theme={TextTheme.INVERTED} />
            </AppLink>

            {authData ? (
                <>
                    {isAdmin && (
                        <AppLink
                            to={getRouteArticleCreate()}
                            theme={AppLinkTheme.SECONDARY}
                            className={cls.createBtn}
                        >
                            {t('article.createArticle')}
                        </AppLink>
                    )}
                    <div className={cls.rightSide}>
                        <NotificationButton />
                        <Dropdown
                            direction='bottom'
                            trigger={
                                <HStack gap='8'>
                                    <Avatar size={30} src={authData.avatar} />
                                    <Text
                                        text={authData.username}
                                        theme={TextTheme.INVERTED}
                                    />
                                </HStack>
                            }
                            items={[
                                {
                                    content: t('Профиль'),
                                    href: getRouteProfile(authData.id),
                                },
                                {
                                    content: t('navbar.exit'),
                                    onClick: onLogout,
                                },
                            ]}
                        />
                    </div>
                </>
            ) : (
                <div className={cls.rightSide}>
                    <Button
                        theme={ButtonTheme.CLEAR_INVERTED}
                        onClick={onShowModal}
                    >
                        {t('navbar.login')}
                    </Button>
                    {isAuthModal && (
                        <LoginModal
                            isOpen={isAuthModal}
                            onClose={onCloseModal}
                        />
                    )}
                </div>
            )}
        </header>
    );
});
