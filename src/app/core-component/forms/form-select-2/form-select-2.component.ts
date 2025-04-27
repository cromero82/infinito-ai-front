import { Component } from '@angular/core';
import { Observable, map, startWith } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatTableDataSource } from '@angular/material/table';
import { routes } from 'src/app/core/helpers/routes';
interface data {
  value: string;
}

@Component({
    selector: 'app-form-select-2',
    templateUrl: './form-select-2.component.html',
    styleUrl: './form-select-2.component.scss',
    standalone: false
})
export class FormSelect2Component {
  public routes = routes;
  public selectedValue1 = '';
  public categories = '';
  public selectedValue2 = '';
  searchInputCategory = '';
  selectedCategory = '';
  selectedList1: data[] = [
    { value: 'Selection-1' },
    { value: 'Selection-2' },
    { value: 'Selection-3' },
    { value: 'Selection-4' },
    { value: 'Selection-5' },
  ];
  selectedList2: data[] = [
    { value: 'Texas' },
    { value: 'Georgia' },
    { value: 'California' },
    { value: 'Washington D.C' },
    { value: 'Virginia' },
  ];

  public selectedValue3 = '';
  public selectedValue4 = '';
  public selectedValue5 = '';
  public selectedValue6 = '';

  separatorKeysCodes: number[] = [ENTER, COMMA];
  fruitCtrl1 = new FormControl('');
  fruitCtrl2 = new FormControl('');

  filteredFruits1: Observable<string[]>;
  filteredFruits2: Observable<string[]>;

  fruits1: string[] = ['Appple'];
  allFruits1: string[] = ['Appple'];

  fruits2: string[] = [
    'Multiple-1',
    'Multiple-2',
    'Multiple-3',
    'Multiple-4',
    'Multiple-5',
  ];
  allFruits2: string[] = ['Apple', 'Mango', 'Orange', 'Guava', 'Pineapple'];

  @ViewChild('fruitInput1') fruitInput1!: ElementRef<HTMLInputElement>;
  @ViewChild('fruitInput2') fruitInput2!: ElementRef<HTMLInputElement>;

  constructor() {
    this.filteredFruits1 = this.fruitCtrl1.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) =>
        fruit ? this._filter1(fruit) : this.allFruits1.slice()
      )
    );
    this.filteredFruits2 = this.fruitCtrl2.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) =>
        fruit ? this._filter2(fruit) : this.allFruits2.slice()
      )
    );
  }

  add1(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.fruits1.push(value);
    }
    event.chipInput?.clear();
    this.fruitCtrl1.setValue(null);
  }
  add2(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.fruits2.push(value);
    }
    event.chipInput?.clear();
    this.fruitCtrl2.setValue(null);
  }
  remove1(fruit: string): void {
    const index = this.fruits1.indexOf(fruit);
    if (index >= 0) {
      this.fruits1.splice(index, 1);
    }
  }
  remove2(fruit: string): void {
    const index = this.fruits2.indexOf(fruit);
    if (index >= 0) {
      this.fruits2.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.fruits1.push(event.option.viewValue);
    this.fruits2.push(event.option.viewValue);
    this.fruitInput1.nativeElement.value = '';
    this.fruitInput2.nativeElement.value = '';

    this.fruitCtrl1.setValue(null);
    this.fruitCtrl2.setValue(null);
  }

  private _filter1(value: string): string[] {
    const filterValue1 = value.toLowerCase();

    return this.allFruits1.filter((fruit) =>
      fruit.toLowerCase().includes(filterValue1)
    );
  }
  private _filter2(value: string): string[] {
    const filterValue2 = value.toLowerCase();

    return this.allFruits2.filter((fruit) =>
      fruit.toLowerCase().includes(filterValue2)
    );
  }

  selectedList3: data[] = [
    { value: 'orange' },
    { value: 'white' },
    { value: 'purple' },
  ];

  categoriesDataSource = new MatTableDataSource();
}
