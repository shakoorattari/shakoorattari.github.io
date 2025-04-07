import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from '../../services/contact.service';

// Declare AOS (Animate On Scroll) library
declare const AOS: any;

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  @ViewChild('formElement') formElement!: ElementRef;

  contactForm: FormGroup;
  submitted = false;
  isSubmitting = false;

  // Toast notification
  toastVisible = false;
  toastType = '';
  toastMessage = '';
  toastTimeout: any;

  // Form interaction
  focusedField: string | null = null;
  messageChars = 0;
  animatedIcon: string | null = null;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(4)]],
      message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Initialize AOS animation library if available
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
      });
    }
  }

  // Form field focus handling
  onFocus(field: string): void {
    this.focusedField = field;
  }

  onBlur(field: string): void {
    this.focusedField = null;

    // Trigger validation only if user has interacted with the field
    if (this.contactForm.get(field)?.touched) {
      this.contactForm.get(field)?.markAsTouched();
      this.contactForm.get(field)?.updateValueAndValidity();
    }
  }

  // Character counter for message
  updateCharCount(): void {
    const messageControl = this.contactForm.get('message');
    this.messageChars = messageControl?.value?.length || 0;
  }

  // Animate icons on hover
  animateIcon(icon: string): void {
    this.animatedIcon = icon;
    setTimeout(() => {
      if (this.animatedIcon === icon) {
        this.animatedIcon = null;
      }
    }, 2000);
  }

  // Copy content to clipboard
  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        this.showToast('success', `${type} copied to clipboard!`);
      },
      () => {
        this.showToast('error', 'Failed to copy. Please try manually.');
      }
    );
  }

  // Form validation helpers
  isFieldInvalid(field: string): boolean {
    const control = this.contactForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  isFieldInvalidWithError(field: string, error: string): boolean {
    const control = this.contactForm.get(field);
    return !!(control && control.errors?.[error] && (control.dirty || control.touched || this.submitted));
  }

  // Toast notification system
  showToast(type: string, message: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastType = type;
    this.toastMessage = message;
    this.toastVisible = true;

    this.toastTimeout = setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  hideToast(): void {
    this.toastVisible = false;
  }

  // Form actions
  resetForm(): void {
    this.contactForm.reset();
    this.submitted = false;
    this.messageChars = 0;

    // Animate form reset
    if (this.formElement?.nativeElement) {
      this.formElement.nativeElement.classList.add('form-reset');
      setTimeout(() => {
        this.formElement.nativeElement.classList.remove('form-reset');
      }, 500);
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.contactForm.invalid) {
      // Scroll to the first invalid element
      const firstInvalidElement = document.querySelector('.form-group .invalid');
      if (firstInvalidElement) {
        firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.isSubmitting = true;

    this.contactService.sendMessage(this.contactForm.value)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showToast('success', 'Your message has been sent successfully! I\'ll get back to you soon.');
          this.resetForm();
        },
        error: (error) => {
          this.isSubmitting = false;

          // Provide more specific error message if available
          let errorMessage = 'Sorry, there was an error sending your message.';
          if (error.status === 429) {
            errorMessage = 'You\'ve sent too many messages. Please try again later.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          this.showToast('error', errorMessage);
        }
      });
  }
}
