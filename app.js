require('dotenv').config()

const express = require('express')
const session = require('express-session')
const request = require('request-promise')

const app = express()

app.use(session({
  secret: 'your_secret_here',
  resave: false,
  saveUninitialized: true
}))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000')
})

// redirect to auth endpoint with query params
app.get('/login', (req, res) => {
  const authEndpoint = 'https://oauth2-provider.com/authorize'

  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI
  })

  const authUrl = `${authEndpoint}?${queryParams}`

  res.redirect(authUrl)
})

// user redirect after authorization
app.get('/callback', async (req, res) => {
  const tokenEndpoint = 'https://oauth2-provider.com/token'

  const { code } = req.query

  const requestBody = {
    grant_type: 'authorization_code',
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.REDIRECT_URI
  }

  const options = {
    method: 'POST',
    uri: tokenEndpoint,
    form: requestBody,
    json: true
  }

  try {
    const response = await request(options)

    req.session.accessToken = response.access_token
    req.session.refreshToken = response.refresh_token

    res.redirect('/user')

} catch (err) {
res.send('Error retrieving access token')
}
})

app.get('/user', async (req, res) => {
  const userEndpoint = 'https://oauth2-provider.com/userinfo'

  const options = {
    headers: {
    Authorization: `Bearer ${req.session.accessToken}`
    },
    json: true
    }

    try {
      const response = await request.get(userEndpoint, options)
      res.send(response)
      } catch (err) {
      res.send('Error retrieving user info')
      }
    })