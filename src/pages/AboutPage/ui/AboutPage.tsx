import { useTranslation } from 'react-i18next';
import { Page } from '@/widgets/Page';
import { Text, TextSize } from '@/shared/ui/Text/Text';
import { Card } from '@/shared/ui/Card/Card';
import { AppLink } from '@/shared/ui/AppLink/AppLink';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { VStack } from '@/shared/ui/Stack';
import { getRouteArticles } from '@/shared/const/router';
import cls from './AboutPage.module.scss';

const TOPIC_KEYS = ['it', 'economics', 'science'] as const;
const PRINCIPLE_KEYS = ['practice', 'depth', 'honest', 'lasting'] as const;
const AUDIENCE_KEYS = ['learning', 'working', 'curious'] as const;

const AboutPage = () => {
    const { t } = useTranslation();

    return (
        <Page>
            <VStack gap='32' max className={cls.AboutPage}>
                <header className={cls.hero}>
                    <Text className={cls.eyebrow} text={t('about.eyebrow')} />
                    <Text size={TextSize.L} title={t('about.title')} />
                    <Text className={cls.lead} text={t('about.lead')} />
                </header>

                <section className={cls.section}>
                    <Text size={TextSize.S} title={t('about.topicsTitle')} />
                    <div className={cls.topics}>
                        {TOPIC_KEYS.map((key) => (
                            <Card key={key} className={cls.topic}>
                                <Text
                                    className={cls.topicName}
                                    text={t(`about.topics.${key}.name`)}
                                />
                                <Text
                                    className={cls.topicText}
                                    text={t(`about.topics.${key}.text`)}
                                />
                            </Card>
                        ))}
                    </div>
                </section>

                <section className={cls.section}>
                    <Text
                        size={TextSize.S}
                        title={t('about.principlesTitle')}
                    />
                    <Text
                        className={cls.sectionLead}
                        text={t('about.principlesLead')}
                    />
                    <ol className={cls.principles}>
                        {PRINCIPLE_KEYS.map((key, index) => (
                            <li key={key} className={cls.principle}>
                                <span className={cls.principleNum}>
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div>
                                    <Text
                                        className={cls.principleName}
                                        text={t(`about.principles.${key}.name`)}
                                    />
                                    <Text
                                        className={cls.principleText}
                                        text={t(`about.principles.${key}.text`)}
                                    />
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className={cls.section}>
                    <Text size={TextSize.S} title={t('about.audienceTitle')} />
                    <div className={cls.topics}>
                        {AUDIENCE_KEYS.map((key) => (
                            <Card key={key} className={cls.topic}>
                                <Text
                                    className={cls.topicName}
                                    text={t(`about.audience.${key}.name`)}
                                />
                                <Text
                                    className={cls.topicText}
                                    text={t(`about.audience.${key}.text`)}
                                />
                            </Card>
                        ))}
                    </div>
                </section>

                <section className={cls.section}>
                    <Text size={TextSize.S} title={t('about.stackTitle')} />
                    <Text
                        className={cls.stackText}
                        text={t('about.stackText')}
                    />
                    <Text
                        className={cls.stackText}
                        text={t('about.stackText2')}
                    />
                </section>

                <Card className={cls.cta}>
                    <Text size={TextSize.S} title={t('about.ctaTitle')} />
                    <Text className={cls.ctaText} text={t('about.ctaText')} />
                    <AppLink to={getRouteArticles()}>
                        <Button theme={ButtonTheme.BACKGROUND}>
                            {t('about.ctaButton')}
                        </Button>
                    </AppLink>
                </Card>
            </VStack>
        </Page>
    );
};

export default AboutPage;
