const express = require('express');
const app = express();
const routes = require('./routing/routes.js');
app.use(express.static('./Client_html'));

app.use('/roulette', routes);

app.listen(8081, function () {
  console.log('Example app listening on port 8080!');
});
