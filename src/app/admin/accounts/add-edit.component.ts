import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';

@Component({
  templateUrl: 'add-edit.component.html',
  standalone: false
})
export class AddEditComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  id?: string;
  title!: string;
  loading = false;
  submitting = false;
  submitted = false;

  private loadTimeoutId?: number;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];

    this.form = this.formBuilder.group(
      {
        title: ['', Validators.required],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        role: ['', Validators.required],

        password: [
          '',
          !this.id
            ? [Validators.required, Validators.minLength(6)]
            : [Validators.minLength(6)]
        ],

        confirmPassword: ['']
      },
      {
        validator: MustMatch('password', 'confirmPassword')
      }
    );

    this.title = this.id ? 'Edit Account' : 'Create Account';

    if (this.id) {
      this.loading = true;
      this.cdr.detectChanges();

      this.loadTimeoutId = window.setTimeout(() => {
        if (this.loading) {
          this.loading = false;
          this.alertService.error('Request timed out');
          this.cdr.detectChanges();
        }
      }, 10000);

      this.accountService.getById(this.id)
        .pipe(
          first(),
          finalize(() => {
            this.loading = false;

            if (this.loadTimeoutId) {
              window.clearTimeout(this.loadTimeoutId);
              this.loadTimeoutId = undefined;
            }

            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: x => {
            this.form.patchValue(x);
            this.cdr.detectChanges();
          },
          error: err => {
            this.alertService.error(err);
            this.cdr.detectChanges();
          }
        });
    }
  }

  ngOnDestroy() {
    if (this.loadTimeoutId) {
      window.clearTimeout(this.loadTimeoutId);
    }
  }

  // convenience getter
  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();

    if (this.form.invalid) return;

    this.submitting = true;
    this.cdr.detectChanges();

    let saveAccount: any;
    let message: string;

    if (this.id) {
      saveAccount = () => this.accountService.update(this.id!, this.form.value);
      message = 'Account updated';
    } else {
      saveAccount = () => this.accountService.create(this.form.value);
      message = 'Account created';
    }

    saveAccount()
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success(message, { keepAfterRouteChange: true });
          this.router.navigateByUrl('/admin/accounts');
        },
        error: (err: any)  => {
          this.alertService.error(err);
          this.submitting = false;
          this.cdr.detectChanges();
        }
      });
  }
}