
const redis = require('redis')
const { promisify } = require('util')

const config = {
  instanceId: generateMessage(),
  errorQueue: 'errorQueue',
  messageQueue: 'messageQueue',
  publisherKey: 'publisher',
  redisPort: '6379' || process.env.PORT,
  redisHost: 'redis' || process.env.HOST
}

const client = redis.createClient(config.redisPort, config.redisHost)

// Promisify all necessary redis commands
const brpopAsync = promisify(client.brpop).bind(client)
const setAsync = promisify(client.set).bind(client)
const getAsync = promisify(client.get).bind(client)
const lpushAsync = promisify(client.lpush).bind(client)
const lrangeAsync = promisify(client.lrange).bind(client)
const delAsync = promisify(client.del).bind(client)

if (process.env.getErrors) {
  (async () => {
    await checkErrors()
    process.exit(0)
  })()
} else {
  startConsuming()
}

function startConsuming () {
  console.log('Try consuming')
  const timerId = setInterval(async () => {
    const currentPublisherId = await getAsync(config.publisherKey)
    if (currentPublisherId == null) {
      console.log('Publisher is gone')
      clearInterval(timerId)
      await startPublishing()
      return
    }
    if (config.instanceId === currentPublisherId) {
      console.log('Oops, I am publisher')
      clearInterval(timerId)
      return
    }
    const response = await brpopAsync(config.messageQueue, 1)
    if (!Array.isArray(response) && JSON.parse(response) === null) {
      console.log('MessageQueue is empty')
      clearInterval(timerId)
      await startPublishing()
      return
    }
    console.log(`Received message from messageQueue: ${JSON.parse(response[1])}`)
    if (Math.random() > 0.95) {
      console.log(`Found error: ${JSON.parse(response[1])}`)
      await lpushAsync('errorQueue', response[1])
    }
  }, 500)
}

async function startPublishing () {
  console.log('Try publishing')
  if (await checkPublisher()) {
    console.log('I am Publisher')
    setInterval(async () => {
      await setAsync(config.publisherKey, config.instanceId, 'PX', 1000)
      const message = generateMessage()
      await lpushAsync('messageQueue', JSON.stringify(message))
      console.log(`Send message to messageQueue: ${message}`)
    }, 500)
  } else {
    startConsuming()
  }
}

async function checkErrors () {
  console.log('Getting errors from errorQueue')
  const messages = await lrangeAsync(config.errorQueue, 0, -1)
  if (Array.isArray(messages) && messages.length !== 0) {
    messages.forEach((message, index) => {
      console.log(`Message from errorQueue #${index}`, JSON.parse(message))
    })
    await delAsync(config.errorQueue)
    console.log(`That's all, Bye!`)
  } else {
    console.log('No errors so far')
  }
}

async function checkPublisher () {
  const isSet = await setAsync(config.publisherKey, config.instanceId, 'PX', 1500, 'NX')
  const isPublisher = isSet === 'OK'
  console.log('Am I publisher?', isPublisher)
  return isPublisher
}

function generateMessage () { // Not collision-safe, just for no use of 3rd-p libs
  return Math.random().toString(36).replace(/[^a-z]+/g, '')
}
