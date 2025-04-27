import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/core.index';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent, MatChipEditedEvent } from '@angular/material/chips';
interface data {
  value: string;
}
export interface Fruit {
  name: string;
}
@Component({
    selector: 'app-localization-settings',
    templateUrl: './localization-settings.component.html',
    styleUrl: './localization-settings.component.scss',
    standalone: false
})
export class LocalizationSettingsComponent {
  tags = ['JPG','GIF','PNG'];
  public selectedValue1 = '';
  public selectedValue2 = '';
  public selectedValue3 = '';
  public selectedValue4 = '';
  public selectedValue5 = '';
  public selectedValue6 = '';
  public selectedValue7 = '';
  public selectedValue8 = '';
  public selectedValue9 = '';
  public selectedValue10 = '';
  public selectedValue11 = '';
  public selectedValue12 = '';

  selectedList1: data[] = [{ value: 'English' }, { value: 'Spanish' }];
  selectedList2: data[] = [{ value: 'UTC 5:30' }, { value: '(UTC+11:00) INR' }];
  selectedList3: data[] = [{ value: '22 Jul 2023' }, { value: 'Jul 22 2023' }];
  selectedList4: data[] = [{ value: '12 Hours' }, { value: '24 Hours' }];
  selectedList5: data[] = [{ value: '2023' }, { value: '2022' }];
  selectedList6: data[] = [
    { value: 'January' },
    { value: 'February' },
    { value: 'March' },
  ];
  selectedList7: data[] = [
    { value: 'United Stated of America' },
    { value: 'India' },
  ];
  selectedList8: data[] = [{ value: '$' }, { value: '€' }, { value: '¥' }];
  selectedList9: data[] = [{ value: '$100' }, { value: '$400' }];
  selectedList10: data[] = [{ value: '.' }, { value: '.' }];
  selectedList11: data[] = [{ value: ',' }, { value: ',' }];
  selectedList12: data[] = [
    { value: 'Allow All Countries' },
    { value: 'Deny All Countries' },
  ];
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }

  constructor(private sidebar: SidebarService) {}

  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  fruits: Fruit[] = [{ name: 'JPG' }, { name: 'GIF' }, { name: 'PNG' }];

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.fruits.push({ name: value });
    }
    event.chipInput?.clear();
  }

  remove(fruit: Fruit): void {
    const index = this.fruits.indexOf(fruit);

    if (index >= 0) {
      this.fruits.splice(index, 1);
    }
  }

  edit(fruit: Fruit, event: MatChipEditedEvent) {
    const value = event.value.trim();
    if (!value) {
      this.remove(fruit);
      return;
    }
    const index = this.fruits.indexOf(fruit);
    if (index >= 0) {
      this.fruits[index].name = value;
    }
  }
}
