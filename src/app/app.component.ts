import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from './_services';
import { Account, Role } from './_models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false
})
export class AppComponent implements OnInit {
  Role = Role;
  account: Account | null = null;

  constructor(private accountService: AccountService, private router: Router) {}

  ngOnInit() {
    this.accountService.account.subscribe(x => this.account = x);
  }

  logout() {
    this.accountService.logout();
  }
}