// work in progress
module.exports = evaluator

let env = {
  '+': (args) => { return args.reduce((a, b) => a * 1 + b * 1) },
  '-': (args) => { return args.reduce((a, b) => a * 1 - b * 1) },
  '*': (args) => { return args.reduce((a, b) => (a * 1) * (b * 1)) },
  '/': (args) => { return args.reduce((a, b) => a * 1 / b * 1) },
  '>': (args) => { return args.reduce((a, b) => a * 1 > b * 1) },
  '<': (args) => { return args.reduce((a, b) => a * 1 < b * 1) },
  '>=': (args) => { return args.reduce((a, b) => a * 1 >= b * 1) },
  '<=': (args) => { return args.reduce((a, b) => a * 1 <= b * 1) },
  '===': (args) => { return args.reduce((a, b) => a * 1 === b * 1) },
  'pi': 3.14159,
  'abs': (x) => { return Math.abs(x) },
  'append': (args) => { return args.reduce((a, b) => a + b) },
  'apply': function lambda (proc, args) { return proc(...args) },
  'begin': function lambda (...x) { return x[-1] },
  'car': function lambda (x) { return x[0] },
  'cdr': function lambda (x) { return x.slice(1) },
  'cons': function lambda (x, y) { return x.split(' ').concat(y) },
  'equal?': function (a, b) { return a * 1 === b * 1 },
  'list': function lambda (elements) { return elements.split(' ') }
}

let props = Object.keys(env)
let arithmeticOperators = ['+', '-', '*', '/', '>', '<', '>=', '<=', '===']
let envFunctions = ['abs', 'append', 'apply', 'begin', 'car', 'cdr', 'cons', 'equal?', 'list']

let readline = require('readline')
let rl = readline.createInterface(process.stdin, process.stdout)
rl.setPrompt('> ')
rl.prompt()
rl.on('line', function (input) {
  if (input === 'exit') rl.close()
  let evaluated = evaluator(input.toString())
  console.log('final', evaluated)
  rl.prompt()
}).on('close', function () {
  process.exit(0)
})

let factoryParser = function (...parsers) {
  // console.log('factory parser input', ...parsers)
  return input => {
    let spaceCheck
    input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
    for (let parser of parsers) {
      let result = parser(input)
      if (result !== null) return result
    }
    return null
  }
}

// Block of parsers -----------------------------------------------------------------------------------------------------------------------------------------------------
// let numberParser = (input, num, regEx = /^(-?(0|[1-9]\d*))(\.\d+)?(((e)(\+|-)?)\d+)?/ig) => (num = input.match(regEx)) ? [num[0] * 1] : null
let numberParser = (input, num, regEx = /^(-?(0|[1-9]\d*))(\.\d+)?(((e)(\+|-)?)\d+)?/ig) => (num = input.match(regEx)) ? [num[0] * 1, input.slice(num[0].length)] : null

