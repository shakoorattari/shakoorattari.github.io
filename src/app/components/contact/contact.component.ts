import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { environment } from '../../../environments/environment';

declare const AOS: any;
declare const turnstile: {
  render: (el: HTMLElement, opts: Record<string, any>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
} | undefined;

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('formElement') formElement!: ElementRef;
  @ViewChild('turnstileContainer') turnstileContainer!: ElementRef<HTMLDivElement>;

  contactForm: FormGroup;
  submitted = false;
  isSubmitting = false;

  toastVisible = false;
  toastType = '';
  toastMessage = '';
  toastTimeout: any;

  focusedField: string | null = null;
  messageChars = 0;
  animatedIcon: string | null = null;

  private turnstileWidgetId: string | null = null;
  private turnstilePollHandle: any = null;
  turnstileToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private zone: NgZone,
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      subject: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(150)]],
      message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
      botcheck: [''],
    });
  }

  ngOnInit(): void {
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 800, easing: 'ease-in-out', once: true });
    }
    window.scrollTo(0, 0);
  }

  ngAfterViewInit(): void {
    this.mountTurnstile();
  }

  ngOnDestroy(): void {
    if (this.turnstilePollHandle) {
      clearInterval(this.turnstilePollHandle);
    }
    if (typeof turnstile !== 'undefined' && this.turnstileWidgetId) {
      try { turnstile.remove(this.turnstileWidgetId); } catch { /* noop */ }
    }
  }

  // Poll briefly for the Turnstile global (script loads async), then render
  // explicitly so the widget plays nicely with Angular's SPA lifecycle.
  private mountTurnstile(): void {
    this.turnstilePollHandle = setInterval(() => {
      if (typeof turnstile === 'undefined' || !this.turnstileContainer?.nativeElement) return;
      clearInterval(this.turnstilePollHandle);
      this.turnstilePollHandle = null;
      this.zone.runOutsideAngular(() => {
        this.turnstileWidgetId = turnstile!.render(this.turnstileContainer.nativeElement, {
          sitekey: environment.turnstileSiteKey,
          theme: 'dark',
          appearance: 'always',
          callback: (token: string) => this.zone.run(() => { this.turnstileToken = token; }),
          'expired-callback': () => this.zone.run(() => { this.turnstileToken = null; }),
          'error-callback': () => this.zone.run(() => { this.turnstileToken = null; }),
        });
      });
    }, 200);
  }

  private resetTurnstile(): void {
    this.turnstileToken = null;
    if (typeof turnstile !== 'undefined' && this.turnstileWidgetId) {
      try { turnstile.reset(this.turnstileWidgetId); } catch { /* noop */ }
    }
  }

  onFocus(field: string): void { this.focusedField = field; }
  onBlur(field: string): void {
    this.focusedField = null;
    if (this.contactForm.get(field)?.touched) {
      this.contactForm.get(field)?.markAsTouched();
      this.contactForm.get(field)?.updateValueAndValidity();
    }
  }

  updateCharCount(): void {
    this.messageChars = this.contactForm.get('message')?.value?.length || 0;
  }

  animateIcon(icon: string): void {
    this.animatedIcon = icon;
    setTimeout(() => { if (this.animatedIcon === icon) this.animatedIcon = null; }, 2000);
  }

  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text).then(
      () => this.showToast('success', `${type} copied to clipboard!`),
      () => this.showToast('error', 'Failed to copy. Please try manually.'),
    );
  }

  isFieldInvalid(field: string): boolean {
    const c = this.contactForm.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched || this.submitted));
  }

  isFieldInvalidWithError(field: string, error: string): boolean {
    const c = this.contactForm.get(field);
    return !!(c && c.errors?.[error] && (c.dirty || c.touched || this.submitted));
  }

  showToast(type: string, message: string): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastType = type;
    this.toastMessage = message;
    this.toastVisible = true;
    this.toastTimeout = setTimeout(() => this.hideToast(), 5000);
  }

  hideToast(): void { this.toastVisible = false; }

  resetForm(): void {
    this.contactForm.reset();
    this.submitted = false;
    this.messageChars = 0;
    this.resetTurnstile();
    if (this.formElement?.nativeElement) {
      this.formElement.nativeElement.classList.add('form-reset');
      setTimeout(() => this.formElement.nativeElement.classList.remove('form-reset'), 500);
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      const firstInvalid = document.querySelector('.form-group .invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!this.turnstileToken) {
      this.showToast('error', 'Please complete the bot verification before sending.');
      return;
    }

    this.isSubmitting = true;
    this.contactService
      .sendMessage({ ...this.contactForm.value, turnstileToken: this.turnstileToken })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.showToast('success', res?.message || 'Your message has been sent! I\'ll get back to you soon.');
          this.resetForm();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.resetTurnstile();
          let errorMessage = 'Sorry, there was an error sending your message. Please try again.';
          if (error?.status === 429) errorMessage = error?.error?.message || 'Too many requests. Please try again later.';
          else if (error?.status === 400) errorMessage = error?.error?.message || 'Invalid submission.';
          else if (error?.error?.message) errorMessage = error.error.message;
          else if (error?.status === 0) errorMessage = 'Network error. Please check your connection and try again.';
          this.showToast('error', errorMessage);
        },
      });
  }
}
