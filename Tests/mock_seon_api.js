const express = require('express')
const app = express()

app.use(express.json())

app.post('/mock/seon/check', (req, res) => {
  res.json({
    fraud_score: 12,
    status: 'approved',
  })
})

app.listen(6000, () => {
  console.log('Mock SEON API running on port 6000')
})
