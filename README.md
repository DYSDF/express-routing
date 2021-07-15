# express-routings

Allows to create controller classes with methods as actions that handle express requests.

## Installation

1. Install module:
  ```shell
  npm i express-routings
  ```

2. Install `reflect-metadata`
  ```shell
  npm install reflect-metadata
  ```

3. Make sure `reflect-metadata` to import before `express-routings`

```typescript
import 'reflect-metadata'
```

## Usage

### Example of usage

1. Create a file `UserController.ts`

   ```typescript
   import { Controller, Param, Body, Get, Post, Put, Delete } from 'express-routings';

   @Controller()
   export class UserController {
     @Get('/users')
     getAll() {
       return 'This action returns all users';
     }

     @Get('/users/:id')
     getOne(@Param('id') id: number) {
       return 'This action returns user #' + id;
     }

     @Post('/users')
     post(@Body() user: any) {
       return 'Saving user...';
     }

     @Put('/users/:id')
     put(@Param('id') id: number, @Body() user: any) {
       return 'Updating a user...';
     }

     @Delete('/users/:id')
     remove(@Param('id') id: number) {
       return 'Removing user...';
     }
   }
   ```

   This class will register routes specified in method decorators in express.js framework.

2. Create a file `app.ts`

   ```typescript
   import 'reflect-metadata'
   import { createServer } from 'routing-controllers';
   import { UserController } from './UserController';

   const app = createServer({
     controllers: [UserController], // we specify controllers we want to use
   });

   // run express application on port 3000
   app.listen(3000);
   ```
