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
        { code: 'es', name: 'Spanish', flag: 'ES' },
        { code: 'fr', name: 'French', flag: 'FR' },
        { code: 'it', name: 'Italian', flag: 'IT' },
        { code: 'de', name: 'German', flag: 'DE' },
        { code: 'pt', name: 'Portuguese', flag: 'PT' },
        { code: 'ja', name: 'Japanese', flag: 'JP' },
        { code: 'zh', name: 'Chinese', flag: 'ZH' },
        { code: 'ko', name: 'Korean', flag: 'KO' }
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