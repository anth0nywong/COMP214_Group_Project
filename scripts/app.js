const fs = require("fs");
const data = require("./data.json");

const airports = data.Airport;
const airline = data.Airline;

let content = "";

let day = new Date();

console.log(day.toISOString().split("T")[0]);

for (let i = 0; i <= 30; i++) {
  day.setDate(day.getDate() + 1);
  Object.entries(airports).forEach(([departureKey, departureValue]) => {
    Object.entries(airports).forEach(([arrivalKey, arrivalValue]) => {
      if (departureKey !== arrivalKey) {
        if (departureValue.Airline) {
          content += `INSERT INTO pj_flight VALUES (flight_seq.nextval, '${
            departureValue.Airline
          }', '${departureKey}', '${arrivalKey}', TO_TIMESTAMP('${
            day.toISOString().split("T")[0]
          } 08:00:00', 'YYYY-MM-DD HH24:MI:SS.FF'), TO_TIMESTAMP('${
            day.toISOString().split("T")[0]
          } 13:00:00', 'YYYY-MM-DD HH24:MI:SS.FF'),'A380','T1','T6');\n`;
        }
      }
      if (arrivalValue.Airline) {
        content += `INSERT INTO pj_flight VALUES (flight_seq.nextval, '${
          arrivalValue.Airline
        }', '${departureKey}', '${arrivalKey}', TO_TIMESTAMP('${
          day.toISOString().split("T")[0]
        } 08:00:00', 'YYYY-MM-DD HH24:MI:SS.FF'), TO_TIMESTAMP('${
          day.toISOString().split("T")[0]
        } 13:00:00', 'YYYY-MM-DD HH24:MI:SS.FF'),'A380','T1','T6');\n`;
      }
    });
  });
}

fs.writeFile("./test.txt", content, (err) => {
  if (err) {
    console.error(err);
  }
  // file written successfully
});
