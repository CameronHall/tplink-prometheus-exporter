const promBundle = require("express-prom-bundle");
const app = require("express")();
const metricsMiddleware = promBundle({includeMethod: true});
const indexRouter = require('./routes/index');

app.use(metricsMiddleware);
app.use('/', indexRouter);

app.listen(process.env.PORT || '3000');