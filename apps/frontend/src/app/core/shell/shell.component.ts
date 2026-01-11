import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../auth/auth.service';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {DealsService} from '../../services/deals.service';
import {filter, interval, startWith, Subscription} from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit, OnDestroy {
  dealsBadge= 0;

  private sub = new Subscription();

  constructor(protected auth: AuthService, private router: Router, private dealsService: DealsService) {
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.sub.unsubscribe();
    this.dealsBadge = 0;
  }

  async ngOnInit() {
    await this.refreshDealsBadge();

    this.sub.add(
      this.router.events.pipe(
        filter(e=>e instanceof NavigationEnd)
      ).subscribe(() => this.refreshDealsBadge())
    );

    this.sub.add(
      interval(10000)
        .pipe(startWith(0))
        .subscribe(() => this.refreshDealsBadge())
    )
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private async refreshDealsBadge() {
    if (!this.auth.hasToken()) {
      this.dealsBadge = 0;
      return;
    }
    try{
      const res = await this.dealsService.actionRequiredCount();
      this.dealsBadge = res.total;
    } catch {
      this.dealsBadge = 0;
    }
  }

}
