import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, delay } from 'rxjs';

/**
 * Искусственная задержка ответа — имитация реальной сети.
 *
 * json-server держал 200 мс, и фронт к этому привык: без задержки лоадеры
 * и скелетоны не успевают показаться, а часть тестов начинает ловить
 * состояния, которых в жизни не бывает. Управляется RESPONSE_DELAY_MS,
 * в проде выставляется в 0.
 */
@Injectable()
export class ResponseDelayInterceptor implements NestInterceptor {
    private readonly delayMs: number;

    constructor(config: ConfigService) {
        this.delayMs = Number(config.get('RESPONSE_DELAY_MS') ?? 0);
    }

    intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (this.delayMs <= 0) {
            return next.handle();
        }

        return next.handle().pipe(delay(this.delayMs));
    }
}