let symbolParser = input => {
  console.log('symbolParser input', input)
  let remaining = ''
  let actual = ''
  if (!input.startsWith("'")) return null
  let inputRaw = input.substr(1)
  for (let i = 1; i < inputRaw.length; i++) {
    if (inputRaw.charAt(i) === "'" && inputRaw.charAt(i - 1) !== '\\') {
      actual = inputRaw.slice(0, i + 1).slice(0, -1)
      remaining = inputRaw.slice((i + 1))
      break
    }
    if (/\\/.test(inputRaw.charAt(i)) && /\\/.test(inputRaw.charAt(i - 1)) && /'/.test(inputRaw.charAt(i + 1))) {
      if (inputRaw.charAt(i - 2) === '\\') continue
      actual = "\\'"
      remaining = inputRaw.slice(i + 2)
      break
    }
  }
  if (/\\\\'/.test(actual)) return [actual, remaining]
  if (inputRaw.charAt(0) === '"') {
    actual = ''
    remaining = inputRaw.slice(1)
    return [actual, remaining]
  }
  for (let i = 1; i < actual.length; i++) {
    if (actual.charAt(i) === '\\') {
      let slashCheck = (actual.charAt(i + 1) === "'") || actual.charAt(i + 1) === '\\' || actual.charAt(i + 1) === '/' ||
      actual.charAt(i + 1) === 'b' || actual.charAt(i + 1) === 'f' || actual.charAt(i + 1) === 'n' ||
      actual.charAt(i + 1) === 'n' || actual.charAt(i + 1) === 'r' || actual.charAt(i + 1) === 't' || actual.charAt(i + 1) === 'u'
      if (slashCheck === false) return null
      if (actual.charAt(i + 1) === 'u') {
        let hexCheck = actual.slice(i + 1, i + 6)
        for (let i = 0; i < hexCheck.length; i++) {
          if (/u(\d|[A-F]){4}/i.test(hexCheck) !== true) return null
        }
      }
    }
  }
  return [actual, remaining]
}

let listParser = input => {
  console.log('list parser input', input)
  if (!input.startsWith('[')) return null
  input = input.substr(1)
  let returnArray = []
  while (!input.startsWith(']')) {
    let spaceCheck
    input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
    let result1 = valueParser(input)
    if (!result1) { continue } returnArray.push(result1[0])
    input = result1[1]
    input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
    let result = commaParser(input)
    if (!result) continue
    if (result[1].match(/^\s*]\s*/)) return null
    input = result[1]
  }
  return [returnArray, input.slice(1)]
}
// Identifier Parser ------------------------------------------------------------------------------------------
let identifierParser = (inputArray) => {
  console.log('identifierInput', inputArray)
  if (inputArray[0] === 'define') {
    return definitionInterpreter(inputArray)
  }
  if (inputArray[0] === 'if') {
    return conditionalInterpreter(inputArray)
  }

  if (inputArray[0] === 'quote') {
    return quotationInterpreter(inputArray)
  }

  if (env.hasOwnProperty(inputArray[0])) {
    if (arithmeticOperators.includes(inputArray[0])) {
      console.log('arithmetic input', inputArray)
      return arithmeticEvaluator(inputArray)
    } else if (envFunctions.includes(inputArray[0])) {
      if (inputArray[0] === 'list') return inputArray.slice(1)
      if (inputArray[0] === 'car' || inputArray[0] === 'cdr') {
        let proc = inputArray[0]
        let args = inputArray[1]
        let rem = ''
        for (let i = 0; i < args.length; i++) {
          if (args[i] === '[' || args[i] === ']') continue
          rem = rem + args[i]
        }
        rem = rem.trim()
        console.log('rem', rem)
        inputArray = proc.split(' ').concat(rem.split(','))
        console.log('inputArray car, cdr', inputArray)
      }
      if (inputArray[0] === 'equal?') {
        let a = expressionParser(inputArray[1])
        let b = expressionParser(inputArray[2])
        if ((typeof (a)) === 'object') a = a[0]
        if ((typeof (b) === 'object')) b = b[0]
        console.log('a', a)
        console.log('b', b)
        let result = env['equal?'](a, b)
        console.log('equal? result', result)
        return result
      }
    }
    let evalExp = lambdaEvaluate(inputArray)
    console.log('evalExp', evalExp)
    return evalExp
  }

  return arithmeticEvaluator(inputArray)
}

// Quotation Interpreter -------------------------------------------------------------------------------------
let quotationInterpreter = (inputArray) => {
  inputArray = inputArray.slice(1)
  console.log('quote sliced inputArray', convertToString(inputArray))
  return convertToString(inputArray)
}

// ----

function convertToString (inputArray) {
  console.log('convertToString input', inputArray)
  let convertedString = ''
  if (inputArray.length === 1 && (inputArray[0].startsWith('[') && inputArray[0].endsWith(']'))) return inputArray[0]
  for (let i = 0; i < inputArray.length; i++) {
    console.log('input Array element', inputArray[i])
    if ((typeof (inputArray[i])) === 'object') {
      convertedString = convertedString + ' ' + '[' + inputArray[i] + ']'
    } else convertedString = convertedString + ' ' + inputArray[i]
  }
  convertedString = convertedString.trim()
  console.log('convertedString', convertedString)

  return convertedString
}

