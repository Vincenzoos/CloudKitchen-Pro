import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Language {
    code: string;
    name: string;
    flag: string;
}

@Component({
    selector: 'app-language-selector',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './language-selector.html'
})
export class LanguageSelector {
    @Output() languageSelected = new EventEmitter<string>();

    // Available languages for translation
    languages: Language[] = [
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'it', name: 'Italian', flag: '🇮🇹' }
    ];

    selectedLanguage: string = '';

    onLanguageChange(): void {
        if (this.selectedLanguage) {
            this.languageSelected.emit(this.selectedLanguage);
        }
    }

    resetSelection(): void {
        this.selectedLanguage = '';
        this.languageSelected.emit('');
    }
}