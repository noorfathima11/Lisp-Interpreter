// works until fact
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
  'car': function lambda (x) { return x[0] }
}

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

let props = Object.keys(env)
let arithmeticOperators = ['+', '-', '*', '/', '>', '<', '>=', '<=', '===']

// Block of parsers -----------------------------------------------------------------------------------------------------------------------------------------------------
let numberParser = (input, num, regEx = /^(-?(0|[1-9]\d*))(\.\d+)?(((e)(\+|-)?)\d+)?/ig) => (num = input.match(regEx)) ? [num[0] * 1] : null

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
  return actual
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
  console.log('quote sliced inputArray', inputArray.join(' '))
  return inputArray.join(' ')
}

// Conditional Interpreter -----------------------------------------------------------------------------------
let conditionalInterpreter = (inputArray) => {
  console.log('conditional input', inputArray)
  inputArray = inputArray.slice(1)
  console.log('inputArray in cond', inputArray)
  let cond = simpleExpression(inputArray)
  console.log('simple cond received', cond)
  if (cond === 'not simple') {
    cond = nestedExpression(inputArray)
    console.log('nested cond received', cond)
  }
  let conseq = simpleExpression(inputArray.slice(cond.length))
  console.log('simple conseq received', conseq)
  if (conseq === 'not simple') {
    conseq = nestedExpression(inputArray.slice(cond.length))
    console.log('nested conseq received', conseq)
  }
  let alt = simpleExpression(inputArray.slice(cond.length + conseq.length))
  console.log('simple alt received', alt)
  if (alt === 'not simple') {
    alt = nestedExpression(inputArray.slice(cond.length + conseq.length))
    console.log('nested alt received', alt)
  }
  let isCond
  if (cond.length === 1) {
    isCond = expressionParser(cond)
    console.log('here', isCond)
  } else {
    isCond = expressionParser(cond.join(' '))
    console.log('isCond', isCond)
  }

  if (isCond) {
    let isConseq
    if (conseq.length === 1) {
      if (typeof (conseq) === 'object') {
        isConseq = expressionParser(JSON.stringify(conseq))
        console.log('stringified isConseq', isConseq)
      }
      if (typeof (isConseq) === 'object') {
        console.log('it is an array')
        return isConseq[0]
      }
      isConseq = expressionParser(conseq.join(' '))
      console.log('here1', isConseq)
      return isConseq
    }
    isConseq = expressionParser(conseq.join(' '))
    console.log('isConseq', isConseq)
    return isConseq
  }
  let isAlt
  if (alt.length === 1) {
    if (typeof (alt) === 'object') {
      isAlt = expressionParser(JSON.stringify(alt))
      console.log('stringified isAlt', isAlt)
    }
    if (typeof (isAlt) === 'object') {
      console.log('it is an array')
      return isAlt[0]
    }
    isAlt = expressionParser(alt.join(' '))
    console.log('here2', isAlt)
    return isAlt
  }
  isAlt = expressionParser(alt.join(' '))
  console.log('isAlt', isAlt)
  return isAlt
}
function simpleExpression (inputArray) {
  console.log('simple expression', inputArray)
  let openBracePos = []
  let openBraceCount = 0
  let j = 0
  let closeBracePos = []
  let k = 0
  let key
  if (inputArray[0] !== '(') {
    return inputArray[0].split('')
  }
  for (let i = 0; i < inputArray.length; i++) {
    if (inputArray[i] === '(') {
      openBracePos[j++] = i
      console.log('openBracePos, j', openBracePos, j)
      openBraceCount++
      if (openBraceCount > 1) return 'not simple'
      key = inputArray[i + 1]
      console.log('key in cond', key)
    }
    if (inputArray[i] === ')') {
      closeBracePos[k++] = i
      console.log('closeBracePos, k', closeBracePos, k)
      if (closeBracePos[k - 1] - openBracePos[j - 1] === 4) {
        console.log('diff is 4')
        return inputArray.slice(openBracePos[j - 1], closeBracePos[k - 1] + 1)
      }
    }
  }
  return null
}
function nestedExpression1 (inputArray) {
  let openBracePos = []
  let j = 0
  let closeBracePos = []
  let k = 0
  let key
  for (let i = 1; i < inputArray.length; i++) {
    if (inputArray[i] === '(') {
      openBracePos[j++] = i
      key = inputArray[i + 1]
      console.log('key in cond', key)
    }
    console.log('openBracePos, j-1', openBracePos, j - 1)
    if (inputArray[i] === ')') {
      closeBracePos[k++] = i
      console.log('closeBracePos, k', closeBracePos, k)
      if (closeBracePos[k - 1] - openBracePos[j - 1] === 4) {
        console.log('diff is 4')
        openBracePos.splice(--j)
        console.log('spliced openBracePos', openBracePos)
        closeBracePos.splice(--k)
        console.log('spliced closeBracePos', closeBracePos)
      } else {
        console.log('diff is not 4')
        console.log('diff is ' + (closeBracePos[k - 1] - openBracePos[j - 1]))
        console.log('cond', inputArray.slice(openBracePos[j - 1], closeBracePos[k - 1] + 1))
        return inputArray.slice(openBracePos[j - 1], closeBracePos[k - 1] + 1)
      }
    }
  }
}

