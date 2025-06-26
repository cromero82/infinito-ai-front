import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterType', standalone: true })
export class FilterTypePipe implements PipeTransform {
  transform(types: any[], filter: string): any[] {
    if (!filter) return types;
    return types.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));
  }
}

@Pipe({ name: 'filterCompany', standalone: true })
export class FilterCompanyPipe implements PipeTransform {
  transform(companies: any[], filter: string): any[] {
    if (!filter) return companies;
    return companies.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
  }
}
