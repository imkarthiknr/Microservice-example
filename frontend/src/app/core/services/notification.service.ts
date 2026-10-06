import { Injectable, signal } from '@angular/core';

/** A single, auto-dismissing status message shown by the app shell. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _message = signal<string | null>(null);
  readonly message = this._message.asReadonly();
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string, durationMs = 4000): void {
    clearTimeout(this.timer);
    this._message.set(message);
    this.timer = setTimeout(() => this._message.set(null), durationMs);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this._message.set(null);
  }
}