// Conditional Interpreter -----------------------------------------------------------------------------------
let conditionalInterpreter = (inputArray) => {
  console.log('conditional input', inputArray)
  inputArray = inputArray.slice(1)
  console.log('inputArray without if', inputArray)
  inputArray.reverse()
  let altRemaining
  let altLength
  let conseqRemaining
  let conseqLength
  console.log('reversed inputArray', inputArray)
  let alt = nestedExpression(inputArray)
  console.log('alt', alt)
  if (alt[2] === 'simple') {
    altRemaining = alt[1].trim().split(' ')
    console.log('remaining of alt', altRemaining)
    if ((typeof alt[0]) === 'object') alt = alt[0]
    else alt = alt[0]
  } else {
    if ((typeof (alt) === 'number')) altLength = 1
    else altLength = alt.length
    altRemaining = inputArray.slice(altLength)
  }
  console.log('final alt', alt)
  let conseq = nestedExpression(altRemaining)
  console.log('conseq', conseq)
  if (conseq[2] === 'simple') {
    conseqRemaining = conseq[1].trim().split(' ')
    console.log('remaining of conseq', conseqRemaining)
    if ((typeof conseq[0]) === 'object') conseq = conseq[0]
    else conseq = conseq[0]
  } else {
    if ((typeof (conseq) === 'number')) conseqLength = 1
    else conseqLength = conseq.length
    console.log('conseq length', conseqLength)
    conseqRemaining = inputArray.slice(altLength + conseqLength)
  }
  console.log('final conseq', conseq)
  let condition = nestedExpression(conseqRemaining)
  console.log('cond', condition)
  if (condition[2] === 'simple') {
    if ((typeof condition[0]) === 'object') condition = condition[0]
    else condition = condition[0]
    console.log('cond1', condition)
  }

  let isCondition = expressionParser(convertToString(condition))
  console.log('isCondition', isCondition)
  if (isCondition !== false) {
    let evalConseq = expressionParser(convertToString(conseq))
    console.log('evalConseq', evalConseq)
    return evalConseq
  }
  let evalAlt = expressionParser(convertToString(alt))
  console.log('evalAlt', evalAlt)
  return evalAlt
}

function nestedExpression (inputArray) {
  console.log('nested expression', inputArray)
  let expression
  let closeBracePos = []
  let closeIndex = 0
  let closeLastEle
  if (inputArray[0] !== ')') {
    expression = expressionParser(convertToString(inputArray))
    console.log('expression', expression)
    if (expression.length === 2) {
      expression[2] = 'simple'
      return expression
    }
    return expression
  }
  for (let i = 0; i <= inputArray.length; i++) {
    if (inputArray[i] === ')') {
      closeBracePos[closeIndex++] = i
      console.log('closeBracePos', closeBracePos)
      closeLastEle = closeBracePos[closeBracePos.length - 1]
      console.log('closeLastEle', closeLastEle)
      continue
    }
    if (inputArray[i] === '(') {
      if (closeBracePos.length > 1) {
        closeBracePos = closeBracePos.slice(0, --closeIndex)
        closeLastEle = closeBracePos[closeBracePos.length - 1]
        console.log('closeLastEle', closeLastEle)
        console.log('position of open', i)
        console.log('sliced closeBracePosition', closeBracePos)
      } else {
        console.log('position of open1', i)
        expression = inputArray.slice(closeLastEle, i + 1)
        expression.reverse()
        console.log('sliced reversed expression', expression)
        return expression
      }
    }
  }
}

function simpleExpression (inputArray) {
  console.log('simple expression', inputArray)
  let openBracePos = []
  let openIndex = 0
  let closeBracePos = []
  let closeIndex = 0
  let i = 0
  if (inputArray[0] !== '(') i = 1
  else i = 0
  for (i; i < inputArray.length; i++) {
    if (inputArray[i] === '(') {
      openBracePos[openIndex++] = i
      console.log('openBracePos, openIndex', openBracePos, openIndex)
    }
    if (inputArray[i] === ')') {
      closeBracePos[closeIndex++] = i
      console.log('closeBracePos, k', closeBracePos, closeIndex)
      if (closeBracePos[closeIndex - 1] - openBracePos[openIndex - 1] === 4) {
        return [inputArray.slice(openBracePos[openIndex - 1], closeBracePos[closeIndex - 1] + 1), openBracePos[openBracePos.length - 1], closeBracePos[closeBracePos.length - 1]]
      }
      return [inputArray.slice(openBracePos[openIndex - 1], closeBracePos[closeIndex - 1] + 1), openBracePos[openBracePos.length - 1], closeBracePos[closeBracePos.length - 1]]
    }
  }
}

