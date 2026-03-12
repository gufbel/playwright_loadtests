const express = require('express')
const app = express()

app.use(express.json())

app.post('/mock/onfido/applicant', (req, res) => {
  res.json({
    applicantId: 'onfido-applicant-' + Date.now(),
  })
})

app.post('/mock/onfido/verify', (req, res) => {
  res.json({
    status: 'verified',
  })
})

app.listen(3000, () => {
  console.log('Mock Onfido API running on port 3000')
})
