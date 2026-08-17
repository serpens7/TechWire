import { useSelector } from 'react-redux';
import { getUserAuthData, getUserRoles, UserRole } from '@/entities/User';
import { Navigate, useLocation } from 'react-router-dom';
import { getRouteForbidden, getRouteMain } from '@/shared/const/router';
import { ReactElement, useMemo } from 'react';

interface RequireAuthProps {
    children: ReactElement;
    roles?: UserRole[];
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
    const auth = useSelector(getUserAuthData);
    const userRoles = useSelector(getUserRoles);
    const location = useLocation();

    const hasRequiredRoles = useMemo(() => {
        if (!roles?.length) {
            return true;
        }

        return roles.some((role) => userRoles?.includes(role));
    }, [roles, userRoles]);

    if (!auth) {
        return (
            <Navigate to={getRouteMain()} state={{ from: location }} replace />
        );
    }

    if (!hasRequiredRoles) {
        return <Navigate to={getRouteForbidden()} replace />;
    }

    return children;
}
