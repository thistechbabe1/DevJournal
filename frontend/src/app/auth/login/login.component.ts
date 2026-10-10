import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  passwordFieldType: string = 'password';
  emailFieldType: string = 'email';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    this.errorMessage = null;
    if (this.form.valid) {
      this.isLoading = true;

      this.authService.login(this.form.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
        }
      });
    } else {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields and ensure they are valid.';
    }
  }

  togglePasswordVisibility(field: 'password' | 'email'): void {
    if (field === 'password') {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    } else if (field === 'email') {
      this.emailFieldType = this.emailFieldType === 'email' ? 'text' : 'email';
    }
  }
}