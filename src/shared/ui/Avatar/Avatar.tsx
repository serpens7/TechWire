import { classNames, Mods } from '@/shared/lib/classNames/classNames';
import { CSSProperties, useMemo } from 'react';
import cls from './Avatar.module.scss';
import { AppImage } from '../AppImage';
import UserIcon from '@/shared/assets/icons/user-filled.svg';
import { Icon } from '../Icon/Icon';
import { Skeleton } from '../Skeleton/Skeleton';

interface AvatarProps {
    className?: string;
    src?: string;
    size?: number;
    alt?: string;
    fallbackInverted?: boolean;
}

export const Avatar = ({
    className = '',
    src,
    size,
    alt,
    fallbackInverted,
}: AvatarProps) => {
    const mods: Mods = {};

    const styles = useMemo<CSSProperties>(
        () => ({
            width: size || 100,
            height: size || 100,
        }),
        [size]
    );

    const fallback = <Skeleton width={size} height={size} border='50%' />;

    const errorFallback = (
        <Icon
            Svg={UserIcon}
            width={size}
            height={size}
            className={cls.fallbackIcon}
            inverted={fallbackInverted}
        />
    );

    return (
        <AppImage
            fallback={fallback}
            errorFallback={errorFallback}
            src={src}
            alt={alt}
            style={styles}
            className={classNames(cls.Avatar, mods, [className])}
        />
    );
};
