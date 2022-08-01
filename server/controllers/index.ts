import express from 'express';
import * as DBConfig from '../config/db';
import oracledb from 'oracledb';

let userId = 10;

export function DisplayHomePage (req: express.Request, res: express.Response, next: express.NextFunction)
{
    oracledb.getConnection(
        {
          user          : DBConfig.user,
          password      : DBConfig.password,
          connectString : DBConfig.connectString
        },
        async (err, connection) => {
          if (err)
          {
            console.log(err);
          }
          else
          {
            console.log("Succesfully Login Oracle Database with user" +  DBConfig.user);
            
          }
          // select airport information
          const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, 
          {
            userNum: userId,
            
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });

          
          const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`,
            {
                userNum: userId,     
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });


            res.render('index', {title: 'Home', page: 'home', basket : basket, user: user  });
          await connection.close();
        }
      );
}