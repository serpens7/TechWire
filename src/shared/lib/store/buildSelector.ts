import { useSelector } from 'react-redux';

// Store-agnostic: the state type is inferred from the selector the caller
// passes in (annotate it there, e.g. `(state: StateSchema) => ...`), instead
// of this generic shared helper hardcoding the app's concrete StateSchema.
type Selector<TState, TSelected> = (state: TState) => TSelected;
type Result<TState, TSelected> = [() => TSelected, Selector<TState, TSelected>];

export function buildSelector<TState, TSelected>(
    selector: Selector<TState, TSelected>
): Result<TState, TSelected> {
    const useSelectorHook = () => useSelector(selector);

    return [useSelectorHook, selector];
}
