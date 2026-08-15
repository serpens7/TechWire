import {
    DynamicModuleLoader,
    ReducersList,
} from '@/shared/lib/components/DynamicModuleLoader';
import { classNames } from '@/shared/lib/classNames/classNames';
import { ProfileCard } from '@/entities/Profile';
import { useEffect } from 'react';
import { useAppDispatch } from '@/shared/lib/hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Text, TextTheme } from '@/shared/ui/Text/Text';
import { Currency } from '@/entities/Currency';
import { Country } from '@/entities/Country';
import { VStack } from '@/shared/ui/Stack';
import { EditableProfileCardHeader } from '../EditableProfileCardHeader/EditableProfileCardHeader';
import { profileReducer, profileActions } from '../../model/slice/profileSlice';
import {
    getProfileForm,
    getProfileReadonly,
    getProfileValidateErrors,
} from '../../model/selectors/getProfile';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../api/profileApi';
import { ValidateProfileError } from '../../model/types/editableProfileCardSchema';

const reducers: ReducersList = {
    profile: profileReducer,
};

interface EditableProfileCardProps {
    className?: string;
    id?: string;
}

export const EditableProfileCard = ({ className, id }: EditableProfileCardProps) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const formData = useSelector(getProfileForm);
    const readonly = useSelector(getProfileReadonly);
    const validateErrors = useSelector(getProfileValidateErrors);

    const {
        data,
        isFetching,
        isError: isFetchError,
    } = useGetProfileQuery(id ?? '', { skip: !id });
    const [, { isLoading: isUpdating }] = useUpdateProfileMutation({
        fixedCacheKey: 'update-profile',
    });

    const validateErrorTranslates = {
        [ValidateProfileError.SERVER_ERROR]: t('error.server'),
        [ValidateProfileError.INCORRECT_COUNTRY]: t('error.incorrectCountry'),
        [ValidateProfileError.NO_DATA]: t('error.noData'),
        [ValidateProfileError.INCORRECT_USER_DATA]: t(
            'error.incorrectUserData'
        ),
        [ValidateProfileError.INCORRECT_AGE]: t('error.incorrectAge'),
    };

    useEffect(() => {
        if (data) dispatch(profileActions.initEditForm(data));
    }, [data, dispatch]);

    const onChangeFirstname = (value?: string) => {
        dispatch(profileActions.updateProfile({ first: value || '' }));
    };

    const onChangeLastname = (value?: string) => {
        dispatch(profileActions.updateProfile({ lastname: value || '' }));
    };

    const onChangeCity = (value?: string) => {
        dispatch(profileActions.updateProfile({ city: value || '' }));
    };

    const onChangeAge = (value?: string) => {
        const age = Number(value);

        if (Number.isNaN(age)) return;
        if (age < 1 || age > 100) return;

        dispatch(profileActions.updateProfile({ age }));
    };

    const onChangeStatus = (value?: string) => {
        dispatch(profileActions.updateProfile({ status: value || '' }));
    };

    const onChangeUsername = (value?: string) => {
        dispatch(profileActions.updateProfile({ username: value || '' }));
    };

    const onChangeAvatar = (value?: string) => {
        dispatch(profileActions.updateProfile({ avatar: value || '' }));
    };

    const onChangeCurrency = (currency: Currency) => {
        dispatch(profileActions.updateProfile({ currency }));
    };

    const onChangeCountry = (country: Country) => {
        dispatch(profileActions.updateProfile({ country }));
    };

    return (
        <DynamicModuleLoader reducers={reducers} removeAfterUnmount>
            <VStack gap='16' max className={classNames('', {}, [className ?? ''])}>
                <EditableProfileCardHeader id={id} />
                {Boolean(validateErrors?.length) && (
                    <div data-testid='EditableProfileCard.Error.Paragraph'>
                        {validateErrors?.map((err) => (
                            <Text
                                key={err}
                                theme={TextTheme.ERROR}
                                text={validateErrorTranslates[err]}
                            />
                        ))}
                    </div>
                )}
                <ProfileCard
                    data={formData}
                    isLoading={isFetching || isUpdating}
                    error={isFetchError ? 'error' : undefined}
                    readonly={readonly}
                    onChangeFirstname={onChangeFirstname}
                    onChangeLastname={onChangeLastname}
                    onChangeAge={onChangeAge}
                    onChangeCity={onChangeCity}
                    onChangeStatus={onChangeStatus}
                    onChangeUsername={onChangeUsername}
                    onChangeAvatar={onChangeAvatar}
                    onChangeCurrency={onChangeCurrency}
                    onChangeCountry={onChangeCountry}
                />
            </VStack>
        </DynamicModuleLoader>
    );
};
