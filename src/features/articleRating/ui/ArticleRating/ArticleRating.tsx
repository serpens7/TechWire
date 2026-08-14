import { useTranslation } from 'react-i18next';
import { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RatingCard } from '@/entities/Rating';
import {
    useGetArticleRating,
    useRateArticle,
} from '../../api/articleRatingApi';
import { getUserAuthData, userActions } from '@/entities/User';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { AuthRequiredNotice } from '@/shared/ui/AuthRequiredNotice/AuthRequiredNotice';

export interface ArticleRatingProps {
    className?: string;
    articleId: string;
}

const ArticleRating = memo((props: ArticleRatingProps) => {
    const { className, articleId } = props;
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const userData = useSelector(getUserAuthData);

    // Оценка привязана к пользователю, поэтому гостю запрашивать нечего:
    // без skip запрос ушёл бы с пустым userId и вернул 401.
    const { data, isLoading } = useGetArticleRating(
        { articleId, userId: userData?.id ?? '' },
        { skip: !userData },
    );
    const [rateArticleMutation] = useRateArticle();

    const handleRateArticle = useCallback(
        async (starsCount: number, feedback?: string) => {
            try {
                await rateArticleMutation({
                    userId: userData?.id ?? '',
                    articleId,
                    rate: starsCount,
                    feedback,
                }).unwrap();
            } catch (e) {
                console.log(e);
            }
        },
        [articleId, rateArticleMutation, userData?.id]
    );

    const onLogin = useCallback(() => {
        dispatch(userActions.openLoginModal());
    }, [dispatch]);

    if (!userData) {
        return (
            <AuthRequiredNotice
                text={t('auth.toRate')}
                onLogin={onLogin}
                className={className}
            />
        );
    }

    if (isLoading) {
        return <Skeleton width='100%' height={120} />;
    }

    const rating = data?.[0];

    return (
        <RatingCard
            onCancel={handleRateArticle}
            onAccept={handleRateArticle}
            rate={rating?.rate}
            className={className}
            title={t('article.valueTheArticle')}
            feedbackTitle={t('article.leaveYourFeedbackAboutTheArticle')}
            hasFeedback
        />
    );
});

export default ArticleRating;
