import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  // In a real application, you would replace this with your API endpoint
  private apiUrl = '/api/contact';
  
  constructor(private http: HttpClient) { }
  
  sendMessage(formData: ContactFormData): Observable<any> {
    // For demo purposes, we'll simulate a successful API call
    // In a real application, you would uncomment the line below
    // return this.http.post(this.apiUrl, formData);
    
    // Simulating API response with a delay
    return of({ success: true }).pipe(delay(1000));
  }
}
