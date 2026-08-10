import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

// Generic, store-agnostic dispatch type so that lower layers (shared/entities/
// features) can be typed without depending on the concrete store in `app`.
export type AppDispatch = ThunkDispatch<any, any, UnknownAction>;
