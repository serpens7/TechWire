import {
    bindActionCreators,
    createSlice,
    type CreateSliceOptions,
    type SliceCaseReducers,
} from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { useMemo } from 'react';

export function buildSlice<
    State,
    CaseReducers extends SliceCaseReducers<State>,
    Name extends string = string
    >(options: CreateSliceOptions<State, CaseReducers, Name>) {
    const slice = createSlice(options);

    const useActions = (): typeof slice.actions => {
        const dispatch = useDispatch();

        // RTK's CaseReducerActions type doesn't satisfy bindActionCreators'
        // ActionCreatorsMapObject constraint (its members widen to include void),
        // so the input is cast; the bound result is re-narrowed to slice.actions.
        return useMemo(
            () => bindActionCreators(
                slice.actions as unknown as Record<string, (...args: any[]) => unknown>,
                dispatch,
            ) as typeof slice.actions,
            [dispatch],
        );
    };

    return {
        ...slice,
        useActions,
    };
}