function nestedExpression (inputArray) {
  let openBracePos = []
  let openIndex = 0
  let closeBracePos = []
  let closeIndex = 0
  for (let i = 1; i < inputArray.length; i++) {
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
  let finalResult = expressionParser(value.join(' '))
  console.log('finalResult', finalResult)
  if (finalResult === null) return null
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
  let params = inputArray.slice(1)
  console.log('parameters', params)
  let evalParams = expressionParser(params.join(' '))
  console.log('evalParams', evalParams)
  evalParams = evalParams.toString().split(' ')
  console.log('evalParamsArray', evalParams)
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
  console.log('updated local env', env)
  for (let key in env[proc].args) {
    for (let i = 0; i < env[proc].eval.length; i++) {
      if (env[proc].eval[i] === key) {
        env[proc].eval[i] = env[proc].args[key]
        console.log('mapped', env[proc].eval[i])
      }
      if (variable.test(env[proc].eval[i])) {
        console.log('yes', env[proc].eval[i])
        if (env.hasOwnProperty(env[proc].eval[i]) && (env[proc].eval[i] !== proc)) {
          env[proc].eval[i] = env[env[proc].eval[i]]
        }
      }
    }
  }

  console.log('updated local env1', env)

  // send eval to sExpression parser
  let result = sExpressionParser(env[proc].eval.join(' '))
  console.log('evaluated result', result)
  return result
}

// arithmetic evaluator ------------------------------------------------------------------------------------------
let arithmeticEvaluator = (inputArray) => {
  console.log('eval', inputArray)
  let key
  let finalResult
  let expression
  let inputString
  if (!arithmeticOperators.includes(inputArray[0])) return 'error'
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
      expression = nestedExpression(inputArray)
      console.log('expression', expression)
      finalResult = sExpressionParser(expression[0].join(' '))
      console.log('final result1', finalResult)
      let openBracePos = expression[1]
      let closeBracePos = expression[2]
      console.log('openBracePos', openBracePos, 'closeBracePos', closeBracePos)
      let firstSlice = inputArray.slice(0, openBracePos)
      let secondSlice = inputArray.slice(closeBracePos + 1)
      console.log('firstSlice', firstSlice, 'secondSlice', secondSlice)
      finalSlice = firstSlice.concat([finalResult]).concat(secondSlice)
      console.log('finalSlice', finalSlice)
      inputArray = finalSlice.slice()
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
  if (result === null) return null
  return result
}

// ---------------------------------------------------------------------------------------------------------
let spaceParser = input => input.match(/^[\n*\s\n*]/) ? [null, input.slice(input.match(/\S/).index)] : null
let commaParser = input => input.startsWith(',') ? [null, input.slice(1)] : null

let expressionParser = factoryParser(numberParser, symbolParser, sExpressionParser)

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
