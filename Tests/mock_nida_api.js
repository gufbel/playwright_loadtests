const express = require('express');
const app = express();

app.use(express.json());

app.post('/nida/verify',(req,res)=>{

  const { nidaNumber } = req.body;

  const database = {

    "19901234567890123456":{
      firstName:"John",
      lastName:"Doe",
      gender:"Male"
    },

    "19901234567890123457":{
      firstName:"Alice",
      lastName:"Smith",
      gender:"Female"
    },

    "19901234567890123458":{
       firstName:"Bob",
       lastName:"Brown",
       gender:"Male"
    },
    
    "19901234567890123459":{
       firstName:"Robby",
       lastName:"Browny",
       gender:"Male"
    }
  }

  if(database[nidaNumber]){

    return res.json({
      status:"OK",
      ...database[nidaNumber]
    });

  }

  res.json({
    status:"FAILED"
  });

});

app.listen(3000,()=>{

  console.log("Mock NIDA API running http://localhost:3000")

});
