import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component';
import { ResetPassword2Component } from './reset-password/reset-password-2/reset-password-2.component';
import { ResetPassword3Component } from './reset-password/reset-password-3/reset-password-3.component';
import { ResetPasswordComponent } from './reset-password/reset-password/reset-password.component';
import { Register2Component } from './register/register-2/register-2.component';
import { Register3Component } from './register/register-3/register-3.component';
import { sharedModule } from '../shared/shared.module';
import { LockScreenComponent } from './lock-screen/lock-screen.component';
import { Success2Component } from './successs/success-2/success-2.component';
import { Success3Component } from './successs/success-3/success-3.component';
import { SuccessComponent } from './successs/success/success.component';
import { RegisterComponent } from './register/register/register.component';
import { EmailVerificationComponent } from './email-verification/email-verification/email-verification.component';
import { EmailVerification2Component } from './email-verification/email-verification-2/email-verification-2.component';
import { EmailVerification3Component } from './email-verification/email-verification-3/email-verification-3.component';
import { TwoStepVerificationComponent } from './two-step-verification/two-step-verification/two-step-verification.component';
import { TwoStepVerification2Component } from './two-step-verification/two-step-verification-2/two-step-verification-2.component';
import { TwoStepVerification3Component } from './two-step-verification/two-step-verification-3/two-step-verification-3.component';
import { SigninComponent } from './signin/signin/signin.component';
import { Signin2Component } from './signin/signin-2/signin-2.component';
import { Signin3Component } from './signin/signin-3/signin-3.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password/forgot-password.component';
import { ForgotPassword2Component } from './forgot-password/forgot-password-2/forgot-password-2.component';
import { ForgotPassword3Component } from './forgot-password/forgot-password-3/forgot-password-3.component';
import { InputOtpModule } from 'primeng/inputotp';


@NgModule({
  declarations: [
    AuthComponent,
    ResetPassword2Component,
    ResetPassword3Component,
    ResetPasswordComponent,
    Register2Component,
    Register3Component,
    LockScreenComponent,
    SuccessComponent,
    Success2Component,
    Success3Component,
    RegisterComponent,
    EmailVerificationComponent,
    EmailVerification2Component,
    EmailVerification3Component,
    TwoStepVerificationComponent,
    TwoStepVerification2Component,
    TwoStepVerification3Component,
    SigninComponent,
    Signin2Component,
    Signin3Component,
    ForgotPasswordComponent,
    ForgotPassword2Component,
    ForgotPassword3Component
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    sharedModule,
    InputOtpModule
  ]
})
export class AuthModule { }
