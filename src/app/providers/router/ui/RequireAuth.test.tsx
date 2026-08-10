import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ReactElement } from 'react';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { UserRole } from '@/entities/User';
import { RequireAuth } from './RequireAuth';

const renderProtectedRoutes = (
    protectedElement: ReactElement,
    route: string,
    initialState: Record<string, unknown>
) =>
    componentRender(
        <Routes>
            <Route path='/' element={<div>Main page</div>} />
            <Route path='/forbidden' element={<div>Forbidden page</div>} />
            <Route path='/protected' element={protectedElement} />
        </Routes>,
        { route, initialState: initialState as never }
    );

describe('RequireAuth', () => {
    test('redirects to main when there is no authenticated user', () => {
        renderProtectedRoutes(
            <RequireAuth>
                <div>Protected content</div>
            </RequireAuth>,
            '/protected',
            { user: { inited: true } }
        );

        expect(screen.getByText('Main page')).toBeInTheDocument();
        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    test('renders children when authenticated and no roles are required', () => {
        renderProtectedRoutes(
            <RequireAuth>
                <div>Protected content</div>
            </RequireAuth>,
            '/protected',
            {
                user: {
                    authData: { id: '1', username: 'user' },
                    inited: true,
                },
            }
        );

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    test('renders children when the user has one of the required roles', () => {
        renderProtectedRoutes(
            <RequireAuth roles={[UserRole.ADMIN]}>
                <div>Protected content</div>
            </RequireAuth>,
            '/protected',
            {
                user: {
                    authData: { id: '1', username: 'admin', roles: [UserRole.ADMIN] },
                    inited: true,
                },
            }
        );

        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    test('redirects to /forbidden when authenticated but missing the required role', () => {
        renderProtectedRoutes(
            <RequireAuth roles={[UserRole.ADMIN]}>
                <div>Protected content</div>
            </RequireAuth>,
            '/protected',
            {
                user: {
                    authData: { id: '2', username: 'user', roles: [UserRole.USER] },
                    inited: true,
                },
            }
        );

        expect(screen.getByText('Forbidden page')).toBeInTheDocument();
        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    test('unauthenticated takes priority over role requirements (redirects to main)', () => {
        renderProtectedRoutes(
            <RequireAuth roles={[UserRole.ADMIN]}>
                <div>Protected content</div>
            </RequireAuth>,
            '/protected',
            { user: { inited: true } }
        );

        expect(screen.getByText('Main page')).toBeInTheDocument();
    });
});
