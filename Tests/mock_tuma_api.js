const express = require('express');
const app = express();

app.use(express.json());

const users = {};

app.post('/api/auth/otp', (req, res) => {

  const { phone } = req.body;

  const token = `token-${phone.replace(/\D/g,'')}-${Date.now()}`;

  users[phone] = token;

  res.json({
    accessToken: token,
    tokenType: "Bearer",
    expireIn: 2700
  });

});

app.post('/api/account/otp-sms/verify', (req, res) => {

  const { phoneNumber } = req.body;

  if(users[phoneNumber]){
    return res.json({status:true});
  }

  return res.status(401).json({status:false});

});

app.post('/api/account/otp-email/verify', (req,res)=>{
  res.json({status:true});
});

app.listen(4000, ()=>{

  console.log("Mock Tuma API running on http://localhost:4000")

});
