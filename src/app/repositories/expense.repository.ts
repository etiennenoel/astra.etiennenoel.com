import { Injectable } from '@angular/core';
import { SearchQuery, SearchResult } from '@pristine-ts/mysql-common';

@Injectable({
  providedIn: 'root'
})
export class ExpenseRepository {

  constructor() { }

  async search(searchQuery: SearchQuery): Promise<SearchResult<any>> {
    // TODO: Implement IndexedDB interaction
    console.log('Search query:', searchQuery);
    return Promise.reject('Search method not implemented yet');
  }
}
