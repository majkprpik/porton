import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Language } from '../service/data.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  $selectedLanguage = new BehaviorSubject<Language>({ code: 'en', name: 'English' });
  
  languages = [
    { code: 'en', name: 'English' },
    { code: 'hr', name: 'Hrvatski' }
  ];

  constructor(private translateService: TranslateService) { 
    const savedLanguage = this.getSelectedLanguageFromLocalStorage()

     if (savedLanguage) {
      this.setLanguage(JSON.parse(savedLanguage));
    } else {
      this.setLanguage(this.languages.find(language => language.code == 'hr'));
    }
  }

  getSelectedLanguageFromLocalStorage(): string | null {
    return localStorage.getItem('portonSelectedLanguage');
  }

  private setSelectedLanguageToLocalStorage(selectedLanguage: string){
    if(selectedLanguage){
      localStorage.setItem('portonSelectedLanguage', selectedLanguage);
    }
  }

  setLanguage(selectedLanguage: Language | undefined, reload: boolean = false) {
    if(selectedLanguage){
      this.$selectedLanguage.next(selectedLanguage);
      this.translateService.use(selectedLanguage.code);
      this.setSelectedLanguageToLocalStorage(JSON.stringify(selectedLanguage));

      if(reload){
        window.location.reload();
      }
    }
  }
}
