import { Body, ContentType, Controller, Get, Header, Post, UseBefore } from '../../src'

@Controller('/users', { json: true })
export default class {
  constructor() {
    console.log('user instanced')
  }

  @Get('')
  user_list() {
    return ['????']
  }

  @Post('')
  new_user(@Body() user: any) {
    return user
  }
}
