//Configuration
import createError from 'http-errors';
import express, { NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session from 'express-session';
import cors from 'cors';
import indexRouter from '../routes/index';
import flightRouter from '../routes/flights'

const app = express();

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');  //View Engine
app.locals.moment = require('moment');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../../client')));
app.use(express.static(path.join(__dirname, '../../node_modules')));
app.use(cors());

app.use('/', indexRouter);
app.use('/', flightRouter);

// catch 404 and forward to error handler
app.use(function(req : express.Request, res : express.Response, next : NextFunction) {
  next(createError(404));
});

// error handler
app.use(function(err: createError.HttpError, req: express.Request, res: express.Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


export default app;
