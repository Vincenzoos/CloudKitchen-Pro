import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-header',
    imports: [RouterLink],
    templateUrl: './header.html',
    styleUrl: './header.css'
})
export class HeaderComponent {
    @Input() user: any = null;
    @Input() userId: string = '';
    @Output() logoutEvent = new EventEmitter<void>();
}