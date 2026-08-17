import { StateSchema } from "@/app/providers/StoreProvider";
import { ValidateProfileError } from "../types/editableProfileCardSchema";
import { getProfileData, getProfileForm, getProfileReadonly, getProfileValidateErrors } from "./getProfile";


describe('profile selectors', () => {
    test('getProfileData', () => {
        const data = { username: 'admin' };

        const state: DeepPartial<StateSchema> = {
            profile: { data, readonly: false },
        };

        expect(getProfileData(state as StateSchema)).toEqual(data);
    });

    test('getProfileReadonly', () => {
        const state: DeepPartial<StateSchema> = {
            profile: { readonly: true },
        };

        expect(getProfileReadonly(state as StateSchema)).toBe(true);
    });

    test('getProfileValidateErrors', () => {
        const errors = [ValidateProfileError.SERVER_ERROR, ValidateProfileError.INCORRECT_USER_DATA];

        const state: DeepPartial<StateSchema> = {
            profile: { validateErrors: errors, readonly: false },
        };

        expect(getProfileValidateErrors(state as StateSchema)).toEqual(errors);
    });

    test('getProfileForm', () => {
        const form = { username: 'admin' };

        const state: DeepPartial<StateSchema> = {
            profile: { form, readonly: false },
        };

        expect(getProfileForm(state as StateSchema)).toEqual(form);
    });
});
