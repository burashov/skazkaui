var SkazkaUI = {

  perPage: 20,


  createVisitsTable: function() {

    var date = new Date(2020, 1, 0);
    var daysInMonth = date.getDate();
    var group_id = 1;

    var columns = {};

    columns[0] =  { name : "" };

    for(var i = 1; i <=daysInMonth; i++) {
        columns[i] =  { name : i };
    }

    class VisitsTable extends Table {

      delete(client_id, group_id, year, month, day) {
        var url = "http://localhost:3000/visits?client_id=eq." + client_id + "&group_id=eq." + group_id +
          "&year=eq." + year + "&month=eq." + month + "&day=eq." + day;

        var me = this;

        $.ajax({url,
            type: 'DELETE',
            success: function(data, textStatus, request) {
              Components[me.id].render();
            },
            error: function(data, textStatus, request) {

            }
        });
      }


      setType(client_id, group_id, year, month, day, type) {
        var url = "http://localhost:3000/visits?";

        var me = this;

        $.ajax({url,
            type: 'POST',
            headers: {
              "Prefer": "resolution=merge-duplicates"
            },
            data: {
              "client_id": client_id,
              "group_id": group_id,
              "year": year,
              "month": month,
              "day": day,
              "visit": type
            },
            success: function(data, textStatus, request) {
              Components[me.id].render();
            },
            error: function(data, textStatus, request) {

            }
        });
      }

    }

    var t = new VisitsTable(
      {
        element : $("#aaa"),
        query: "http://localhost:3000/v_visits?client_to_group_group_id=eq.1",
        props : {
          table : columns,
        },
        state : {
          pagination : {
            page: 1,
            perPage: SkazkaUI.perPage
          }
        },
        callback: (me, data) => {
          var result = [];
          var clients = {};

          for(let item of data) {
            clients[item.id] = item.name;
          }

          for (let [client_id, client_name] of Object.entries(clients)) {

            var types = ["VISIT", "SICK", "FREEZING"];
            types.forEach(function(type) {
              var row = {};
              row[0] = '<td>' + (type == "VISIT" ? client_name : "") + '</td>';
              for(var day = 1; day<=daysInMonth; day++) {

                var selected = false;

                for (let item of data) {
                  if(item.year == date.getFullYear()
                      && item.month == date.getMonth() + 1
                      && item.day == day
                      && item.client_id == client_id) {

                    if(type == item.visit) {
                      selected = true;
                    }

                    break;
                  }
                }

                var deleteAction =  "var self = Components['" + me.id + "']; self.delete(" +
                  client_id + ", " + group_id + ", " + date.getFullYear() + ", " + date.getMonth() + 1 + "," + day + ")";

                var setTypeAction =  "var self = Components['" + me.id + "']; self.setType(" +
                  client_id + ", " + group_id + ", " + date.getFullYear() + ", " + date.getMonth() + 1 + "," + day + ", '" +
                  type + "')";

                if(selected) {
                  if(type == "VISIT") {
                    row[day] = '<td onclick="javascript: ' + deleteAction + '" style="background-color: lightgreen;">П</td>';
                  } else if (type == "SICK") {
                    row[day] = '<td onclick="javascript: ' + deleteAction + '" style="background-color: yellow;">З</td>';
                  } else if (type == "FREEZING") {
                    row[day] = '<td onclick="javascript: ' + deleteAction + '" style="background-color: red;">Б</td>';
                  }

                } else {
                  row[day] = '<td onclick="javascript: ' + setTypeAction + '"></td>';
                }
              }

              result.push(row);
            });
          }

          return result;
        },
        template: `
              <table class="table table-bordered">
              <thead>
              <tr>
                {{#each table.header}}
                  <th s tyle="padding: 2px; margin: 2px;">{{data}}</th>
                {{/each}}
              </tr>
              </thead>
              <tbody>
              {{#each table.rows}}
                <tr>
                {{#each .}}
                  {{{data}}}
                {{/each}}
                </tr>
              {{/each}}
              </tbody>
              </table>
        `
      }
    );
    return t;

  },

  createClientsTable: function () {

    var t = new Table(
      {
        element : $("#aaa"),
        query: "http://localhost:3000/clients?",
        props : {
          table : {
            id : {
              name: "ID"
            },
            name : {
              name : "Имя"
            },
            mobile1 : {
              name : "Телефон"
            },
            email : {
              name : "Email"
            },
            active : {
              name: "Активный"
            },
            notes: {
              name: "Заметки"
            }
          },
          search : {
            field: "name"
          }
        },
        state : {
          pagination : {
            page: 1,
            perPage: SkazkaUI.perPage
          },
          search : {
            value: ""
          }
        }
      }
    );
    t.addFilter(new PaginationFilter());
    t.addFilter(new TextSearchFilter());
    t.template = `
    `;
    return t;
  },

  createEditClientsForm : function() {
    var edit_client_template = Handlebars.compile(`
    <div class="row">
        <div class="col-12 mt-5">
            <div class="card">
                <div class="card-body">
                    <h4 class="header-title">{{#unless client}}Новый{{/unless}} клиент</h4>
                    <form id="client_form">
                    <input type="hidden" name="client.id" value="{{client.id}}">
                    <div class="row">
                        <div class="col-4">
                            <div class="form-group">
                                <label>Фамилия</label>
                                <input type="text" class="form-control" name="client.surname" value="{{surname}}">
                            </div>
                            <div class="form-group">
                                <label>Имя</label>
                                <input type="text" class="form-control" name="client.name" value="{{name}}">
                            </div>
                            <div class="form-group">
                                <label>Отчество</label>
                                <input type="text" class="form-control" name="client.patronymic" value="{{patronymic}}">
                            </div>
                            <div class="form-group">
                                <label>Дата рождения</label>
                                <input type="text" class="form-control" name="client.birthday" value="{{birthday}}">
                            </div>
                            <div class="form-group">
                                <label>Пол</label>
                                <select class="form-control" name="client.sex">
                                    <option value="" {{#if noneSelected}}selected{{/if}}></option>
                                    <option value="MALE" {{#if maleSelected}}selected{{/if}}>Мужской</option>
                                    <option value="FEMALE" {{#if femaleSelected}}selected{{/if}}>Женский</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="exampleInputEmail1">Email</label>
                                <input type="email" class="form-control" name="client.email" placeholder="Введите email" value="{{email}}">
                            </div>
                            <div class="form-group">
                                <label>Мобильный 1</label>
                                <input type="text" class="form-control" name="client.mobile1" placeholder="Введите телефон" value="{{mobile1}}">
                            </div>
                            <div class="form-group">
                                 <label>Мобильный 2</label>
                                 <input type="text" class="form-control" name="client.mobile2" placeholder="Введите телефон" value="{{mobile2}}">
                             </div>
                        </div>
                        <div class="col-4">
                            <div class="form-group">
                                <label>Фамилия родителя</label>
                                <input type="text" class="form-control" name="client.parentSurname" value="{{parentSurname}}">
                            </div>
                            <div class="form-group">
                                <label>Имя родителя</label>
                                <input type="text" class="form-control" name="client.parentName" value="{{parentName}}">
                            </div>
                            <div class="form-group">
                                <label>Отчество родителя</label>
                                <input type="text" class="form-control" name="client.parentPatronymic" value="{{parentPatronymic}}">
                            </div>
                            <div class="custom-control custom-checkbox custom-control-inline">
                                <input type="checkbox" class="custom-control-input" id="activeCheck" name="client.active" {{#if active}}checked{{/if}}>
                                <label class="custom-control-label" for="activeCheck">Активный</label>
                            </div>
                            <label class="text-muted mb-3 mt-4 d-block">Источник:</label>
                            <div class="custom-control custom-checkbox custom-control-inline">
                                <input type="checkbox" class="custom-control-input" id="customCheck1">
                                <label class="custom-control-label" for="customCheck1">Интернет</label>
                            </div>
                            <div class="custom-control custom-checkbox custom-control-inline">
                                <input type="checkbox" class="custom-control-input" id="customCheck2">
                                <label class="custom-control-label" for="customCheck2">Друзья</label>
                            </div>
                            <div class="custom-control custom-checkbox custom-control-inline">
                                <input type="checkbox" class="custom-control-input" id="customCheck3">
                                <label class="custom-control-label" for="customCheck3">vk.com</label>
                            </div>
                            <div class="form-group">
                                <br/>
                                <label>Примечание</label>
                                <textarea class="form-control" name="client.notes" rows="10">{{notes}}</textarea>
                            </div>
                        </div>
                        <div class="col-4">
                           <div class="form-group">
                                <label>Группы</label>
                                {{#each clazzes}}
                                    <div class="form-check">
                                        <input type="hidden" name="clazzes[{{@index}}].clazz.id" value="{{clazz.id}}">
                                        <input type="checkbox" class="form-check-input" {{#if hasClazz}}checked{{/if}} name="clazzes[{{@index}}].hasClazz">
                                        <label>{{clazz.name}}</label>
                                    </div>
                                {{/each}}
                            </div>
                         </div>
                    </div>
                        <button type="button" class="btn btn-primary mt-4 pr-4 pl-4" onclick="javascript: save_client()">Сохранить</button>
                        <button type="button" class="btn btn-primary mt-4 pr-4 pl-4" onclick="javascript: history.back()">Отмена</button>
                        <button type="button" class="btn btn-danger mt-4 pr-4 pl-4" onclick="javascript: remove_client('{{client.id}}')">Удалить</button>
                    </form>
                </div>
            <div>
        <div>
    </div>
    `);

    $("#aaa").html(edit_client_template());

  }
}
