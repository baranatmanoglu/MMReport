import "./fixed-data-table.css";
var React = require('react');
var ReactDOM = require('react-dom');
var Axios = require('axios');

const {Table, Column, Cell} = require('fixed-data-table');


var SortTypes = {
    ASC: 'ASC',
    DESC: 'DESC',
  };
  
  function reverseSortDirection(sortDir) {
    return sortDir === SortTypes.DESC ? SortTypes.ASC : SortTypes.DESC;
  }

  class SortHeaderCell extends React.Component {
    constructor(props) {
      super(props);
  
      this._onSortChange = this._onSortChange.bind(this);
    }
  
    render() {
      var {sortDir, children, ...props} = this.props;
      return (
        <Cell {...props}>
          <a onClick={this._onSortChange}>
            {children} {sortDir ? (sortDir === SortTypes.DESC ? '↓' : '↑') : ''}
          </a>
        </Cell>
      );
    }
  
    _onSortChange(e) {
      e.preventDefault();
  
      if (this.props.onSortChange) {
        this.props.onSortChange(
          this.props.columnKey,
          this.props.sortDir ?
            reverseSortDirection(this.props.sortDir) :
            SortTypes.DESC,
          this.props.columnName  
        );
      }
    }
  }


class DataListWrapper {
    constructor(indexMap, data) {
        this._indexMap = indexMap;
        this._data = data;
    }

    getSize() {
        return this._indexMap.length;
    }

    getObjectAt(index) {
        return this._data[this._indexMap[index]];
    }
}
  
  
const LinkCell = ({rowIndex, data, columnKey, ...props}) => (
<Cell {...props}>
    <a href={data.getObjectAt(rowIndex)[columnKey]}>{data.getObjectAt(rowIndex)[columnKey]}</a>
</Cell>
);
  
const TextCell = ({rowIndex, data, columnKey, ...props}) => (
<Cell {...props}>
    {data.getObjectAt(rowIndex)[columnKey]}
</Cell>
);





class ReportTable extends React.Component {
    constructor(props) {
        super(props);
        
        
        this.report = {};
        this._dataList = [];
        this._defaultSortIndexes = [];
        
    
        this.state = {
          
          filterby: 'companyName',
          filterbyColumnName: 'Company Name',
          colSortDirs: {},
          
          mock: {},
        };
    
        this._onSortChange = this._onSortChange.bind(this);
        this._onFilterChange = this._onFilterChange.bind(this);
        this._onDropDownChange = this._onDropDownChange.bind(this);

        

        
        
      }

    

      _onSortChange(columnKey, sortDir, columnName) {
        var sortIndexes = this._defaultSortIndexes.slice();
        sortIndexes.sort((indexA, indexB) => {
          var valueA = this._dataList[indexA][columnKey];
          var valueB = this._dataList[indexB][columnKey];
          var sortVal = 0;
          if (valueA > valueB) {
            sortVal = 1;
          }
          if (valueA < valueB) {
            sortVal = -1;
          }
          if (sortVal !== 0 && sortDir === SortTypes.ASC) {
            sortVal = sortVal * -1;
          }
    
          return sortVal;
        });
    
        this.setState({
          sortedDataList: new DataListWrapper(sortIndexes, this._dataList),
          colSortDirs: {
            [columnKey]: sortDir,
          },
          filterby: columnKey,
          filterbyColumnName: columnName,
        });
      }

      _onFilterChange(e){
        if (!e.target.value) {
            this.setState({
                sortedDataList: new DataListWrapper(this._defaultSortIndexes.slice(),this._dataList),
            });
          }
      
          var filterBy = e.target.value.toLowerCase();
          var size = this._dataList.length;
          var filteredIndexes = [];
          for (var index = 0; index < size; index++) {
            var searchKey = this._dataList[index][this.state.filterby];
            if (searchKey.toLowerCase().indexOf(filterBy) !== -1) {
              filteredIndexes.push(index);
            }
          }
          
          if(filteredIndexes.length !== 0){
            this.setState({
                sortedDataList: new DataListWrapper(filteredIndexes, this._dataList),
            });
          }
          else{
            this.setState({
                sortedDataList: new DataListWrapper(this._defaultSortIndexes.slice(), this._dataList),
            }); 
          }
      }

