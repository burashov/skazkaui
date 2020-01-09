var Components = {

  randomId : function()  {
    return Math.random().toString(36).substr(2, 9);
  }

};

var Templates = {

  register : function() {
    Handlebars.registerPartial("textSearchFilter", this.textSearchFilter);
    Handlebars.registerPartial("paginationFilter", this.paginationFilter);
  },

  textSearchFilter : `
    {{#with search}}
    <input type="text" onchange="{{action}}" value="{{value}}">
    {{/with}}
  `,

  paginationFilter: `
    {{#with pagination}}
    <nav>
      <ul class="pagination justify-content-end">
        <li class="page-item {{#unless previousPage}}disabled{{/unless}}">
          <a class="page-link" {{#if previousPage}}href="{{previousPage}}"{{/if}}>Предыдущая</a>
        </li>
        <li class="page-item disabled"><a class="page-link" href="#">{{page}} из {{totalPages}}</a></li>

        <li class="page-item" {{#unless previousPage}}disabled{{/unless}}>
          <a class="page-link" {{#if nextPage}}href="{{nextPage}}"{{/if}}>Следующая</a>
        </li>
      </ul>
    </nav>
    {{/with}}
  `,

  table: `
    <div class="row align-items-start">
      {{> textSearchFilter}}
    </div>
    <br>
    <div class="row">
      <table class="table table-bordered">
      <thead>
      <tr>
        {{#each table.header}}
          <th>{{data}}</th>
        {{/each}}
      </tr>
      </thead>
      <tbody>
      {{#each table.rows}}
        <tr>
        {{#each .}}
          <td>{{data}}</td>
        {{/each}}
        </tr>
      {{/each}}
      </tbody>
      </table>
    </div>
    <div class="row align-items-end" >
      <div class="col">
          {{> paginationFilter}}
      </div>
    </div>
  `


}

Templates.register();

class TextSearchFilter {

  enrichData(data, textStatus, request, json, state, id) {

    json.search = {};
    json.search.value = state.search.value;

    json.search.action= "var self = Components['" + id + "']; self.state.search.value = this.value; self.render()";

  }

  enrichQuery(result, props, state) {

      if(state.search.value) {
        result += "&" + props.search.field + "=like.%" + state.search.value + "%";
      }

      return result;
  }
}

class PaginationFilter {

  enrichData(data, textStatus, request, json, state, id) {

    var range = request.getResponseHeader("content-range");
    var index = range.indexOf('/');
    var size = range.substring(index + 1, range.length);
    var totalPages = Math.ceil(size / state.pagination.perPage);
    var page = state.pagination.page;

    json.pagination = {};
    json.pagination.page = page;
    json.pagination.totalPages = totalPages;

    if(page > 1) {
      json.pagination.previousPage = "javascript: var self = Components['" + id + "']; self.state.pagination.page -= 1; self.render()";
    }

    if(page < totalPages) {
      json.pagination.nextPage = "javascript: var self = Components['" + id + "']; self.state.pagination.page += 1; self.render()";
    }
  }

  enrichQuery(result, props, state) {

      result += "&offset=" + (state.pagination.page - 1) * state.pagination.perPage;
      result += "&limit=" + state.pagination.perPage;

      return result;
  }

}

class Table {

  template = Templates.table;

  constructor(config) {

    this.id = Components.randomId();

    Components[this.id] = this;

    if(config.template) {
      this.template = config.template;
    }

    this.element = config.element;
    this.originalQuery = config.query;
    this.props = config.props;
    this.state = config.state;
    this.callback  = config.callback;
    this.templateFunction = Handlebars.compile(this.template);
    this.filters = [];

  }

  addFilter(filter) {
      this.filters.push(filter);
  }

  query() {
    var result = this.originalQuery;

    this.filters.forEach(filter => result = filter.enrichQuery(result, this.props, this.state));

    return result;
  }

  tableData(data, textStatus, request, json) {
    json.table = {};
    json.table.header = [];
    json.table.rows = [];

    var me = this;

    Object.entries(me.props.table).map(([key, value]) => {
        json.table.header.push({"data" : value.name})
    })

    data.forEach(function (item, index) {
      var row = [];

      Object.entries(me.props.table).map(([key, value]) => {

          var data = item[key];

          if(value.value != null) {
            data = value.value(item, key, index);
          }

          row.push({
            "data" : data
          });
      });

      json.table.rows.push(row)

    });
  }

  render() {
    var url = this.query();
    var me = this;
    $.ajax({url,
        headers: {
          "Prefer": "count=exact"
        },
        success: function(data, textStatus, request) {
          var json = new Object();

          if(me.callback) {
            data = me.callback(me, data, textStatus, request)
          }

          me.tableData(data, textStatus, request, json);

          me.filters.forEach(filter => filter.enrichData(data, textStatus, request, json, me.state, me.id));

          me.element.html(me.templateFunction(json));
        },
        error: function(data, textStatus, request) {

        }
    });

  }

}
