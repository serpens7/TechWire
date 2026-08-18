import { StateSchema } from '@/app/providers/StoreProvider';

export const getIsLoginModalOpen = (state: StateSchema) => state.user.isLoginModalOpen;
