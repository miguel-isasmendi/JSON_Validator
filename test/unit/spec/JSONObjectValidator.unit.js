const chai = require('chai')
const expect = chai.expect

const JSONSchemaValidationException = require('../../../src/exception/JSONSchemaValidationException')
const Validator = require('../../../src/validator/JSONSchemaValidator')

describe('JSON Schema Object Validator', function () {
  let validator

  beforeEach(() => {
    validator = new Validator()
  })

  it('should be able to be created', function () {
    expect(() => validator = new Validator()).to.not.throw(Error)

    expect(validator).to.not.be.null
  })

  describe('Checking constructor', function () {
    it('should have default values set already', function () {
      expect(validator).to.have.property('objectToValidate').and.to.be.null
      expect(validator).to.have.property('validationSchema').and.to.be.null
      expect(validator).to.have.property('options')
        .and.to.not.be.null
        .and.to.be.deep.equal({
          throwsException: true,
          customAttributesPrefix: '$',
          defaultExceptionMessage: 'ValidationError!!!'
        })
    })

    it('Using constructor with objectToValidate argument', function () {
      let validator = new Validator({value: true})

      expect(validator).to.have.property('objectToValidate').and.to.be.deep.equal({value: true})
      expect(validator).to.have.property('validationSchema').and.to.be.null
      expect(validator).to.have.property('options').and.to.not.be.null
    })

    it('Using constructor with objectToValidate and validationSchema', function () {
      let validator = new Validator({value: true}, {value: false})

      expect(validator).to.have.property('objectToValidate').and.to.be.deep.equal({value: true})
      expect(validator).to.have.property('validationSchema').and.to.be.deep.equal({value: false})
      expect(validator).to.have.property('options').and.to.not.be.null
    })

    it('Using constructor with options', function () {
      let options = {custom: true}
      let validator = new Validator({value: true}, {value: false}, options)

      expect(validator).to.have.property('objectToValidate').and.to.be.deep.equal({value: true})
      expect(validator).to.have.property('validationSchema').and.to.be.deep.equal({value: false})
      expect(validator).to.have.property('options').and.to.be.equal(options)
    })
  })

  describe('Checking validations throwing exceptions', function () {

    beforeEach(() => {
      validator = new Validator({
        data: 'some value'
      },
      {
        data: String
      })
    })

    it('should return as valid', function () {
      validator.options.throwsException = false
      expect(validator.validate()).to.be.equal(true)
    })

    it('should throw an exception for empty schema', function () {
      validator.objectToValidate = {}
      validator.validationSchema = {}
      expect(() => validator.validate()).to.throw(JSONSchemaValidationException)
    })

    it('should throw an exception for null schema', function () {
      validator.validationSchema = null
      expect(() => validator.validate()).to.throw(JSONSchemaValidationException)
    })

    it('should throw an exception for null object to validate', function () {
      validator.validationSchema = {}
      validator.objectToValidate = null
      expect(() => validator.validate()).to.throw(JSONSchemaValidationException)
    })

    it('should throw an exception with default configuration schema', function () {
      validator.validationSchema = {}
      validator.objectToValidate = {}
      expect(() => validator.validate())
        .to.throw(JSONSchemaValidationException)
        .and.to.have.property('titleKey')
        .and.be.equal('Validation Error')
    })

    it('should throw an exception with non existent attribute on the object', function () {
      validator.validationSchema = { validAttribute: String, $strict: true }

      validator.objectToValidate = {}
      expect(() => validator.validate())
        .to.throw(JSONSchemaValidationException)
        .and.to.have.property('titleKey')
        .and.be.equal('Validation Error')

      validator.objectToValidate = { attribute: 'value', $strict: true}
      expect(() => validator.validate())
        .to.throw(JSONSchemaValidationException)
        .and.to.have.property('titleKey')
        .and.be.equal('Validation Error')
    })

    it('should validate without throw an exception', function () {
      validator.validationSchema = { validAttribute: String }

      validator.objectToValidate = { validAttribute: 'value' }
      expect(() => validator.validate())
        .to.not.throw(JSONSchemaValidationException)
    })
  })
})
