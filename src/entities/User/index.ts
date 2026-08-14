export {
    userReducer,
    userActions,
} from './model/slice/userSlice';

export type {
    UserSchema,
    User,
} from './model/types/user';

export { UserRole } from './model/consts/userConsts';

export { getUserAuthData } from './model/selectors/getUserAuthData';

export { getUserInited } from './model/selectors/getUserInited';

export { getIsLoginModalOpen } from './model/selectors/getIsLoginModalOpen';

export { getUserRoles } from './model/selectors/getUserRoles';

export { isUserAdmin } from './model/selectors/isUserAdmin';

export { isUserManager } from './model/selectors/isUserManager';
