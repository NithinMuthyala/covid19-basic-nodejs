const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
let db;
const dbpath = path.join(__dirname, "covid19India.db");
const initializedb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3020, () => {
      console.log("Server is Running at ........");
    });
  } catch (e) {
    console.log("DB:ERROR");
  }
};
initializedb();

const convertsnakecasetocamel = (eachobject) => {
  return {
    stateId: eachobject.state_id,
    stateName: eachobject.state_name,
    population: eachobject.population,
  };
};

app.get("/states/", async (request, response) => {
  const dbquery = `SELECT 
                     state_id ,
                     state_name ,
                     population
                     FROM
                      state
                      ORDER BY state_id;`;
  const stateslist = await db.all(dbquery);
  const converted = stateslist.map((eachobj) => {
    return convertsnakecasetocamel(eachobj);
  });
  console.log(converted);
  response.send(converted);
});

// api2 gettin particular state

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const dbquery = `SELECT 
                        * 
                    FROM 
                    state 
                    WHERE state_id = ${stateId};`;
  const dbresponse = await db.get(dbquery);

  response.send(convertsnakecasetocamel(dbresponse));
});

// api3 creating a district post

app.post("/districts/", async (request, response) => {
  const districtdetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtdetails;
  const dbquery = `INSERT
                        INTO 
                        district(district_name,state_id,cases,cured,active,deaths)
                        VALUES("${districtName}",${stateId},${cases},${cured},${active},${deaths})`;
  const dbresponse = await db.run(dbquery);
  response.send("District Successfully Added");
});

//api 4 get details based on district_id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dbquery = `SELECT
                     district_id as districtId,
                     district_name as districtName,
                     state_id as stateId,
                     cases as cases,
                     cured as cured,
                     active as active,
                     deaths as deaths
                      FROM 
                     district 
                     WHERE district_id = ${districtId};`;
  const dbresponse = await db.get(dbquery);

  response.send(dbresponse);
});

// api 5 delete district based on id
app.delete("/districts/:districtId/", (request, response) => {
  const { districtId } = request.params;
  const dbquery = `DELETE FROM district WHERE district_id = ${districtId}`;
  const dbresponse = db.run(dbquery);
  response.send("District Removed");
});

// api6 update details on distritid

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtdetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtdetails;
  const dbquery = `UPDATE 
                    district 
                    SET 
                    district_name = "${districtName}",
                    state_id = ${stateId},
                    cases = ${cases},
                    cured = ${cured},
                    active = ${active},
                    deaths = ${deaths};`;
  const dbresponse = await db.run(dbquery);
  response.send("District Details Updated");
});

// api7 get total sum of cases ,cured ,.....

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  console.log(stateId);
  const dbquery = `SELECT
                        sum(cases) as totalCases,
                        sum(cured) as totalCured,
                        sum(active) as totalActive,
                        sum(deaths) as totalDeaths
                        FROM
                        district 
                       WHERE state_id = ${stateId};`;
  const dbresponse = await db.get(dbquery);

  response.send(dbresponse);
});

// return statename baseon id

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const dbquery = ` SELECT 
                        state_name as stateName
                        FROM 
                        state NATURAL JOIN district
                         
                         WHERE district_id = ${districtId};`;
  const dbresponse = await db.get(dbquery);
  console.log(dbresponse);
  response.send(dbresponse);
});

module.exports = app;
