const express = require('express');
const fs = require('fs')

const app = express()
let data = JSON.parse(fs.readFileSync('db/data.json'));

// get all users
app.get('/api/users', (request, response) => {
  response.json(data)
})

// get detail users
app.get('/api/users/:id', (request, response) => {
  const reqId = request.params.id
  const user = data.find(({ id }) => id == reqId)
  response.json(user)
})

// get and generate rewards
app.get('/api/users/:id/rewards', (request, response) => {
  const reqId = request.params.id
  const reqData = request.query.at
  const user = data.find(({ id }) => id == reqId)
  if (user) {
    const rewards = user.rewards.find(({ availableAt }) => availableAt === reqData)
    if (rewards) {
      const filterDate = dateRange(reqData)
      filterDate.pop()
      const resultReward = user.rewards.filter(item => filterDate.includes(item.availableAt));
      response.json(resultReward)
    }
    else {
      response.json(generateRewards(reqId, reqData).rewards)
    }
  }
  else {
    response.json(generateRewards(reqId, reqData).rewards)
  }
})

// redeeem rewards
app.patch('/api/users/:id/rewards/:at/redeem', (request, response) => {
  const reqId = request.params.id
  const reqAt = request.params.at

  fs.readFile('db/data.json', 'utf8', function readFileCallback(err, data) {
    if (err) {
      console.log(err);
    } else {
      obj = JSON.parse(data); 
      existObj = obj.find(({ id }) => id == reqId)
      if (existObj) {
        const rewardsData = existObj.rewards.find(({ availableAt }) => availableAt === reqAt)
        if (rewardsData) {
          if (Date.parse(rewardsData.expiresAt) > new Date() && !rewardsData.redeemedAt) {
            rewardsData.redeemedAt = new Date().toISOString().split('.')[0] + 'Z'
            response.json(rewardsData)
          }
          else{
            response.status(400)
            response.json({ "error": { "message": "This reward is already expired or redeemed" } })
          }
        }
      }
      json = JSON.stringify(obj); 
      fs.writeFile('db/data.json', json, 'utf8', err => {
        if (err) throw err;
        console.log('File saved!');
      }); 
    }
  });
})

// helper function to update json file
function updateFile(newObj) {
  fs.readFile('db/data.json', 'utf8', function readFileCallback(err, data) {
    if (err) {
      console.log(err);
    } else {
      obj = JSON.parse(data); 
      existObj = obj.find(({ id }) => id == newObj.id)
      if (existObj) {
        existObj.rewards.push(...newObj.rewards);
      }
      else {
        obj.push(newObj);
      }
      json = JSON.stringify(obj); 
      fs.writeFile('db/data.json', json, 'utf8', err => {
        if (err) throw err;
        console.log('File saved!');
      }); 
    }
  });
}

// helper function to generate rewards on the fly
function generateRewards(id, at) {
  let result = { "id": parseInt(id) }
  let week = dateRange(at)
  let newRewards = []
  for (let index = 0; index < week.length - 1; index++) {
    let obj = {
      "availableAt": week[index],
      "redeemedAt": null,
      "expiresAt": week[index + 1]
    }
    newRewards.push(obj)
  }
  result.rewards = newRewards

  updateFile(result)
  return result
}


// helper function to return array date range by week
function dateRange(date) {
  const dateObj = new Date(date); 
  const first = dateObj.getDate() - dateObj.getDay(); 

  const firstday = new Date(dateObj.setDate(first));
  const lastday = new Date(dateObj.setDate(firstday.getDate() + 7));

  let result = []
  for (let i = firstday; i <= lastday; i.setDate(i.getDate() + 1)) {
    const dayDate = new Date(i)
    const returnDate = dayDate.toISOString().split('.')[0] + 'Z'
    result.push(returnDate)
  }
  return result
}



const PORT = 3001
app.listen(PORT)
console.log(`Server running on port ${PORT}`)