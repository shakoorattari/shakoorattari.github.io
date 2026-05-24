import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  botcheck?: string;
  turnstileToken?: string;
}

export interface ContactSubmitResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly endpoint = 'https://api.web3forms.com/submit';
  private readonly rateLimitKey = 'contact_last_submit';
  private readonly rateLimitMs = 60_000;

  constructor(private http: HttpClient) {}

  sendMessage(formData: ContactFormData): Observable<ContactSubmitResult> {
    if (formData.botcheck) {
      return throwError(() => ({ status: 400, error: { message: 'Invalid submission.' } }));
    }

    const last = Number(localStorage.getItem(this.rateLimitKey) || 0);
    const now = Date.now();
    if (last && now - last < this.rateLimitMs) {
      const wait = Math.ceil((this.rateLimitMs - (now - last)) / 1000);
      return throwError(() => ({
        status: 429,
        error: { message: `Please wait ${wait}s before sending another message.` },
      }));
    }

    const payload = {
      access_key: environment.web3formsAccessKey,
      from_name: environment.contactFromName,
      subject: this.sanitize(formData.subject, 150),
      name: this.sanitize(formData.name, 100),
      email: this.sanitize(formData.email, 150),
      message: this.sanitize(formData.message, 5000),
      botcheck: '',
    };

    return this.http
      .post<{ success: boolean; message: string }>(this.endpoint, payload)
      .pipe(
        map((res) => {
          if (res?.success) {
            localStorage.setItem(this.rateLimitKey, String(Date.now()));
            return { success: true, message: res.message || 'Message sent successfully.' };
          }
          throw { status: 500, error: { message: res?.message || 'Submission failed.' } };
        }),
        catchError((err: HttpErrorResponse) => throwError(() => err)),
      );
  }

  private sanitize(value: string, max: number): string {
    return String(value ?? '').trim().slice(0, max);
  }
}
