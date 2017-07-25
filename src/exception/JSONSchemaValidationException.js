class JSONSchemaValidationException {
  constructor (titleKey, bodyKey, extraArguments) {
    let configHolder = {extraArguments: JSON.parse(JSON.stringify({value: extraArguments})).value}

    if (!bodyKey && !extraArguments) {
      configHolder = titleKey
      if (configHolder.e) {
        this.e = configHolder.e
      }
    } else {
      configHolder.titleKey = titleKey
      configHolder.bodyKey = bodyKey
    }

    this.titleKey = configHolder.titleKey
    this.bodyKey = configHolder.bodyKey
    this.scope = configHolder.scope || null
    this.level = configHolder.scope || JSONSchemaValidationException.ERROR

    if (configHolder.extraArguments) {
      this.arguments = configHolder.extraArguments

      if (this.arguments.e) {
        this.e = this.arguments.e
        delete this.arguments.e
      }
    }
  }

  isUnexpected () {
    return this.e !== undefined && (this.e instanceof Error)
  }

  toString () {
    return JSON.stringify(this)
  }
}

JSONSchemaValidationException.prototype.INFO = 'info'
JSONSchemaValidationException.prototype.DEBUG = 'debug'
JSONSchemaValidationException.prototype.ERROR = 'error'
JSONSchemaValidationException.prototype.WARNING = 'warning'

module.exports = JSONSchemaValidationException
