import express from 'express';
import { createClient } from 'redis';
import moment from 'moment';

import 'dotenv/config';

const app = express()
const port = 3000

const client = createClient({url: `redis://${process.env.CACHE_USER}:${process.env.CACHE_PASSWORD}@${process.env.CACHE_HOST}:${process.env.CACHE_PORT}`});

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

app.get('/',async (req, res) => {
  let user = req.headers.host || 'none';
  let checkUser = await client.exists(user)

  // User not exist
  if(checkUser == 0){
    let body = {
        'count': 1,
        'startTime': moment().unix()
      }
    client.set(user,JSON.stringify(body))
  }

  if(checkUser == 1){
    // user exists
    let reply = await client.get(user)
    let data = JSON.parse(reply)
    let currentTime = moment().unix()
    console.log(data.startTime);
    let difference = (currentTime - data.startTime)/60
    if(difference >= 1) {
      let body = {
        'count': 1,
        'startTime': moment().unix()
      }
      client.set(user,JSON.stringify(body))
      // allow the request
      res.send('new')
    }
    if(difference < 1) {
      if(data.count > 3) {
        return res.json({"error": 1, "message": "throttled limit exceeded..."})
      }
      // update the count and allow the request
      data.count++

      client.set(user,JSON.stringify(data))
      res.send(String(data.count))
    }
  }


  
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})