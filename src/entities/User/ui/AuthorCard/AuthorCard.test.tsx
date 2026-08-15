import { screen } from '@testing-library/react';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { AuthorCard } from './AuthorCard';
import { Author } from '../../model/types/author';

const baseAuthor: Author = {
    id: '1',
    username: 'admin',
    first: 'Иван',
    lastname: 'Иванов',
    articlesCount: 3,
};

describe('AuthorCard', () => {
    test('renders username and full name', () => {
        componentRender(<AuthorCard author={baseAuthor} />);

        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    test('renders without full name when first/lastname are absent', () => {
        componentRender(
            <AuthorCard author={{ id: '1', username: 'admin', articlesCount: 0 }} />,
        );

        expect(screen.getByText('admin')).toBeInTheDocument();
    });

    test('renders skeletons when isLoading', () => {
        const { container } = componentRender(<AuthorCard isLoading />);

        expect(container.querySelectorAll('.Skeleton').length).toBeGreaterThan(0);
    });

    test('renders nothing when there is no author and not loading', () => {
        const { container } = componentRender(<AuthorCard />);

        expect(container).toBeEmptyDOMElement();
    });
});
