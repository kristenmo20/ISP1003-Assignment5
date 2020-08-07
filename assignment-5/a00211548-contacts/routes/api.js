var express = require('express');
var router = express.Router();

const { Connection, TYPES, Request } = require("tedious");

// Create connection to database
const config = {
  authentication: {
    options: {
      userName: "a00211548",
      password: "Cambrian01*"
    },
    type: "default"
  },
  server: "a00211548.database.windows.net",
  options: {
    database: "a00211548",
    encrypt: true
  }
};

function getConnection() {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);
    connection.on("connect", (err) => {
      if (err) {
        return reject(err);
      }
      resolve(connection);
    });
  });
}

function execute(sql, addParams) {
  const rows = [];
  return new Promise(async (resolve, reject) => {
    const connection = await getConnection();
    const request = new Request(sql, (err, rowCount) => {
      connection.close();
      if (err) {
        reject(err)
      }
      resolve({ total: rowCount, data: rows });
    });
    if (addParams) {
      addParams(request);
    }
    request.on("row", columns => {
      let row = {};
      columns.forEach(column => {
        if (column.metadata.colName) {
          row[column.metadata.colName] = column.value;
        } else {
          row = column.value;
        }
      });
      rows.push(row);
    })
    connection.execSql(request);
  });
}

router.post('/', async function (req, res, next) {
  try {
    let result = await execute(`INSERT INTO [dbo].[contacts] (name, email, phone) VALUES (@name, @email, @phone); select @@identity`,
      (request) => {
        request.addParameter("name", TYPES.VarChar, req.body.name);
        request.addParameter("email", TYPES.VarChar, req.body.email);
        request.addParameter("phone", TYPES.VarChar, req.body.phone);
      });
    result = await execute(`SELECT * FROM [dbo].[contacts] WHERE [dbo].[contacts].[id] = @id`, (request) => {
      request.addParameter("id", TYPES.Int, result.data[0]);
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/', async function (req, res, next) {
  try {
    const result = await execute(`SELECT * FROM [dbo].[contacts]`);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async function (req, res, next) {
  try {
    const result = await execute(`SELECT * FROM [dbo].[contacts] WHERE [dbo].[contacts].[id] = @id`, (request) => {
      request.addParameter("id", TYPES.Int, req.params.id);
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async function (req, res, next) {
  try {
    const result = await execute(`UPDATE [dbo].[contacts] SET 
    [dbo].[contacts].[name] = @name, 
    [dbo].[contacts].[email] = @email, 
    [dbo].[contacts].[phone] = @phone
    WHERE [dbo].[contacts].[id] = @id; 
    SELECT * FROM [dbo].[contacts] WHERE [dbo].[contacts].[id] = @id`, (request) => {
      request.addParameter("id", TYPES.Int, req.params.id);
      request.addParameter("name", TYPES.VarChar, req.body.name);
      request.addParameter("email", TYPES.VarChar, req.body.email);
      request.addParameter("phone", TYPES.VarChar, req.body.phone);
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async function (req, res, next) {
  try {
    await execute(`DELETE FROM [dbo].[contacts] WHERE [dbo].[contacts].[id] = @id`, (request) => {
      request.addParameter("id", TYPES.Int, req.params.id);
    });
    res.json({});
  } catch (err) {
    next(err);
  }
});

module.exports = router;