// definition parser ------------------------------------------------------------------------------------------
let definitionInterpreter = (inputArray) => {
  console.log('defineInput', inputArray)
  let value = inputArray.slice(2)
  console.log('value', value)
  let functionName = inputArray[1]
  console.log('functionName', functionName)
  if (props.includes(functionName)) return 'cannot update'
  if (value[1] === 'lambda') {
    let lambda = lambdaUpdate(value)
    console.log('received lambda', lambda)
    env[functionName] = lambda
    console.log('env', env)
    props = Object.keys(env)
    console.log('new keys', props)
    return 'Global environment updated'
  }
  console.log('not lambda')
  let finalResult = expressionParser(convertToString(value))
  console.log('finalResult', finalResult)
  if (finalResult === null) {
    if (env.hasOwnProperty(convertToString(value))) {
      if (envFunctions.includes(convertToString(value))) finalResult = convertToString(value)
      else finalResult = env[convertToString(value)]
      console.log('finalResult', finalResult)
    }
  } else if (typeof (finalResult) === 'object') {
    finalResult = finalResult[0]
    console.log('finalResult1', finalResult)
  } else return null
  env[`${inputArray[1]}`] = finalResult
  console.log('env', env)
  return 'Global Object successfully updated'
}

// lambda ---------------------------------------------------------------------------------------------------------
let lambdaUpdate = (input) => {
  console.log('lambda input', input)
  input = input.slice(1, input.length - 1)
  console.log('sliced input', input)
  let argOpenBrace = 0
  let argCloseBrace = 0
  for (let i = 1; i < input.length; i++) {
    if (input[i] === '(') argOpenBrace = i
    console.log('argOpenBrace', argOpenBrace)
    if (input[i] === ')') {
      argCloseBrace = i
      console.log('argCloseBrace', argCloseBrace)
      break
    }
  }
  let param = input.slice(argOpenBrace + 1, argCloseBrace)
  console.log('parameters', param)
  let expression = input.slice(argCloseBrace + 1)
  console.log('expression', expression)

  let local = {}
  local['localEnv'] = env
  local['args'] = {}
  for (let i = 0; i < param.length; i++) {
    local.args[[param[i]]] = null
  }
  local['eval'] = expression
  console.log('localEnv', local)
  return local
}

let lambdaEvaluate = (inputArray) => {
  let proc = inputArray[0]
  console.log('procedure', proc)
  let result
  let toEval
  if (envFunctions.includes(proc)) toEval = inputArray.slice()
  if (typeof (env[proc]) !== 'object') toEval = inputArray.slice()
  else toEval = env[proc].eval.slice()
  console.log('expression to evaluate', toEval)

  let params = inputArray.slice(1)
  console.log('parameters', params)

  let local = env[proc]
  console.log('outer', local)
  if (typeof (local) !== 'object' && envFunctions.includes(local)) {
    result = identifierParser([local, convertToString(params)])
    console.log('result', result)
    return result
  }
  let parsedParams = ''
  let evalParams = []
  let index = 0
  params = convertToString(params)
  while (params.length !== 0) {
    parsedParams = expressionParser(params)
    console.log('parsed params', parsedParams)
    if (parsedParams !== null) {
      if (typeof (parsedParams) === 'object' && parsedParams.length > 2) {
        evalParams[index++] = parsedParams
        break
      }
      evalParams[index++] = parsedParams[0]
      console.log('evalParams in loop', evalParams)
      if (!parsedParams[1]) break
      params = parsedParams[1]
      console.log('new params', params)
    }
  }
  console.log('evalParams', evalParams)
  // if (evalParams.length < 1) return
  if (typeof (evalParams) !== 'object') {
    evalParams = evalParams.toString().split(' ')
    console.log('evalParamsArray', evalParams)
  }
  if ((typeof env[proc]) === 'function') {
    return env[proc](evalParams)
  }

  let keys = Object.keys(env[proc].args)
  console.log('keys', keys)
  for (let i = 0; i < keys.length; i++) {
    for (let ele in env[proc].args) {
      if (ele === keys[i]) {
        env[proc].args[ele] = evalParams[i]
      }
    }
  }
  let variable = /[A-Z]/i
  console.log('added local env', env)
  for (let key in env[proc].args) {
    for (let i = 0; i < toEval.length; i++) {
      if (toEval[i] === key) {
        toEval[i] = env[proc].args[key]
        console.log('mapped', env[proc].eval[i])
      }
      if (variable.test(toEval[i])) {
        console.log('yes', toEval[i])
        if (env.hasOwnProperty(toEval[i]) && (toEval[i] !== proc)) {
          if (local.hasOwnProperty(toEval[i] === false)) toEval[i] = env[toEval[i]]
        }
      }
    }
  }

  console.log('toEval', toEval)
  console.log('updated local env1', env)

  // send eval to sExpression parser
  result = sExpressionParser(convertToString(toEval))
  console.log('evaluated result', result)
  return result
}

