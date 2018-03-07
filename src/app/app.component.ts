import { Component, ViewChild, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { merge } from 'rxjs/observable/merge';
import {of as observableOf} from 'rxjs/observable/of';
import {catchError} from 'rxjs/operators/catchError';
import {map} from 'rxjs/operators/map';
import {startWith} from 'rxjs/operators/startWith';
import {switchMap} from 'rxjs/operators/switchMap';
import { MatPaginator, MatTableDataSource, MatSort } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

// Check here!!!   ExampleHttpDao
export class AppComponent {
	displayedColumns = ['rank', 'name', 'symbol', 'price_usd', 'percent_change_1h'];
  database: HttpRequest;
  dataSource = new MatTableDataSource();

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.database = new HttpRequest(this.http);
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
    
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(

        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;          

          return this.database!.getRepoIssues(this.sort.active, this.sort.direction, this.paginator.pageIndex);
        }),
        map(data => {
        	// when finished loading and rate limit is not reached
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.resultsLength = data.length;
          return data;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      ).subscribe(data => {
      	this.dataSource.data = data
      	console.log(this.dataSource.data);
      });
        
 		}
	

  ngAfterViewInit() {
  	this.dataSource.sort = this.sort;
  }

  search(item: string) {
    item = item.trim(); // Remove whitespace
    item = item.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.dataSource.filter = item;
  }
}

export interface CoinMarketApi {
  items: CoinMarket[];
  total_count: number;
}


export interface CoinMarket {
  rank: number;
  name: string;
  symbol: string;
  price_usd: number;
  percent_change_1h: number;
}

// http request to CoinMarket API
export class HttpRequest {
  constructor(private http: HttpClient) {}
  getRepoIssues(sort: string, order: string, page: number): Observable<CoinMarketApi> {
    const href = 'https://api.coinmarketcap.com/v1/ticker/?limit=20'
    
    return this.http.get<CoinMarketApi>(href);
  }
}







