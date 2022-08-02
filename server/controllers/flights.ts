import express from 'express';
import * as DBConfig from '../config/db';
import oracledb from 'oracledb';

let userId = 10;

export function DisplayFlightsPage (req: express.Request, res: express.Response, next: express.NextFunction)
{
    let fromLocation : string = "", toLocation : string = "";
    if(req.body.from.includes("(") && req.body.from.includes(")"))
    {
        fromLocation = req.body.from.split("(")[1].split(")")[0];
    }
    if(req.body.to.includes("(") && req.body.to.includes(")"))
    {
        toLocation = req.body.to.split("(")[1].split(")")[0];
    }

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
          const result:oracledb.Result<any> = await connection.execute(`
          SELECT * FROM pj_flight
          WHERE TO_CHAR(take_off_time, 'YYYY-MM-DD') = :day AND FROM_AIRPORT = :dep AND TO_AIRPORT = :arr`, 
          {
            day: req.body.date,
            dep: fromLocation,
            arr: toLocation
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });
          // User information
          const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, 
          {
            userNum: userId,
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });
          // Basket counter
          const basket:oracledb.Result<any> = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`,
            {
                userNum: userId,
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Create basket if no basket found
            if(basket.rows && basket.rows[0].COUNT == 0)
            {
              await connection.execute(`
              BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `,
              {
                userNum: userId,
              });
            }
            if(result.rows)
            {
              for (let i = 0; i < result.rows.length; i ++)
              {
              const minPrice :oracledb.Result<any> = await connection.execute(`
              BEGIN
              min_price_sp(:flightid, :econ, :business, :first);
              END;`,
                {
                  flightid: result.rows[i].ID_FLIGHT,
                  econ:{ dir: oracledb.BIND_OUT, type: oracledb.NUMBER},
                  business:{ dir: oracledb.BIND_OUT, type: oracledb.NUMBER},
                  first:{ dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
                    
                });
                result.rows[i].ECON = minPrice.outBinds.econ;
                result.rows[i].BUSINESS = minPrice.outBinds.business;
                result.rows[i].FIRST = minPrice.outBinds.first;
            }
            res.render('index', {title: 'Search', page: 'flight-search', results: result, date: req.body.date, basket: basket, user: user });
          await connection.close();
        }
      }
      );
}

export function DisplaySelectPage(req: express.Request, res: express.Response, next: express.NextFunction)
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
      const flight:oracledb.Result<any> = await connection.execute(`
      SELECT TO_CHAR(take_off_time, 'YYYY-MM-DD') takeoffdate, airline, id_flight, model FROM pj_flight
      WHERE  id_flight =  :flightid`, 
          {
            flightid: req.params.flightId
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });

      const ticket:oracledb.Result<any> = await connection.execute(`
      SELECT * FROM pj_ticket
      WHERE availability = 'Y' AND class = :class AND flightid = :flightid AND orderid IS NULL`, 
          {
            flightid: req.params.flightId,
            class: req.params.class
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });
          // User information
          const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, 
          {
            userNum: userId,
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });
          console.log(ticket);
                    
          // basket
          const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`,
            {
                userNum: userId,
                
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
          await connection.close();
          res.render('index', {title: 'Select Ticket', flight: flight, page: 'select', ticket: ticket, basket: basket, user: user, flight_id: req.params.flightId });
    });
}

export function AddToCart(req: express.Request, res: express.Response, next: express.NextFunction)
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
      const basket:oracledb.Result<any> = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`,
            {
                userNum: userId,
                
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Create basket if no basket found
            if(basket.rows && basket.rows[0].COUNT == 0)
            {
              await connection.execute(`
              BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `,
              {
                userNum: userId,
              });
            }
            await connection.execute(`
            BEGIN
            add_to_cart_sp(:ticketNum, :userNum);
            END;
            `,
            {
              userNum: userId,
              ticketNum : req.params.ticketId
            });
            await connection.close();
      res.redirect('back');
      });
}
export function DisplayCheckoutTable(req: express.Request, res: express.Response, next: express.NextFunction)
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
      const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, 
          {
            userNum: userId,
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });
          // Basket counter
          const basket:oracledb.Result<any> = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`,
            {
                userNum: userId,
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Create basket if no basket found
            if(basket.rows && basket.rows[0].COUNT == 0)
            {
              await connection.execute(`
              BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `,
              {
                userNum: userId,
              });
            }
      const ticket:oracledb.Result<any> = await connection.execute(`
      SELECT * FROM pj_customers c ,pj_orders o, pj_ticket t, pj_flight f
      WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND t.flightid = f.id_flight AND c.id_user = :userNum AND o.completed = 'N'
      `,
      {
    userNum: userId
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )
      await connection.close();
      res.render('index', {title: 'Check Out', page: 'checkout', ticket: ticket, basket: basket, user: user });
});
}

export function RemoveFromCart(req: express.Request, res: express.Response, next: express.NextFunction)
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
      const basket:oracledb.Result<any> = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`,
            {
                userNum: userId,
                
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Create basket if no basket found
            if(basket.rows && basket.rows[0].COUNT == 0)
            {
              await connection.execute(`
              BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `,
              {
                userNum: userId,
              });
            }
            await connection.execute(`
            BEGIN
            remove_from_cart_sp(:ticketNum, :userNum);
            END;
            `,
            {
              userNum: userId,
              ticketNum : req.params.ticketId
            });
            await connection.close();
            res.redirect('back');
      });
}
export function Checkout(req: express.Request, res: express.Response, next: express.NextFunction)
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

        const ticket:oracledb.Result<any> = await connection.execute(`
        SELECT * FROM pj_customers c ,pj_orders o, pj_ticket t, pj_flight f
        WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND t.flightid = f.id_flight AND c.id_user = :userNum AND o.completed = 'N'
        `,
        {
          userNum: userId
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

      await connection.execute(`
        BEGIN
        checkout_sp(:userNum);
        END;`,
      {
        userNum: userId,
      });

      const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, 
          {
            userNum: userId,
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });
          
      const basket:oracledb.Result<any> = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`,
            {
                userNum: userId,
                
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT });
            // Create basket if no basket found
      if(basket.rows && basket.rows[0].COUNT == 0)
      {
        await connection.execute(`
        BEGIN
        create_empty_basket_sp(:userNum);
        END;
        `,
        {
          userNum: userId,
        });
      }
            
      await connection.close();
      res.render('index', {title: 'Check Out', page: 'complete_order', ticket: ticket, basket: basket, user: user });
    });
  }