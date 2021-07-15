import chai from 'chai'

chai.should()

describe('Index', () => {
  describe('constructor', () => {
    it('should NOT throw', () => {})
  })

  describe('.say', () => {
    it('should be equal true', () => {
      ('Hello World').should.to.be.equal('Hello World')
    })
  })
})
