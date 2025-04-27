import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { EmailVerificationComponent } from './email-verification/email-verification/email-verification.component';
import { EmailVerification2Component } from './email-verification/email-verification-2/email-verification-2.component';
import { EmailVerification3Component } from './email-verification/email-verification-3/email-verification-3.component';
import { ResetPassword2Component } from './reset-password/reset-password-2/reset-password-2.component';
import { ResetPassword3Component } from './reset-password/reset-password-3/reset-password-3.component';
import { ResetPasswordComponent } from './reset-password/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password/forgot-password.component';
import { ForgotPassword2Component } from './forgot-password/forgot-password-2/forgot-password-2.component';
import { Register2Component } from './register/register-2/register-2.component';
import { Register3Component } from './register/register-3/register-3.component';
import { SigninComponent } from './signin/signin/signin.component';
import { Signin2Component } from './signin/signin-2/signin-2.component';
import { TwoStepVerification2Component } from './two-step-verification/two-step-verification-2/two-step-verification-2.component';
import { TwoStepVerificationComponent } from './two-step-verification/two-step-verification/two-step-verification.component';
import { TwoStepVerification3Component } from './two-step-verification/two-step-verification-3/two-step-verification-3.component';
import { LockScreenComponent } from './lock-screen/lock-screen.component';
import { ForgotPassword3Component } from './forgot-password/forgot-password-3/forgot-password-3.component';
import { SuccessComponent } from './successs/success/success.component';
import { Success2Component } from './successs/success-2/success-2.component';
import { Success3Component } from './successs/success-3/success-3.component';
import { RegisterComponent } from './register/register/register.component';
import { Signin3Component } from './signin/signin-3/signin-3.component';

const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },

  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: 'email-verification',
        component: EmailVerificationComponent,
      },
      {
        path: 'email-verification-2',
        component: EmailVerification2Component,
      },
      {
        path: 'email-verification-3',
        component: EmailVerification3Component,
      },
      {
        path: 'reset-password-2',
        component: ResetPassword2Component,
      },
      {
        path: 'reset-password-3',
        component: ResetPassword3Component,
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
      },
      {
        path: 'forgot-password-2',
        component: ForgotPassword2Component,
      },
      {
        path: 'forgot-password-3',
        component: ForgotPassword3Component,
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
      {
        path: 'register-2',
        component: Register2Component,
      },
      {
        path: 'register-3',
        component: Register3Component,
      },
      {
        path: 'signin',
        component: SigninComponent,
      },
      {
        path: 'signin-2',
        component: Signin2Component,
      },
      {
        path: 'signin-3',
        component: Signin3Component,
      },
      {
        path: 'two-step-verification',
        component: TwoStepVerificationComponent,
      },
      {
        path: 'two-step-verification-2',
        component: TwoStepVerification2Component,
      },
      {
        path: 'two-step-verification-3',
        component: TwoStepVerification3Component,
      },
      {
        path: 'lock-screen',
        component: LockScreenComponent,
      },
      {
        path: 'success',
        component: SuccessComponent,
      },
      {
        path: 'success-2',
        component: Success2Component,
      },
      {
        path: 'success-3',
        component: Success3Component,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
