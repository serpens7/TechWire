import axios from 'axios';
import { TOKEN_LOCALSTORAGE_KEY, USER_LOCALSTORAGE_KEY } from '../const/localStorage';

export const $api = axios.create({
    baseURL: __API__,
});

$api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_LOCALSTORAGE_KEY);

    if (token) {
        config.headers.authorization = `Bearer ${token}`;
    }

    return config;
});

$api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Токен протух или подделан — держать локальную сессию дальше
        // бессмысленно, следующая же загрузка страницы должна быть анонимной.
        if (error?.response?.status === 401) {
            localStorage.removeItem(TOKEN_LOCALSTORAGE_KEY);
            localStorage.removeItem(USER_LOCALSTORAGE_KEY);
        }

        return Promise.reject(error);
    },
);
