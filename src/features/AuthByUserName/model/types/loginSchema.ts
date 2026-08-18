import { AuthErrorCode } from './authError';

export interface LoginSchema {
    username: string;
    password: string;
    isLoading: boolean;
    error?: AuthErrorCode;
}
