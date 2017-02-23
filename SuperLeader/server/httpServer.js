const express = require('express');
const app = express();
const routes = require('./routing/routes.js');

app.use(express.static('../Client_html'));

app.use('/stateNode', routes);

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});
