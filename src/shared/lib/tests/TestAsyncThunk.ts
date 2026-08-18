import { StateSchema } from '@/app/providers/StoreProvider';
import axios, { AxiosStatic } from 'axios';

// The returned thunk action is typed `any`: under RTK 2 the AsyncThunkAction's
// dispatch parameter is bound to the thunk's concrete state (StateSchema) and is
// contravariant, so no single generic form of this helper accepts every thunk. The
// helper only needs the (arg) => thunkAction call shape; the dispatch/getState it
// feeds in are jest mocks, so the precise action type carries no value here.
type ActionCreatorType<Arg> = (arg: Arg) => any;

jest.mock('axios');

const mockedAxios = jest.mocked(axios);

// Автомок отдаёт из axios.create() undefined, а модуль shared/api/api.ts на
// импорте делает `axios.create(...).interceptors.request.use(...)`. Пока
// цепочка импортов теста до него не доходила, это не всплывало; стоило
// добавить RTK Query-эндпоинт в публичный API entities/Article — и сьюты
// начали падать на ровном месте с «Cannot read properties of undefined».
//
// Заглушка возвращает объект нужной формы: перехватчики регистрируются
// вхолостую, а запросы всё равно идут через this.api из этого хелпера.
const createInterceptorStub = () => ({
    use: jest.fn(),
    eject: jest.fn(),
    clear: jest.fn(),
});

mockedAxios.create.mockReturnValue({
    interceptors: {
        request: createInterceptorStub(),
        response: createInterceptorStub(),
    },
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
} as never);

export class TestAsyncThunk<Arg> {
    dispatch: jest.MockedFn<any>;

    getState: () => StateSchema;

    actionCreator: ActionCreatorType<Arg>;

    api: jest.MockedFunctionDeep<AxiosStatic>;

    navigate: jest.MockedFn<any>;

    constructor(
        actionCreator: ActionCreatorType<Arg>,
        state?: DeepPartial<StateSchema>,
    ) {
        this.actionCreator = actionCreator;
        this.dispatch = jest.fn();
        this.getState = jest.fn(() => state as StateSchema);

        this.api = mockedAxios;
        this.navigate = jest.fn();
    }

    async callThunk(arg?: Arg) {
        const action = this.actionCreator(arg as Arg);
        const result = await action(
            this.dispatch,
            this.getState,
            { api: this.api, navigate: this.navigate },
        );

        return result;
    }
}