import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Language } from '../models/data.models';
import { TranslateService } from '@ngx-translate/core';
import { StorageService, STORAGE_KEYS } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private storageService = inject(StorageService);
  $selectedLanguage = new BehaviorSubject<Language>({ code: 'en', name: 'en' });

  languages = [
    { code: 'en', name: 'EN' },
    { code: 'hr', name: 'HR' }
  ];

  constructor(private translateService: TranslateService) {
    const savedLanguage = this.getSelectedLanguageFromStorage();

    if (savedLanguage) {
      this.setLanguage(savedLanguage);
    } else {
      this.setLanguage(this.languages.find(language => language.code == 'hr'));
    }
  }

  private getSelectedLanguageFromStorage(): Language | null {
    return this.storageService.get<Language>(STORAGE_KEYS.SELECTED_LANGUAGE);
  }

  getSelectedLanguageCode(): string | undefined {
    const savedLanguage = this.getSelectedLanguageFromStorage();
    return savedLanguage?.code;
  }

  private setSelectedLanguageToStorage(selectedLanguage: Language): void {
    this.storageService.set(STORAGE_KEYS.SELECTED_LANGUAGE, selectedLanguage);
  }

  setLanguage(selectedLanguage: Language | undefined, reload: boolean = false): void {
    if (selectedLanguage) {
      this.$selectedLanguage.next(selectedLanguage);
      this.translateService.use(selectedLanguage.code);
      this.setSelectedLanguageToStorage(selectedLanguage);

      if (reload) {
        window.location.reload();
      }
    }
  }
}