      _onDropDownChange(e){
        
        var selectedDate = e.target.value;
        this._dataList = this.report.filter(function(obj){return obj.date === selectedDate})[0].list;
        this.setState({
          sortedDataList: new DataListWrapper(this._defaultSortIndexes.slice(),this._dataList),
        });
      }

      componentWillMount(){
        
      }

      componentDidMount(){
        console.log("component did mount");
        
        Axios({
          method: 'post',
          url: 'https://finie.herokuapp.com/api/report',
          data: {
            customerId: '155295665',
            link: 'www.isbank.com.tr',
          },
          auth: {
            username: 'pocUser',
            password: 'MaxiFinie'
          },
        }).then(res => {
          
          var mock = res.data;
          var dates = res.data.reportDates;
          var reports = res.data.reports;
          
          
          var size = reports.filter(function(obj){return obj.date === dates[0]})[0].list.length;
          var indexes = [];
          for (var index = 0; index < size; index++) {
            indexes.push(index);
          }
          this._dataList = reports.filter(function(obj){return obj.date === dates[0]})[0].list;
          this._defaultSortIndexes = indexes;
          this.report= reports;
          this.setState({
            sortedDataList: new DataListWrapper(this._defaultSortIndexes.slice(),this._dataList),
            reportDates : dates,
          });
        }).catch(console.log('terrible'));
      }

    render() {
        var {sortedDataList, colSortDirs, filterbyColumnName, reportDates} = this.state;
        if(sortedDataList == undefined){
          return(<div>The response it not here yet!</div>);
        }
        else{
          return (
          <div>
              <DropDown id="myDropdown" options={reportDates} handleChange={this._onDropDownChange}/> &nbsp;
              <input onChange={this._onFilterChange} placeholder={"Filter by " + filterbyColumnName}/>
              <br />
          <Table
              rowHeight={50}
              headerHeight={50}
              rowsCount={sortedDataList.getSize()}
              width={1500}
              height={500}
              {...this.props}>
              
              <Column columnKey="companyName"
              header={<SortHeaderCell onSortChange={this._onSortChange} sortDir={colSortDirs.companyName} columnName="Company Name">Company Name</SortHeaderCell>}
              cell={<TextCell data={sortedDataList} />}
              fixed={true}
              width={200}
              />
              <Column columnKey="funding"
              header={<SortHeaderCell onSortChange={this._onSortChange} sortDir={colSortDirs.funding} columnName="Funding Amount">Funding Amount</SortHeaderCell>}
              cell={<TextCell data={sortedDataList}  />}
              fixed={true}
              width={200}
              />
              <Column columnKey="stage"
              header={<SortHeaderCell onSortChange={this._onSortChange} sortDir={colSortDirs.stage} columnName="Stage">Stage</SortHeaderCell>}
              cell={<TextCell data={sortedDataList}  />}
              width={200}
              />
              <Column columnKey="lastFundingDate"
              header={<SortHeaderCell onSortChange={this._onSortChange} sortDir={colSortDirs.lastFundingDate} columnName="Funding Date">Funding Date</SortHeaderCell>}
              cell={<TextCell data={sortedDataList} />}
              width={200}
              />
              <Column columnKey="location"
              header={<SortHeaderCell onSortChange={this._onSortChange} sortDir={colSortDirs.location} columnName="Location">Location</SortHeaderCell>}
              cell={<TextCell data={sortedDataList}  />}
              width={200}
              />
              <Column columnKey="category"
              header={<SortHeaderCell onSortChange={this._onSortChange} sortDir={colSortDirs.category} columnName="Category">Category</SortHeaderCell>}
              cell={<TextCell data={sortedDataList} />}
              width={200}
              />
              <Column columnKey="website"
              header={<Cell>Web Site</Cell>}
              cell={<LinkCell data={sortedDataList}/>}
              width={300}
              />
          </Table>
          </div>
          );
        }
    }
}
class DropDown extends React.Component {
  

  render() {
      var self = this;
      var options = self.props.options.map(function(option) {
          return (
              <option key={option} value={option}>
                  {option}
              </option>
          )
      });
      return (
          <select id={this.props.id} 
                  value={this.props.selected} 
                  onChange={this.props.handleChange}>
              {options}
          </select>)
  }

  
   
}

const element = (<div><ReportTable/></div>);
ReactDOM.render(
  element,
  document.getElementById('root')
);
