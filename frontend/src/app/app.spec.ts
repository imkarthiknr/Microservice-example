import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { NotificationService } from './core/services/notification.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Customer Console');
  });

  it('shows and dismisses notifications', async () => {
    const fixture = TestBed.createComponent(App);
    TestBed.inject(NotificationService).show('Saved Ada.');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.toast')?.textContent).toContain('Saved Ada.');
    el.querySelector<HTMLButtonElement>('.toast button')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.toast')).toBeNull();
  });
});
