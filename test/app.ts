import 'reflect-metadata'
import { resolve } from 'path'
import { createServer } from '../src'

const app = createServer({
  controllers: [
    resolve(__dirname, './routes/*.ts')
  ],
  middlewares: [
    resolve(__dirname, './middlewares/*.ts')
  ]
})
app.listen(3000, '0.0.0.0', () => {
  console.log('express app started')
})
