import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    DynamicModuleLoader,
    ReducersList,
} from '@/shared/lib/components/DynamicModuleLoader';
import { classNames } from '@/shared/lib/classNames/classNames';
import { useAppDispatch } from '@/shared/lib/hooks/useAppDispatch';
import { getUserAuthData } from '@/entities/User';
import { ArticleType, ArticleTypeTabs } from '@/entities/Article';
import { Input } from '@/shared/ui/Input/Input';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { Text, TextTheme } from '@/shared/ui/Text/Text';
import { VStack } from '@/shared/ui/Stack';
import { getRouteArticleDetails } from '@/shared/const/router';
import {
    articleFormActions,
    articleFormReducer,
} from '../../model/slice/articleFormSlice';
import {
    getArticleForm,
    getArticleFormValidateErrors,
} from '../../model/selectors/getArticleForm';
import { validateArticleData } from '../../model/services/validateArticleData';
import { ValidateArticleError } from '../../model/types/editableArticleCardSchema';
import {
    useCreateArticleMutation,
    useGetArticleQuery,
    useUpdateArticleMutation,
} from '../../api/articleApi';

const reducers: ReducersList = {
    articleForm: articleFormReducer,
};

interface EditableArticleCardProps {
    className?: string;
    id?: string;
}

export const EditableArticleCard = ({ className, id }: EditableArticleCardProps) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const authData = useSelector(getUserAuthData);

    const isEdit = Boolean(id);
    const { data, isFetching } = useGetArticleQuery(id ?? '', { skip: !isEdit });
    const [createArticle, { isLoading: isCreating }] = useCreateArticleMutation();
    const [updateArticle, { isLoading: isUpdating }] = useUpdateArticleMutation();

    const form = useSelector(getArticleForm);
    const validateErrors = useSelector(getArticleFormValidateErrors);

    const validateErrorTranslates = {
        [ValidateArticleError.NO_DATA]: t('error.noData'),
        [ValidateArticleError.NO_TITLE]: t('article.errors.noTitle'),
        [ValidateArticleError.NO_SUBTITLE]: t('article.errors.noSubtitle'),
        [ValidateArticleError.NO_IMAGE]: t('article.errors.noImage'),
        [ValidateArticleError.NO_TYPE]: t('article.errors.noType'),
        [ValidateArticleError.SERVER_ERROR]: t('error.server'),
    };

    useEffect(() => {
        if (isEdit) {
            if (data) dispatch(articleFormActions.initForm(data));
        } else {
            dispatch(articleFormActions.initForm({ type: [] }));
        }
        // Only re-run when switching between create/edit or when the fetched
        // article for edit mode arrives — not on every form keystroke.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, data, dispatch]);

    const onChangeTitle = (value?: string) => {
        dispatch(articleFormActions.updateForm({ title: value ?? '' }));
    };

    const onChangeSubtitle = (value?: string) => {
        dispatch(articleFormActions.updateForm({ subtitle: value ?? '' }));
    };

    const onChangeImg = (value?: string) => {
        dispatch(articleFormActions.updateForm({ img: value ?? '' }));
    };

    const onChangeType = (type: ArticleType) => {
        dispatch(articleFormActions.updateForm({ type: [type] }));
    };

    const onSave = async () => {
        const errors = validateArticleData(form);

        if (errors.length) {
            dispatch(articleFormActions.setValidateErrors(errors));
            return;
        }

        try {
            let result;
            if (isEdit && id) {
                result = await updateArticle({ ...form, id }).unwrap();
            } else {
                result = await createArticle({
                    ...form,
                    userId: authData?.id,
                    views: 0,
                    createdAt: new Date().toLocaleDateString('ru-RU'),
                    blocks: form?.blocks ?? [],
                }).unwrap();
            }
            dispatch(articleFormActions.setValidateErrors(undefined));
            navigate(getRouteArticleDetails(String(result.id)));
        } catch (e) {
            dispatch(
                articleFormActions.setValidateErrors([
                    ValidateArticleError.SERVER_ERROR,
                ])
            );
        }
    };

    return (
        <DynamicModuleLoader reducers={reducers} removeAfterUnmount>
            <VStack
                gap='16'
                max
                className={classNames('', {}, [className ?? ''])}
            >
                {Boolean(validateErrors?.length) && (
                    <div data-testid='EditableArticleCard.Error.Paragraph'>
                        {validateErrors?.map((err) => (
                            <Text
                                key={err}
                                theme={TextTheme.ERROR}
                                text={validateErrorTranslates[err]}
                            />
                        ))}
                    </div>
                )}
                <Input
                    value={form?.title}
                    placeholder={t('article.titleLabel')}
                    onChange={onChangeTitle}
                    data-testid='EditableArticleCard.Title'
                />
                <Input
                    value={form?.subtitle}
                    placeholder={t('article.subtitleLabel')}
                    onChange={onChangeSubtitle}
                    data-testid='EditableArticleCard.Subtitle'
                />
                <Input
                    value={form?.img}
                    placeholder={t('article.imgLabel')}
                    onChange={onChangeImg}
                    data-testid='EditableArticleCard.Img'
                />
                <ArticleTypeTabs
                    value={(form?.type?.[0] ?? '') as ArticleType}
                    onChangeType={onChangeType}
                />
                <Button
                    theme={ButtonTheme.OUTLINE}
                    onClick={onSave}
                    disabled={isFetching || isCreating || isUpdating}
                    data-testid='EditableArticleCard.SaveButton'
                >
                    {t('button.save')}
                </Button>
            </VStack>
        </DynamicModuleLoader>
    );
};
