/* eslint no-throw-literal: 1 */
const AppException = require('../exception/JSONSchemaValidationException')

/**
Schema example:

{
  $strict: true,
  stringAttribute: {
    $optional: false,
    $exceptionMessage: stringOrFunction
    $exceptionBuilder: function,
    $type: 'string',
    $childsDef: {
      ...
    },
    $maxLength: {
      $value: numberOrFunction,
      $exceptionMessage: stringOrFunction
      $exceptionBuilder: function
    },
    $minLength: {
      $value: numberOrFunction,
      $exceptionMessage: stringOrFunction
      $exceptionBuilder: function
    },
    $in: {
      $value: arrayOrFunction,
      $exceptionMessage: stringOrFunction
      $exceptionBuilder: function
    },
    $contains: {
      $value: objectOrFunctionOrRegex,
      $exceptionMessage: stringOrFunction
      $exceptionBuilder: function
    }
  }
}
*/
class JSONObjectValidator {
  constructor (objectToValidate, validationSchema, options) {
    this.objectToValidate = objectToValidate || null
    this.validationSchema = validationSchema || null
    this.initOptions(options)
  }

  initOptions (options) {
    this.options = options || this.options || {}
    this.options.throwsException = this.options.throwsException || true
    this.options.customAttributesPrefix = this.options.customAttributesPrefix || '$'
    this.options.defaultExceptionTitle = this.options.defaultExceptionTitle || 'Validation Error'
    this.options.defaultExceptionBody = this.options.defaultExceptionBody || 'Validation Error'
    this.options.exceptionBuilder = this.options.exceptionBuilder || this.buildExceptionFor
  }

  buildExceptionFor (exceptionArguments) {
    exceptionArguments.titleKey = exceptionArguments.titleKey || this.options.defaultExceptionTitle
    exceptionArguments.bodyKey = exceptionArguments.bodyKey || this.options.defaultExceptionBody

    return new AppException(exceptionArguments)
  }

  validate () {
    let contextArguments = { actualPath: '', parentValidationObject: null, parentValidationSchema: null }

    try {
      this.doValidateSchema(this.validationSchema)

      if (!this.objectToValidate) {
        throw new Error('Should have objectToValidate')
      }

      this.initOptions()

      this.doValidate(this.objectToValidate, this.validationSchema, contextArguments)
    } catch (e) {
      if (this.options.throwsException) {
        throw this.options.exceptionBuilder.call(this, {e: e, extraArguments: contextArguments})
      }

      return false
    }
    return true
  }

  doValidateSchema (schema) {
    // TODO validate schema in depth
    if (!schema || Object.keys(schema).length === 0) {
      throw new Error('Should have validationSchema')
    }
  }

  extractTypeFromObject (value) {
    if (value === String || typeof value === 'string') {
      return 'string'
    }

    if (value === Boolean || value instanceof Boolean || typeof value === 'boolean') {
      return 'boolean'
    }

    if (value === Number || !isNaN(value)) {
      return 'number'
    }

    if (value === Array || Array.isArray(value)) {
      return 'array'
    }

    if (value === Object || value instanceof Object || typeof value === 'object') {
      return 'object'
    }

    return Object.prototype.toString.call(value).match(/(\[object\s)(.*)(\])/)[2]
  }

  hasValidType (objectToValidate, type) {
    let checkTypeMap = {}

    checkTypeMap.object = value => value instanceof Object || typeof value === 'object'
    checkTypeMap[Object] = checkTypeMap.object

    checkTypeMap.string = value => value instanceof String || typeof value === 'string'
    checkTypeMap[String] = checkTypeMap.string

    checkTypeMap.boolean = value => value instanceof Boolean || typeof value === 'boolean'
    checkTypeMap[Boolean] = checkTypeMap.string

    checkTypeMap.number = value => !isNaN(value)
    checkTypeMap[Number] = checkTypeMap.number

    checkTypeMap.array = value => Array.isArray(value)
    checkTypeMap[Array] = checkTypeMap.array

    let calculatedType = this.extractTypeFromObject(objectToValidate)
    return calculatedType ? checkTypeMap[calculatedType].call(this, objectToValidate) : false
  }

  doValidate (objectToValidate, schemaToValidate, genericArguments) {
    genericArguments.validatedObject = objectToValidate
    genericArguments.validatedSchema = schemaToValidate

    let actualPath = genericArguments.actualPath
    let schemaDefinedType = schemaToValidate[`${this.options.customAttributesPrefix}type`] || schemaToValidate
    let domainAttributeKeys = Object.keys(schemaToValidate).filter(key => key.indexOf(this.options.customAttributesPrefix) !== 0)

    // TODO check if the object has optional attributes
    if (!objectToValidate && !schemaToValidate.optional) {
      throw {
        'titlekey': schemaToValidate[`${this.options.customAttributesPrefix}titleKey`] || `Attribute at "${actualPath}" does not exists as it's defined on ${JSON.stringify(genericArguments.parentValidationSchema)}`,
        'bodyKey': schemaToValidate[`${this.options.customAttributesPrefix}bodyKey`]
      }
    }

    if (!this.hasValidType(objectToValidate, schemaDefinedType)) {
      throw {
        'titlekey': 'Object has invalid type',
        'bodyKey': `Type validation failed between schema's: ${JSON.stringify(schemaDefinedType)} and json object's type: ${objectToValidate}`
      }
    }

    if (schemaToValidate[`${this.options.customAttributesPrefix}strict`] === true && this.hasValidType(objectToValidate, Object) && this.hasValidType(schemaToValidate, Object) && domainAttributeKeys.length !== Object.keys(objectToValidate).length) {
      throw {
        'titlekey': 'Strict keys length validation failed',
        'bodyKey': `Strict keys length validation failed between schema's keys: ${JSON.stringify(domainAttributeKeys)} and json object's keys: ${JSON.stringify(Object.keys(objectToValidate))}`
      }
    }

    // Starting child validation

    if (this.hasValidType(objectToValidate, Array)) {
      let childsDef = schemaToValidate[`${this.options.customAttributesPrefix}childsDef`]

      for (let j = 0; j < objectToValidate.length; j++) {
        genericArguments.parentValidationObject = objectToValidate
        genericArguments.parentValidationSchema = childsDef
        genericArguments.actualPath = `${actualPath}.${j}`

        this.doValidate(objectToValidate[j], childsDef, genericArguments)
      }
    } else if (this.hasValidType(objectToValidate, Object)) {
      for (let j = 0; j < domainAttributeKeys.length; j++) {
        genericArguments.parentValidationObject = objectToValidate
        genericArguments.parentValidationSchema = schemaToValidate

        let domainAttributeKey = domainAttributeKeys[j]
        let schemaValue = schemaToValidate[domainAttributeKey]
        if (schemaValue) {
          let objectValue = objectToValidate[domainAttributeKey]

          genericArguments.actualPath = `${actualPath}.${domainAttributeKey}`
          this.doValidate(objectValue, schemaValue, genericArguments)
        }
      }
    }
  }
}

module.exports = JSONObjectValidator
