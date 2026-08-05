import { classNames } from '@/shared/lib/classNames/classNames';
import React, { memo } from 'react';
import cls from './Icon.module.scss';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    Svg: React.FC<React.SVGProps<SVGSVGElement>>;
    inverted?: boolean;
}

export const Icon = memo((props: IconProps) => {
    const { className = '', Svg, inverted, ...otherProps } = props;

    return (
        <Svg
            className={classNames(cls.Icon, { [cls.inverted]: inverted }, [
                className,
            ])}
            {...otherProps}
        />
    );
});