// arithmetic evaluator ------------------------------------------------------------------------------------------
let arithmeticEvaluator = (inputArray) => {
  console.log('eval', inputArray)
  let key
  let finalResult
  let expression
  // if (!arithmeticOperators.includes(inputArray[0])) return 'error'
  for (let i = 0; i < inputArray.length; i++) {
    if (arithmeticOperators.includes(inputArray[i])) continue
    if (env.hasOwnProperty(inputArray[i])) {
      console.log('typeof', typeof (env[inputArray[i]]))
      if (typeof (env[inputArray[i]]) !== 'object' && !envFunctions.includes(inputArray[i])) inputArray[i] = env[inputArray[i]]
    }
  }
  if (!inputArray.includes('(')) {
    console.log('simple expression')
    key = inputArray[0]
    if (env.hasOwnProperty(key)) {
      finalResult = env[key](inputArray.slice(1))
      console.log('finalResult', finalResult)
    }
  } else {
    console.log('has brackets')
    let finalSlice = []
    while (inputArray.length !== 3) {
      expression = simpleExpression(inputArray)
      console.log('expression', expression)
      finalResult = sExpressionParser(convertToString(expression[0]))
      console.log('final result1', finalResult)
      if (finalResult.length < 1) return finalResult
      let openBracePos = expression[1]
      let closeBracePos = expression[2]
      console.log('openBracePos', openBracePos, 'closeBracePos', closeBracePos)
      let firstSlice = inputArray.slice(0, openBracePos)
      let secondSlice = inputArray.slice(closeBracePos + 1)
      console.log('firstSlice', firstSlice, 'secondSlice', secondSlice)
      finalSlice = firstSlice.concat([finalResult]).concat(secondSlice)
      console.log('finalSlice', finalSlice)
      inputArray = finalSlice.slice()
      // if (typeof (inputArray[0]) === 'boolean') return inputArray
    }
    finalResult = arithmeticEvaluator(inputArray)
  }
  return finalResult
}

// S Expression Parser --------------------------------------------------------------------------------------------
let sExpressionParser = (input) => {
  input = input.trim()
  console.log('sExpinp', input)
  console.log('props', props)
  if (!input.startsWith('(')) return null
  let openBraceCount = 0
  let openBracePos = []
  let openIndex = 0
  let closeBraceCount = 0
  let closeBracePos = []
  let closeIndex = 0

  input = input.substr(1).slice(0, -1)
  input = input.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ')
  console.log('removed braces', input)
  let inputArray = input.split(' ')
  console.log('inputArray', inputArray)
  inputArray = inputArray.filter((ele) => { return /\S/.test(ele) })
  console.log('inputArray without spaces', inputArray)
  for (let i = 0; i < inputArray.length; i++) {
    if (inputArray[i] === '(') {
      openBraceCount++
      openBracePos[openIndex++] = i
    }
    if (inputArray[i] === ')') {
      closeBraceCount++
      closeBracePos[closeIndex++] = i
    }
  }
  openBracePos.reverse()
  console.log('openBraceCount', openBraceCount, 'closeBraceCount', closeBraceCount)
  console.log('openBracePos', openBracePos, 'closeBracePos', closeBracePos)
  while (openBraceCount !== closeBraceCount) {
    if (openBraceCount > closeBraceCount) {
      inputArray = inputArray.slice(openBracePos[openBracePos.length - 1] + 1)
      openBraceCount--
      console.log('modified input1', inputArray)
    } else {
      inputArray = inputArray.slice(0, closeBracePos[closeBracePos.length - 1])
      closeBraceCount--
      console.log('modified input2', inputArray)
    }
  }

  let result = identifierParser(inputArray)
  console.log('result in sExpression', result)
  if (result === null) return null
  return result
}

// ---------------------------------------------------------------------------------------------------------
let spaceParser = input => input.match(/^[\n*\s\n*]/) ? [null, input.slice(input.match(/\S/).index)] : null
let commaParser = input => input.startsWith(',') ? [null, input.slice(1)] : null

let expressionParser = factoryParser(numberParser, symbolParser, sExpressionParser, listParser)
let valueParser = factoryParser(numberParser, symbolParser, listParser)
function evaluator (input) {
  console.log('inp', input)
  // can be replaced by trim???
  let spaceCheck
  input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
  console.log('new input', input)
  let id = []
  let parsePass

  parsePass = expressionParser(input)
  console.log('parsePass', parsePass)
  if (parsePass === null) {
    if (env.hasOwnProperty(input)) return env[input]
    return null
  }
  if (parsePass !== null) {
    id = parsePass
    console.log('return id', id)
    return id
  }
}
